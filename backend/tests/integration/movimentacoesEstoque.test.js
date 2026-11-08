const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

const emailDono = `teste-movimentacoes-${Date.now()}@exemplo.com`;
const senha = 'senhaDeTeste123';

let token;
let negocioId;
let produtoId;

beforeAll(async () => {
  const registro = await request(app)
    .post('/auth/registro')
    .send({ nome: 'Dono de Teste', email: emailDono, senha });
  token = registro.body.token;
  negocioId = registro.body.usuario.id;

  const produto = await autenticado(request(app).post('/produtos')).send({
    nome: 'Perfume Kaiak',
    unidade: 'un',
    precoCusto: 40,
    precoVenda: 90,
    estoqueMinimo: 3,
  });
  produtoId = produto.body.produto.id;
});

afterAll(async () => {
  await prisma.movimentacaoEstoque.deleteMany({ where: { produtoId } });
  await prisma.produto.deleteMany({ where: { negocioId } });
  await prisma.usuario.deleteMany({ where: { email: emailDono } });
  await prisma.$disconnect();
});

function autenticado(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('POST /produtos/:produtoId/movimentacoes', () => {
  test('ENTRADA soma ao saldo e retorna o histórico atualizado (RF23)', async () => {
    const resposta = await autenticado(
      request(app).post(`/produtos/${produtoId}/movimentacoes`),
    ).send({ tipo: 'ENTRADA', quantidade: 10 });

    expect(resposta.status).toBe(201);
    expect(resposta.body.movimentacao).toMatchObject({
      tipo: 'ENTRADA',
      quantidade: 10,
      saldoAnterior: 0,
      saldoPosterior: 10,
    });

    const produto = await autenticado(request(app).get(`/produtos/${produtoId}`));
    expect(produto.body.produto.saldoAtual).toBe(10);
  });

  test('SAIDA subtrai do saldo (RF24)', async () => {
    const resposta = await autenticado(
      request(app).post(`/produtos/${produtoId}/movimentacoes`),
    ).send({ tipo: 'SAIDA', quantidade: 4 });

    expect(resposta.status).toBe(201);
    expect(resposta.body.movimentacao).toMatchObject({
      tipo: 'SAIDA',
      quantidade: 4,
      saldoAnterior: 10,
      saldoPosterior: 6,
    });
  });

  test('AJUSTE aceita delta negativo e aplica direto no saldo (RF25)', async () => {
    const resposta = await autenticado(
      request(app).post(`/produtos/${produtoId}/movimentacoes`),
    ).send({ tipo: 'AJUSTE', quantidade: -2, motivo: 'Produto danificado' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.movimentacao).toMatchObject({
      tipo: 'AJUSTE',
      quantidade: 2,
      saldoAnterior: 6,
      saldoPosterior: 4,
      motivo: 'Produto danificado',
    });
  });

  test('rejeita SAIDA que deixaria o saldo negativo sem motivo, com 409', async () => {
    const resposta = await autenticado(
      request(app).post(`/produtos/${produtoId}/movimentacoes`),
    ).send({ tipo: 'SAIDA', quantidade: 999 });

    expect(resposta.status).toBe(409);
  });

  test('aceita a mesma SAIDA quando vem com motivo explícito (RN10)', async () => {
    const resposta = await autenticado(
      request(app).post(`/produtos/${produtoId}/movimentacoes`),
    ).send({ tipo: 'SAIDA', quantidade: 999, motivo: 'Baixa manual para auditoria' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.movimentacao.saldoPosterior).toBeLessThan(0);
  });

  test('duas movimentações concorrentes no mesmo produto não se perdem (lost update)', async () => {
    const produtoConcorrente = await autenticado(request(app).post('/produtos')).send({
      nome: 'Perfume Concorrência',
      unidade: 'un',
      precoCusto: 10,
      precoVenda: 20,
      estoqueMinimo: 0,
    });
    const idConcorrente = produtoConcorrente.body.produto.id;

    await autenticado(
      request(app).post(`/produtos/${idConcorrente}/movimentacoes`),
    ).send({ tipo: 'ENTRADA', quantidade: 100 });

    const [resposta1, resposta2] = await Promise.all([
      autenticado(request(app).post(`/produtos/${idConcorrente}/movimentacoes`)).send({
        tipo: 'SAIDA',
        quantidade: 10,
      }),
      autenticado(request(app).post(`/produtos/${idConcorrente}/movimentacoes`)).send({
        tipo: 'SAIDA',
        quantidade: 10,
      }),
    ]);

    expect(resposta1.status).toBe(201);
    expect(resposta2.status).toBe(201);

    const produto = await autenticado(request(app).get(`/produtos/${idConcorrente}`));
    expect(produto.body.produto.saldoAtual).toBe(80);

    await prisma.movimentacaoEstoque.deleteMany({ where: { produtoId: idConcorrente } });
    await prisma.produto.deleteMany({ where: { id: idConcorrente } });
  });

  test('rejeita quantidade zero para AJUSTE com 400', async () => {
    const resposta = await autenticado(
      request(app).post(`/produtos/${produtoId}/movimentacoes`),
    ).send({ tipo: 'AJUSTE', quantidade: 0 });

    expect(resposta.status).toBe(400);
  });

  test('rejeita quantidade negativa para ENTRADA com 400', async () => {
    const resposta = await autenticado(
      request(app).post(`/produtos/${produtoId}/movimentacoes`),
    ).send({ tipo: 'ENTRADA', quantidade: -5 });

    expect(resposta.status).toBe(400);
  });

  test('rejeita fornecedorId inexistente com 404', async () => {
    const resposta = await autenticado(
      request(app).post(`/produtos/${produtoId}/movimentacoes`),
    ).send({
      tipo: 'ENTRADA',
      quantidade: 1,
      fornecedorId: '00000000-0000-0000-0000-000000000000',
    });

    expect(resposta.status).toBe(404);
  });

  test('rejeita produto de outro negócio com 404', async () => {
    const outroEmail = `teste-outro-negocio-mov-${Date.now()}@exemplo.com`;
    const outroRegistro = await request(app)
      .post('/auth/registro')
      .send({ nome: 'Outro Dono', email: outroEmail, senha });
    const outroToken = outroRegistro.body.token;

    const resposta = await request(app)
      .post(`/produtos/${produtoId}/movimentacoes`)
      .set('Authorization', `Bearer ${outroToken}`)
      .send({ tipo: 'ENTRADA', quantidade: 1 });

    expect(resposta.status).toBe(404);
    await prisma.usuario.deleteMany({ where: { email: outroEmail } });
  });

  test('rejeita sem token com 401', async () => {
    const resposta = await request(app)
      .post(`/produtos/${produtoId}/movimentacoes`)
      .send({ tipo: 'ENTRADA', quantidade: 1 });

    expect(resposta.status).toBe(401);
  });
});

describe('GET /produtos/:produtoId/movimentacoes', () => {
  test('lista o histórico do produto, mais recente primeiro (RF26)', async () => {
    const resposta = await autenticado(request(app).get(`/produtos/${produtoId}/movimentacoes`));

    expect(resposta.status).toBe(200);
    expect(resposta.body.movimentacoes.length).toBeGreaterThan(0);
    const datas = resposta.body.movimentacoes.map((m) => new Date(m.criadoEm).getTime());
    expect(datas).toEqual([...datas].sort((a, b) => b - a));
  });

  test('retorna 404 para produto inexistente', async () => {
    const resposta = await autenticado(
      request(app).get('/produtos/00000000-0000-0000-0000-000000000000/movimentacoes'),
    );

    expect(resposta.status).toBe(404);
  });
});
