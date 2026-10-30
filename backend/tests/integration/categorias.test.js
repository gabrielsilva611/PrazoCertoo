const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

const emailDono = `teste-categorias-${Date.now()}@exemplo.com`;
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
  await prisma.categoria.deleteMany({ where: { negocioId } });
  await prisma.usuario.deleteMany({ where: { email: emailDono } });
  await prisma.$disconnect();
});

function autenticado(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('POST /categorias', () => {
  test('cria categoria com nome (RF20)', async () => {
    const resposta = await autenticado(request(app).post('/categorias')).send({ nome: 'Perfumes' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.categoria).toMatchObject({ nome: 'Perfumes', negocioId });
  });

  test('rejeita sem nome com 400', async () => {
    const resposta = await autenticado(request(app).post('/categorias')).send({});
    expect(resposta.status).toBe(400);
  });

  test('rejeita sem token com 401', async () => {
    const resposta = await request(app).post('/categorias').send({ nome: 'X' });
    expect(resposta.status).toBe(401);
  });
});

describe('fluxo de listagem, edição e exclusão', () => {
  let categoriaId;

  beforeAll(async () => {
    const resposta = await autenticado(request(app).post('/categorias')).send({ nome: 'Cosméticos' });
    categoriaId = resposta.body.categoria.id;
  });

  test('aparece na listagem', async () => {
    const resposta = await autenticado(request(app).get('/categorias'));
    expect(resposta.body.categorias.some((c) => c.id === categoriaId)).toBe(true);
  });

  test('PUT /categorias/:id atualiza os dados', async () => {
    const resposta = await autenticado(request(app).put(`/categorias/${categoriaId}`)).send({
      nome: 'Cosméticos e Higiene',
    });
    expect(resposta.body.categoria.nome).toBe('Cosméticos e Higiene');
  });

  test('DELETE /categorias/:id remove quando não está em uso', async () => {
    const resposta = await autenticado(request(app).delete(`/categorias/${categoriaId}`));
    expect(resposta.status).toBe(204);

    const lista = await autenticado(request(app).get('/categorias'));
    expect(lista.body.categorias.some((c) => c.id === categoriaId)).toBe(false);
  });

  test('DELETE em categoria inexistente retorna 404', async () => {
    const resposta = await autenticado(request(app).delete(`/categorias/${categoriaId}`));
    expect(resposta.status).toBe(404);
  });
});

describe('exclusão com categoria em uso', () => {
  test('DELETE retorna 409 quando a categoria está vinculada a um produto', async () => {
    const categoria = await autenticado(request(app).post('/categorias')).send({ nome: 'Em Uso' });
    const categoriaId = categoria.body.categoria.id;

    // Produto ainda não tem rota própria (vem no próximo PR) — criado direto
    // via Prisma só pra exercitar a restrição de FK.
    const produto = await prisma.produto.create({
      data: {
        negocioId,
        categoriaId,
        nome: 'Produto de Teste',
        unidade: 'un',
        precoCusto: 10,
        precoVenda: 20,
        estoqueMinimo: 1,
      },
    });

    const resposta = await autenticado(request(app).delete(`/categorias/${categoriaId}`));
    expect(resposta.status).toBe(409);

    await prisma.produto.delete({ where: { id: produto.id } });
  });
});

describe('isolamento multi-tenant (RN08)', () => {
  test('um negócio não vê as categorias de outro', async () => {
    const outroEmail = `teste-outro-negocio-cat-${Date.now()}@exemplo.com`;
    const outroRegistro = await request(app)
      .post('/auth/registro')
      .send({ nome: 'Outro Dono', email: outroEmail, senha });
    const outroToken = outroRegistro.body.token;

    await autenticado(request(app).post('/categorias')).send({ nome: 'Categoria Privada' });

    const listaDoOutro = await request(app)
      .get('/categorias')
      .set('Authorization', `Bearer ${outroToken}`);
    expect(listaDoOutro.body.categorias).toHaveLength(0);

    await prisma.usuario.deleteMany({ where: { email: outroEmail } });
  });
});
