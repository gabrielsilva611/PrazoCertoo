const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

const emailDono = `teste-produtos-${Date.now()}@exemplo.com`;
const senha = 'senhaDeTeste123';

let token;
let negocioId;

beforeAll(async () => {
  const registro = await request(app)
    .post('/auth/registro')
    .send({ nome: 'Dono de Teste', email: emailDono, senha });
  token = registro.body.token;
  negocioId = registro.body.usuario.id;
});

afterAll(async () => {
  await prisma.produto.deleteMany({ where: { negocioId } });
  await prisma.categoria.deleteMany({ where: { negocioId } });
  await prisma.usuario.deleteMany({ where: { email: emailDono } });
  await prisma.$disconnect();
});

function autenticado(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

function produtoValido(extra = {}) {
  return {
    nome: 'Perfume 212 VIP Rosa',
    unidade: 'un',
    precoCusto: 50,
    precoVenda: 120,
    estoqueMinimo: 5,
    ...extra,
  };
}

describe('POST /produtos', () => {
  test('cria produto e calcula o capital imobilizado a partir do saldo inicial 0 (RF21, RF27)', async () => {
    const resposta = await autenticado(request(app).post('/produtos')).send(produtoValido());

    expect(resposta.status).toBe(201);
    expect(resposta.body.produto).toMatchObject({
      nome: 'Perfume 212 VIP Rosa',
      saldoAtual: 0,
      ativo: true,
      negocioId,
    });
    expect(resposta.body.produto.capitalImobilizado).toBe(0);
  });

  test('rejeita sem nome com 400', async () => {
    const resposta = await autenticado(request(app).post('/produtos')).send(
      produtoValido({ nome: undefined }),
    );
    expect(resposta.status).toBe(400);
  });

  test('rejeita preço de custo negativo com 400', async () => {
    const resposta = await autenticado(request(app).post('/produtos')).send(
      produtoValido({ precoCusto: -10 }),
    );
    expect(resposta.status).toBe(400);
  });

  test('rejeita sem token com 401', async () => {
    const resposta = await request(app).post('/produtos').send(produtoValido());
    expect(resposta.status).toBe(401);
  });

  test('ignora saldoAtual enviado pelo cliente — só muda via movimentação de estoque', async () => {
    const resposta = await autenticado(request(app).post('/produtos')).send(
      produtoValido({ saldoAtual: 999 }),
    );
    expect(resposta.body.produto.saldoAtual).toBe(0);
  });

  test('rejeita categoriaId inexistente com 404', async () => {
    const resposta = await autenticado(request(app).post('/produtos')).send(
      produtoValido({ categoriaId: '00000000-0000-0000-0000-000000000000' }),
    );
    expect(resposta.status).toBe(404);
  });

  test('aceita categoriaId válida e a retorna no produto', async () => {
    const categoria = await autenticado(request(app).post('/categorias')).send({ nome: 'Perfumes' });
    const resposta = await autenticado(request(app).post('/produtos')).send(
      produtoValido({ categoriaId: categoria.body.categoria.id }),
    );
    expect(resposta.status).toBe(201);
    expect(resposta.body.produto.categoriaId).toBe(categoria.body.categoria.id);
  });
});

describe('edição da categoria do produto', () => {
  test('PUT com categoriaId: null remove a categoria do produto', async () => {
    const categoria = await autenticado(request(app).post('/categorias')).send({ nome: 'Higiene' });
    const criado = await autenticado(request(app).post('/produtos')).send(
      produtoValido({ categoriaId: categoria.body.categoria.id }),
    );

    const resposta = await autenticado(request(app).put(`/produtos/${criado.body.produto.id}`)).send({
      categoriaId: null,
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.produto.categoriaId).toBeNull();
  });
});

describe('fluxo de listagem, edição e desativação', () => {
  let produtoId;

  beforeAll(async () => {
    const resposta = await autenticado(request(app).post('/produtos')).send(
      produtoValido({ nome: 'Produto do Fluxo' }),
    );
    produtoId = resposta.body.produto.id;
  });

  test('aparece na listagem', async () => {
    const resposta = await autenticado(request(app).get('/produtos'));
    expect(resposta.body.produtos.some((p) => p.id === produtoId)).toBe(true);
  });

  test('GET /produtos com categoriaId mal formatado retorna 400, não 500', async () => {
    const resposta = await autenticado(request(app).get('/produtos?categoriaId=abc'));
    expect(resposta.status).toBe(400);
  });

  test('GET /produtos/:id retorna o detalhe com capital imobilizado', async () => {
    const resposta = await autenticado(request(app).get(`/produtos/${produtoId}`));
    expect(resposta.status).toBe(200);
    expect(resposta.body.produto.capitalImobilizado).toBe(0);
  });

  test('PUT /produtos/:id atualiza os dados', async () => {
    const resposta = await autenticado(request(app).put(`/produtos/${produtoId}`)).send({
      precoVenda: 150,
    });
    expect(Number(resposta.body.produto.precoVenda)).toBe(150);
  });

  test('PATCH /produtos/:id/desativar remove da listagem padrão, mas preserva o registro', async () => {
    const desativar = await autenticado(request(app).patch(`/produtos/${produtoId}/desativar`));
    expect(desativar.status).toBe(204);

    const listaPadrao = await autenticado(request(app).get('/produtos'));
    expect(listaPadrao.body.produtos.some((p) => p.id === produtoId)).toBe(false);

    const comInativos = await autenticado(request(app).get('/produtos?incluirInativos=true'));
    const produto = comInativos.body.produtos.find((p) => p.id === produtoId);
    expect(produto).toBeDefined();
    expect(produto.ativo).toBe(false);
  });
});

describe('isolamento multi-tenant (RN08)', () => {
  test('um negócio não vê os produtos de outro', async () => {
    const outroEmail = `teste-outro-negocio-produtos-${Date.now()}@exemplo.com`;
    const outroRegistro = await request(app)
      .post('/auth/registro')
      .send({ nome: 'Outro Dono', email: outroEmail, senha });
    const outroToken = outroRegistro.body.token;

    await autenticado(request(app).post('/produtos')).send(produtoValido({ nome: 'Produto Privado' }));

    const listaDoOutro = await request(app).get('/produtos').set('Authorization', `Bearer ${outroToken}`);
    expect(listaDoOutro.body.produtos).toHaveLength(0);

    await prisma.usuario.deleteMany({ where: { email: outroEmail } });
  });
});
