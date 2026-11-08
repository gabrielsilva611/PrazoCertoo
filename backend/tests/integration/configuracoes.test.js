const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');
const { criarTokenFuncionario } = require('../helpers/autenticacao');

const emailDono = `teste-configuracoes-${Date.now()}@exemplo.com`;
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
  await prisma.usuario.deleteMany({ where: { negocioId } });
  await prisma.$disconnect();
});

function autenticado(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('GET /configuracoes', () => {
  test('retorna a cor de destaque padrão pra um negócio novo', async () => {
    const resposta = await autenticado(request(app).get('/configuracoes'));
    expect(resposta.status).toBe(200);
    expect(resposta.body.corDestaque).toBe('#22c55e');
  });
});

describe('PUT /configuracoes', () => {
  test('atualiza a cor de destaque (pedido real de cliente, customização de tema)', async () => {
    const resposta = await autenticado(request(app).put('/configuracoes')).send({
      corDestaque: '#0ea5e9',
    });
    expect(resposta.status).toBe(200);
    expect(resposta.body.corDestaque).toBe('#0ea5e9');

    const confirmacao = await autenticado(request(app).get('/configuracoes'));
    expect(confirmacao.body.corDestaque).toBe('#0ea5e9');
  });

  test('rejeita cor fora do formato #RRGGBB, com 400', async () => {
    const resposta = await autenticado(request(app).put('/configuracoes')).send({
      corDestaque: 'verde',
    });
    expect(resposta.status).toBe(400);
  });

  test('rejeita quando o usuário não é Dono, com 403', async () => {
    const tokenFuncionario = await criarTokenFuncionario(negocioId);

    const resposta = await request(app)
      .put('/configuracoes')
      .set('Authorization', `Bearer ${tokenFuncionario}`)
      .send({ corDestaque: '#000000' });

    expect(resposta.status).toBe(403);
  });
});
