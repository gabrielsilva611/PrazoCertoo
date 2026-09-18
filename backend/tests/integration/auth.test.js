const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

// E-mail único por execução — evita colidir com dados de outros testes ou de uso manual.
const emailTeste = `teste-auth-${Date.now()}@exemplo.com`;
const senhaTeste = 'senhaDeTeste123';

afterAll(async () => {
  await prisma.usuario.deleteMany({ where: { email: emailTeste } });
  await prisma.$disconnect();
});

describe('POST /auth/registro', () => {
  test('cria um Dono e retorna token (RF01)', async () => {
    const resposta = await request(app)
      .post('/auth/registro')
      .send({ nome: 'Usuário de Teste', email: emailTeste, senha: senhaTeste });

    expect(resposta.status).toBe(201);
    expect(resposta.body.token).toEqual(expect.any(String));
    expect(resposta.body.usuario).toMatchObject({
      nome: 'Usuário de Teste',
      email: emailTeste,
      perfil: 'DONO',
    });
  });

  test('rejeita e-mail já cadastrado com 409', async () => {
    const resposta = await request(app)
      .post('/auth/registro')
      .send({ nome: 'Outro Nome', email: emailTeste, senha: senhaTeste });

    expect(resposta.status).toBe(409);
  });

  test('rejeita senha curta com 400 (validação Zod)', async () => {
    const resposta = await request(app)
      .post('/auth/registro')
      .send({ nome: 'Teste', email: `outro-${Date.now()}@exemplo.com`, senha: '123' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.detalhes).toBeDefined();
  });
});

describe('POST /auth/login', () => {
  test('retorna token com credenciais corretas', async () => {
    const resposta = await request(app)
      .post('/auth/login')
      .send({ email: emailTeste, senha: senhaTeste });

    expect(resposta.status).toBe(200);
    expect(resposta.body.token).toEqual(expect.any(String));
  });

  test('rejeita senha incorreta com 401 e mensagem genérica (FA01)', async () => {
    const resposta = await request(app)
      .post('/auth/login')
      .send({ email: emailTeste, senha: 'senhaErrada' });

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('E-mail ou senha incorretos.');
  });

  test('rejeita e-mail inexistente com a mesma mensagem genérica (não revela se o e-mail existe)', async () => {
    const resposta = await request(app)
      .post('/auth/login')
      .send({ email: 'nao-existe@exemplo.com', senha: senhaTeste });

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('E-mail ou senha incorretos.');
  });
});

describe('GET /auth/me', () => {
  let token;

  beforeAll(async () => {
    const resposta = await request(app)
      .post('/auth/login')
      .send({ email: emailTeste, senha: senhaTeste });
    token = resposta.body.token;
  });

  test('rejeita requisição sem token com 401', async () => {
    const resposta = await request(app).get('/auth/me');
    expect(resposta.status).toBe(401);
  });

  test('rejeita token inválido com 401', async () => {
    const resposta = await request(app).get('/auth/me').set('Authorization', 'Bearer token-invalido');
    expect(resposta.status).toBe(401);
  });

  test('retorna os dados do usuário com token válido, negocioId igual ao próprio id (RN08)', async () => {
    const resposta = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario.perfil).toBe('DONO');
    expect(resposta.body.usuario.negocioId).toBe(resposta.body.usuario.id);
  });
});
