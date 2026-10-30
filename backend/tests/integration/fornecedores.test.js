const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

const emailDono = `teste-fornecedores-${Date.now()}@exemplo.com`;
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
  await prisma.fornecedor.deleteMany({ where: { negocioId } });
  await prisma.usuario.deleteMany({ where: { email: emailDono } });
  await prisma.$disconnect();
});

function autenticado(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('POST /fornecedores', () => {
  test('cria fornecedor com nome (RF22)', async () => {
    const resposta = await autenticado(request(app).post('/fornecedores')).send({
      nome: 'Distribuidora ABC',
      contato: '(47) 99999-0000',
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.fornecedor).toMatchObject({ nome: 'Distribuidora ABC', negocioId });
  });

  test('rejeita sem nome com 400', async () => {
    const resposta = await autenticado(request(app).post('/fornecedores')).send({});
    expect(resposta.status).toBe(400);
  });

  test('rejeita sem token com 401', async () => {
    const resposta = await request(app).post('/fornecedores').send({ nome: 'X' });
    expect(resposta.status).toBe(401);
  });
});

describe('fluxo de listagem, edição e exclusão', () => {
  let fornecedorId;

  beforeAll(async () => {
    const resposta = await autenticado(request(app).post('/fornecedores')).send({ nome: 'Fornecedor X' });
    fornecedorId = resposta.body.fornecedor.id;
  });

  test('aparece na listagem', async () => {
    const resposta = await autenticado(request(app).get('/fornecedores'));
    expect(resposta.body.fornecedores.some((f) => f.id === fornecedorId)).toBe(true);
  });

  test('PUT /fornecedores/:id atualiza os dados', async () => {
    const resposta = await autenticado(request(app).put(`/fornecedores/${fornecedorId}`)).send({
      contato: '(47) 90000-0000',
    });
    expect(resposta.body.fornecedor.contato).toBe('(47) 90000-0000');
  });

  test('DELETE /fornecedores/:id remove quando não está em uso', async () => {
    const resposta = await autenticado(request(app).delete(`/fornecedores/${fornecedorId}`));
    expect(resposta.status).toBe(204);

    const lista = await autenticado(request(app).get('/fornecedores'));
    expect(lista.body.fornecedores.some((f) => f.id === fornecedorId)).toBe(false);
  });

  test('DELETE em fornecedor inexistente retorna 404', async () => {
    const resposta = await autenticado(request(app).delete(`/fornecedores/${fornecedorId}`));
    expect(resposta.status).toBe(404);
  });
});

describe('isolamento multi-tenant (RN08)', () => {
  test('um negócio não vê os fornecedores de outro', async () => {
    const outroEmail = `teste-outro-negocio-forn-${Date.now()}@exemplo.com`;
    const outroRegistro = await request(app)
      .post('/auth/registro')
      .send({ nome: 'Outro Dono', email: outroEmail, senha });
    const outroToken = outroRegistro.body.token;

    await autenticado(request(app).post('/fornecedores')).send({ nome: 'Fornecedor Privado' });

    const listaDoOutro = await request(app)
      .get('/fornecedores')
      .set('Authorization', `Bearer ${outroToken}`);
    expect(listaDoOutro.body.fornecedores).toHaveLength(0);

    await prisma.usuario.deleteMany({ where: { email: outroEmail } });
  });
});
