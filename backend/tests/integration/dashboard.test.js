const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');
const { diaLocalDeAgora } = require('../../src/lib/dashboardUtil');

const emailDono = `teste-dashboard-${Date.now()}@exemplo.com`;
const senha = 'senhaDeTeste123';

let token;
let negocioId;
let clienteId;

// Usa o mesmo "hoje" (fuso de Brasília) que dashboardUtil usa pra classificar
// as parcelas — senão o teste pode falhar de forma intermitente entre
// 00h-03h UTC (21h-00h em Brasília), quando UTC e Brasília discordam sobre
// que dia é hoje.
function hojeNoBrasilMeiaNoiteUtc() {
  return new Date(`${diaLocalDeAgora(new Date())}T00:00:00Z`);
}
function diasAtras(n) {
  return new Date(hojeNoBrasilMeiaNoiteUtc().getTime() - n * 86_400_000).toISOString().slice(0, 10);
}
function daquiA(n) {
  return new Date(hojeNoBrasilMeiaNoiteUtc().getTime() + n * 86_400_000).toISOString().slice(0, 10);
}

beforeAll(async () => {
  const registro = await request(app)
    .post('/auth/registro')
    .send({ nome: 'Dono de Teste', email: emailDono, senha });
  token = registro.body.token;
  negocioId = registro.body.usuario.id;

  const cliente = await request(app)
    .post('/clientes')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Cliente Dashboard', telefone: '(47) 93333-2222' });
  clienteId = cliente.body.cliente.id;

  function autenticado(req) {
    return req.set('Authorization', `Bearer ${token}`);
  }

  // 1 parcela atrasada
  await autenticado(request(app).post('/vendas')).send({
    clienteId,
    valorTotal: 100,
    numParcelas: 1,
    dataInicio: diasAtras(5),
  });
  // 1 parcela vencendo hoje
  await autenticado(request(app).post('/vendas')).send({
    clienteId,
    valorTotal: 50,
    numParcelas: 1,
    dataInicio: diasAtras(0),
  });
  // 1 parcela vencendo em 3 dias
  await autenticado(request(app).post('/vendas')).send({
    clienteId,
    valorTotal: 80,
    numParcelas: 1,
    dataInicio: daquiA(3),
  });
  // 1 venda paga agora (conta em recebidoNoMes)
  const vendaPaga = await autenticado(request(app).post('/vendas')).send({
    clienteId,
    valorTotal: 200,
    numParcelas: 1,
    dataInicio: diasAtras(1),
  });
  await autenticado(request(app).patch(`/vendas/${vendaPaga.body.venda.id}/parcelas/1/pagar`));
});

afterAll(async () => {
  await prisma.historicoCobranca.deleteMany({ where: { negocioId } });
  await prisma.parcela.deleteMany({ where: { venda: { negocioId } } });
  await prisma.venda.deleteMany({ where: { negocioId } });
  await prisma.cliente.deleteMany({ where: { negocioId } });
  await prisma.usuario.deleteMany({ where: { negocioId } });
  await prisma.$disconnect();
});

describe('GET /dashboard (RF16)', () => {
  test('retorna os indicadores agregados das parcelas em aberto', async () => {
    const resposta = await request(app).get('/dashboard').set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.totalAReceber).toEqual({ valor: 230, quantidade: 3 });
    expect(resposta.body.emAtraso).toEqual({ valor: 100, clientes: 1 });
    expect(resposta.body.vencimentosHoje).toEqual({ valor: 50, quantidade: 1 });
    expect(resposta.body.vencimentosProximos7Dias).toEqual({ valor: 80, quantidade: 1 });
    expect(resposta.body.recebidoNoMes).toBe(200);
    // Só 1 atraso registrado pro cliente -> IRREGULAR pela RN02 (precisa de
    // 3+ atrasos pra virar INADIMPLENTE), então ainda não deve contar aqui.
    expect(resposta.body.clientesInadimplentes).toBe(0);
  });

  test('retorna 401 sem token', async () => {
    const resposta = await request(app).get('/dashboard');
    expect(resposta.status).toBe(401);
  });

  test('retorna 403 para perfil Funcionário (RN03)', async () => {
    const idFuncionario = crypto.randomUUID();
    await prisma.usuario.create({
      data: {
        id: idFuncionario,
        negocioId,
        nome: 'Funcionário de Teste',
        email: `teste-funcionario-${Date.now()}@exemplo.com`,
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
      .get('/dashboard')
      .set('Authorization', `Bearer ${tokenFuncionario}`);
    expect(resposta.status).toBe(403);
  });
});
