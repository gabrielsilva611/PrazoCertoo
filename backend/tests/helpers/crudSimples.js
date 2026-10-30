const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

// Gera a suíte comum de testes de um CRUD simples de cadastro de apoio
// (categoria, fornecedor, ...): criar, listar, editar, excluir e isolamento
// multi-tenant. Esses módulos são estruturalmente idênticos — sem isso, os
// testes de cada um duplicavam quase a suíte inteira (achado do SonarCloud).
// Retorna helpers pra descrições de testes específicas de cada arquivo (ex:
// o guard de exclusão com registro em uso).
function testarCrudSimples({ recurso, singular, plural, campoNome, modeloPrisma, dadosExtras = {} }) {
  const emailDono = `teste-${recurso}-${Date.now()}@exemplo.com`;
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
    await prisma[modeloPrisma].deleteMany({ where: { negocioId } });
    await prisma.usuario.deleteMany({ where: { email: emailDono } });
    await prisma.$disconnect();
  });

  function autenticado(req) {
    return req.set('Authorization', `Bearer ${token}`);
  }

  describe(`POST /${recurso}`, () => {
    test(`cria ${singular} com ${campoNome}`, async () => {
      const resposta = await autenticado(request(app).post(`/${recurso}`)).send({
        [campoNome]: 'Teste Criação',
        ...dadosExtras,
      });

      expect(resposta.status).toBe(201);
      expect(resposta.body[singular]).toMatchObject({ [campoNome]: 'Teste Criação', negocioId });
    });

    test(`rejeita sem ${campoNome} com 400`, async () => {
      const resposta = await autenticado(request(app).post(`/${recurso}`)).send({});
      expect(resposta.status).toBe(400);
    });

    test('rejeita sem token com 401', async () => {
      const resposta = await request(app)
        .post(`/${recurso}`)
        .send({ [campoNome]: 'X' });
      expect(resposta.status).toBe(401);
    });
  });

  describe('fluxo de listagem, edição e exclusão', () => {
    let id;

    beforeAll(async () => {
      const resposta = await autenticado(request(app).post(`/${recurso}`)).send({
        [campoNome]: 'Item do Fluxo',
        ...dadosExtras,
      });
      id = resposta.body[singular].id;
    });

    test('aparece na listagem', async () => {
      const resposta = await autenticado(request(app).get(`/${recurso}`));
      expect(resposta.body[plural].some((item) => item.id === id)).toBe(true);
    });

    test(`PUT /${recurso}/:id atualiza os dados`, async () => {
      const resposta = await autenticado(request(app).put(`/${recurso}/${id}`)).send({
        [campoNome]: 'Item Atualizado',
      });
      expect(resposta.body[singular][campoNome]).toBe('Item Atualizado');
    });

    test(`DELETE /${recurso}/:id remove quando não está em uso`, async () => {
      const resposta = await autenticado(request(app).delete(`/${recurso}/${id}`));
      expect(resposta.status).toBe(204);

      const lista = await autenticado(request(app).get(`/${recurso}`));
      expect(lista.body[plural].some((item) => item.id === id)).toBe(false);
    });

    test(`DELETE em ${singular} inexistente retorna 404`, async () => {
      const resposta = await autenticado(request(app).delete(`/${recurso}/${id}`));
      expect(resposta.status).toBe(404);
    });
  });

  describe('isolamento multi-tenant (RN08)', () => {
    test(`um negócio não vê os ${plural} de outro`, async () => {
      const outroEmail = `teste-outro-negocio-${recurso}-${Date.now()}@exemplo.com`;
      const outroRegistro = await request(app)
        .post('/auth/registro')
        .send({ nome: 'Outro Dono', email: outroEmail, senha });
      const outroToken = outroRegistro.body.token;

      await autenticado(request(app).post(`/${recurso}`)).send({
        [campoNome]: 'Item Privado',
        ...dadosExtras,
      });

      const listaDoOutro = await request(app)
        .get(`/${recurso}`)
        .set('Authorization', `Bearer ${outroToken}`);
      expect(listaDoOutro.body[plural]).toHaveLength(0);

      await prisma.usuario.deleteMany({ where: { email: outroEmail } });
    });
  });

  return { autenticado, getNegocioId: () => negocioId };
}

module.exports = { testarCrudSimples };
