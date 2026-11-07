const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

const emailDono = `teste-inventarios-${Date.now()}@exemplo.com`;
const senha = 'senhaDeTeste123';

let token;
let negocioId;
let produtoId;
let inventarioId;

beforeAll(async () => {
  const registro = await request(app)
    .post('/auth/registro')
    .send({ nome: 'Dono de Teste', email: emailDono, senha });
  token = registro.body.token;
  negocioId = registro.body.usuario.id;

  const produto = await autenticado(request(app).post('/produtos')).send({
    nome: 'Perfume Malbec',
    unidade: 'un',
    precoCusto: 30,
    precoVenda: 70,
    estoqueMinimo: 2,
  });
  produtoId = produto.body.produto.id;

  await autenticado(request(app).post(`/produtos/${produtoId}/movimentacoes`)).send({
    tipo: 'ENTRADA',
    quantidade: 10,
  });
});

afterAll(async () => {
  await prisma.inventarioItem.deleteMany({ where: { inventario: { negocioId } } });
  await prisma.inventario.deleteMany({ where: { negocioId } });
  await prisma.movimentacaoEstoque.deleteMany({ where: { produtoId } });
  await prisma.produto.deleteMany({ where: { negocioId } });
  await prisma.usuario.deleteMany({ where: { negocioId } });
  await prisma.$disconnect();
});

function autenticado(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('POST /inventarios', () => {
  test('abre um inventário ABERTO para o negócio (RF28)', async () => {
    const resposta = await autenticado(request(app).post('/inventarios'));

    expect(resposta.status).toBe(201);
    expect(resposta.body.inventario).toMatchObject({ status: 'ABERTO', negocioId });
    inventarioId = resposta.body.inventario.id;
  });

  test('rejeita abrir um segundo inventário enquanto o primeiro está aberto, com 409', async () => {
    const resposta = await autenticado(request(app).post('/inventarios'));
    expect(resposta.status).toBe(409);
  });

  test('rejeita quando o usuário não é Dono, com 403 (RN13)', async () => {
    const idFuncionario = crypto.randomUUID();
    await prisma.usuario.create({
      data: {
        id: idFuncionario,
        negocioId,
        nome: 'Funcionário de Teste',
        email: `teste-funcionario-inv-${Date.now()}@exemplo.com`,
        senhaHash: 'hash-fake-nao-usado-no-login',
        perfil: 'FUNCIONARIO',
      },
    });
    const tokenFuncionario = jwt.sign(
      { sub: idFuncionario, negocioId, perfil: 'FUNCIONARIO' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    const resposta = await request(app)
      .post('/inventarios')
      .set('Authorization', `Bearer ${tokenFuncionario}`);

    expect(resposta.status).toBe(403);
  });
});

describe('fluxo de contagem e conclusão', () => {
  test('rejeita item sem justificativa quando há divergência, com 409', async () => {
    const resposta = await autenticado(request(app).put(`/inventarios/${inventarioId}/itens`)).send({
      produtoId,
      saldoFisico: 7,
    });

    expect(resposta.status).toBe(409);
  });

  test('aceita a contagem com justificativa e calcula a diferença (RF28)', async () => {
    const resposta = await autenticado(request(app).put(`/inventarios/${inventarioId}/itens`)).send({
      produtoId,
      saldoFisico: 7,
      justificativa: 'Três unidades quebradas na gôndola',
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.item).toMatchObject({ saldoSistema: 10, saldoFisico: 7, diferenca: -3 });
  });

  test('editar a contagem do mesmo produto atualiza o item em vez de duplicar', async () => {
    await autenticado(request(app).put(`/inventarios/${inventarioId}/itens`)).send({
      produtoId,
      saldoFisico: 8,
      justificativa: 'Recontagem',
    });

    const detalhe = await autenticado(request(app).get(`/inventarios/${inventarioId}`));
    const itensDoProduto = detalhe.body.inventario.itens.filter((i) => i.produtoId === produtoId);
    expect(itensDoProduto).toHaveLength(1);
    expect(itensDoProduto[0].saldoFisico).toBe(8);
  });

  test('PATCH /inventarios/:id/concluir aplica a divergência como movimentação INVENTARIO', async () => {
    const resposta = await autenticado(request(app).patch(`/inventarios/${inventarioId}/concluir`));

    expect(resposta.status).toBe(200);
    expect(resposta.body.inventario.status).toBe('CONCLUIDO');

    const produto = await autenticado(request(app).get(`/produtos/${produtoId}`));
    expect(produto.body.produto.saldoAtual).toBe(8);

    const movimentacoes = await autenticado(request(app).get(`/produtos/${produtoId}/movimentacoes`));
    expect(movimentacoes.body.movimentacoes[0]).toMatchObject({
      tipo: 'INVENTARIO',
      saldoAnterior: 10,
      saldoPosterior: 8,
    });
  });

  test('rejeita novo item após a conclusão, com 409', async () => {
    const resposta = await autenticado(request(app).put(`/inventarios/${inventarioId}/itens`)).send({
      produtoId,
      saldoFisico: 1,
      justificativa: 'Tentativa depois de concluído',
    });

    expect(resposta.status).toBe(409);
  });

  test('rejeita concluir de novo, com 409', async () => {
    const resposta = await autenticado(request(app).patch(`/inventarios/${inventarioId}/concluir`));
    expect(resposta.status).toBe(409);
  });
});

describe('validações e isolamento', () => {
  let outroInventarioId;

  beforeAll(async () => {
    const aberto = await autenticado(request(app).post('/inventarios'));
    outroInventarioId = aberto.body.inventario.id;
  });

  test('rejeita concluir inventário sem nenhum item, com 409', async () => {
    const resposta = await autenticado(request(app).patch(`/inventarios/${outroInventarioId}/concluir`));
    expect(resposta.status).toBe(409);
  });

  test('rejeita produtoId inexistente no item, com 404', async () => {
    const resposta = await autenticado(
      request(app).put(`/inventarios/${outroInventarioId}/itens`),
    ).send({ produtoId: '00000000-0000-0000-0000-000000000000', saldoFisico: 1 });

    expect(resposta.status).toBe(404);
  });

  test('um negócio não vê os inventários de outro (RN08)', async () => {
    const outroEmail = `teste-outro-negocio-inv-${Date.now()}@exemplo.com`;
    const outroRegistro = await request(app)
      .post('/auth/registro')
      .send({ nome: 'Outro Dono', email: outroEmail, senha });
    const outroToken = outroRegistro.body.token;

    const listaDoOutro = await request(app)
      .get('/inventarios')
      .set('Authorization', `Bearer ${outroToken}`);
    expect(listaDoOutro.body.inventarios).toHaveLength(0);

    await prisma.usuario.deleteMany({ where: { email: outroEmail } });
  });

  test('rejeita sem token com 401', async () => {
    const resposta = await request(app).get('/inventarios');
    expect(resposta.status).toBe(401);
  });
});
