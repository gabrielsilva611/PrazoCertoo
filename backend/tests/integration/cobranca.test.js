const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

const emailDono = `teste-cobranca-${Date.now()}@exemplo.com`;
const senha = 'senhaDeTeste123';

let token;
let negocioId;
let clienteId;
let vendaId;

beforeAll(async () => {
  const registro = await request(app)
    .post('/auth/registro')
    .send({ nome: 'Dono de Teste', email: emailDono, senha });
  token = registro.body.token;
  negocioId = registro.body.usuario.id;

  const cliente = await request(app)
    .post('/clientes')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Cliente Cobrança', telefone: '(47) 99456-7890' });
  clienteId = cliente.body.cliente.id;

  const venda = await request(app)
    .post('/vendas')
    .set('Authorization', `Bearer ${token}`)
    .send({ clienteId, valorTotal: 300, numParcelas: 1, dataInicio: '2026-06-05' });
  vendaId = venda.body.venda.id;
});

afterAll(async () => {
  await prisma.historicoCobranca.deleteMany({ where: { negocioId } });
  await prisma.parcela.deleteMany({ where: { venda: { negocioId } } });
  await prisma.venda.deleteMany({ where: { negocioId } });
  await prisma.cliente.deleteMany({ where: { negocioId } });
  await prisma.usuario.deleteMany({ where: { email: emailDono } });
  await prisma.$disconnect();
});

function autenticado(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('POST /vendas/:id/parcelas/:numero/cobrar', () => {
  test('gera mensagem e link do WhatsApp (RF13, RF14)', async () => {
    const resposta = await autenticado(request(app).post(`/vendas/${vendaId}/parcelas/1/cobrar`));

    expect(resposta.status).toBe(201);
    expect(resposta.body.mensagem).toContain('Cliente Cobrança');
    expect(resposta.body.linkWhatsapp).toMatch(/^https:\/\/wa\.me\/5547994567890\?text=/);
  });

  test('registra a cobrança no histórico do cliente (RF15, RN07)', async () => {
    const detalhe = await autenticado(request(app).get(`/clientes/${clienteId}`));

    expect(detalhe.body.cliente.historicoCobrancas).toHaveLength(1);
    expect(detalhe.body.cliente.historicoCobrancas[0]).toMatchObject({
      canal: 'WHATSAPP',
      parcelaId: expect.any(String),
    });
  });

  test('cada cobrança gera um novo registro no histórico, mesmo pra mesma parcela', async () => {
    await autenticado(request(app).post(`/vendas/${vendaId}/parcelas/1/cobrar`));

    const detalhe = await autenticado(request(app).get(`/clientes/${clienteId}`));
    expect(detalhe.body.cliente.historicoCobrancas).toHaveLength(2);
  });

  test('retorna 404 para parcela inexistente', async () => {
    const resposta = await autenticado(request(app).post(`/vendas/${vendaId}/parcelas/99/cobrar`));
    expect(resposta.status).toBe(404);
  });

  test('retorna 401 sem token', async () => {
    const resposta = await request(app).post(`/vendas/${vendaId}/parcelas/1/cobrar`);
    expect(resposta.status).toBe(401);
  });

  test('retorna 409 ao tentar cobrar uma parcela já paga', async () => {
    const venda = await autenticado(request(app).post('/vendas')).send({
      clienteId,
      valorTotal: 100,
      numParcelas: 1,
      dataInicio: '2026-06-05',
    });
    await autenticado(request(app).patch(`/vendas/${venda.body.venda.id}/parcelas/1/pagar`));

    const resposta = await autenticado(
      request(app).post(`/vendas/${venda.body.venda.id}/parcelas/1/cobrar`),
    );
    expect(resposta.status).toBe(409);
  });
});
