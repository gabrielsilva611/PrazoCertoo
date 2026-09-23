const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

const emailDono = `teste-vendas-${Date.now()}@exemplo.com`;
const senha = 'senhaDeTeste123';

let token;
let negocioId;
let clienteId;

function diasAtras(n) {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
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
    .send({ nome: 'Cliente da Venda', telefone: '(47) 97777-3333' });
  clienteId = cliente.body.cliente.id;
});

afterAll(async () => {
  await prisma.parcela.deleteMany({ where: { venda: { negocioId } } });
  await prisma.venda.deleteMany({ where: { negocioId } });
  await prisma.cliente.deleteMany({ where: { negocioId } });
  await prisma.usuario.deleteMany({ where: { email: emailDono } });
  await prisma.$disconnect();
});

function autenticado(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('POST /vendas', () => {
  test('registra venda e calcula as parcelas automaticamente (RF08, RF09)', async () => {
    const resposta = await autenticado(request(app).post('/vendas')).send({
      clienteId,
      descricao: 'Perfume 212 VIP Rosa',
      valorTotal: 680,
      numParcelas: 3,
      dataInicio: diasAtras(60),
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.venda.parcelas).toHaveLength(3);
    expect(resposta.body.venda.parcelas.map((p) => p.valor)).toEqual(['226.67', '226.67', '226.66']);
  });

  test('rejeita venda para cliente inexistente com 404 (RN05)', async () => {
    const resposta = await autenticado(request(app).post('/vendas')).send({
      clienteId: '00000000-0000-0000-0000-000000000000',
      valorTotal: 100,
      numParcelas: 1,
      dataInicio: diasAtras(0),
    });
    expect(resposta.status).toBe(404);
  });

  test('rejeita venda com produto inexistente com 404', async () => {
    const resposta = await autenticado(request(app).post('/vendas')).send({
      clienteId,
      produtoId: '00000000-0000-0000-0000-000000000000',
      valorTotal: 100,
      numParcelas: 1,
      dataInicio: diasAtras(0),
    });
    expect(resposta.status).toBe(404);
  });

  test('rejeita dados inválidos (valor negativo) com 400', async () => {
    const resposta = await autenticado(request(app).post('/vendas')).send({
      clienteId,
      valorTotal: -50,
      numParcelas: 1,
      dataInicio: diasAtras(0),
    });
    expect(resposta.status).toBe(400);
  });
});

describe('pagamento de parcelas e reflexo no score (RF11, RF12, RN02)', () => {
  // Cliente isolado, só pra esse bloco — evita contaminação com as parcelas
  // criadas no describe "POST /vendas" acima.
  let clienteIsoladoId;
  let vendaId;

  beforeAll(async () => {
    const cliente = await autenticado(request(app).post('/clientes')).send({
      nome: 'Cliente do Pagamento',
      telefone: '(47) 96666-4444',
    });
    clienteIsoladoId = cliente.body.cliente.id;

    // 3 parcelas diárias, todas recentes e vencidas — sem cair na regra dos
    // "mais de 30 dias", só na contagem simples de atrasos (RN02).
    const venda = await autenticado(request(app).post('/vendas')).send({
      clienteId: clienteIsoladoId,
      valorTotal: 300,
      numParcelas: 3,
      dataInicio: diasAtras(5),
      intervaloDias: 1,
    });
    vendaId = venda.body.venda.id;
  });

  test('parcela não paga com vencimento no passado aparece como ATRASADO', async () => {
    const resposta = await autenticado(request(app).get(`/vendas/${vendaId}`));
    expect(resposta.body.venda.parcelas[0].status).toBe('ATRASADO');
  });

  test('com as 3 parcelas atrasadas, o cliente já é INADIMPLENTE (RN02)', async () => {
    const resposta = await autenticado(request(app).get(`/clientes/${clienteIsoladoId}`));
    expect(resposta.body.cliente.score).toBe('INADIMPLENTE');
  });

  test('marca a parcela 1 como paga', async () => {
    const resposta = await autenticado(request(app).patch(`/vendas/${vendaId}/parcelas/1/pagar`));
    expect(resposta.status).toBe(200);
    expect(resposta.body.parcela.status).toBe('PAGO');
  });

  test('pagar a mesma parcela de novo retorna 409', async () => {
    const resposta = await autenticado(request(app).patch(`/vendas/${vendaId}/parcelas/1/pagar`));
    expect(resposta.status).toBe(409);
  });

  test('com 2 parcelas atrasadas restantes, o cliente vira IRREGULAR', async () => {
    const resposta = await autenticado(request(app).get(`/clientes/${clienteIsoladoId}`));
    expect(resposta.body.cliente.score).toBe('IRREGULAR');
  });
});

describe('GET /vendas', () => {
  test('lista as vendas do negócio', async () => {
    const resposta = await autenticado(request(app).get('/vendas'));
    expect(resposta.status).toBe(200);
    expect(resposta.body.vendas.length).toBeGreaterThan(0);
    expect(resposta.body.vendas[0].cliente).toBeDefined();
  });
});
