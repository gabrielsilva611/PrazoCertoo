const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');
const { diaLocalDeAgora } = require('../../src/lib/dashboardUtil');
const { criarTokenFuncionario } = require('../helpers/autenticacao');

const emailDono = `teste-relatorios-${Date.now()}@exemplo.com`;
const senha = 'senhaDeTeste123';

let token;
let negocioId;
let clienteId;

// Mesmo cuidado de fuso do teste do dashboard — compara "hoje" em Brasília,
// não o instante UTC, senão fica instável entre 21h-00h em Brasília.
function hojeNoBrasilMeiaNoiteUtc() {
  return new Date(`${diaLocalDeAgora(new Date())}T00:00:00Z`);
}
function diasAtras(n) {
  return new Date(hojeNoBrasilMeiaNoiteUtc().getTime() - n * 86_400_000).toISOString().slice(0, 10);
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
    .send({ nome: 'Cliente Relatorio', telefone: '(47) 93333-1111' });
  clienteId = cliente.body.cliente.id;

  function autenticado(req) {
    return req.set('Authorization', `Bearer ${token}`);
  }

  // 1 venda com parcela atrasada (fora do período de teste que vamos filtrar)
  await autenticado(request(app).post('/vendas')).send({
    clienteId,
    valorTotal: 300,
    numParcelas: 1,
    dataInicio: diasAtras(10),
  });

  // 1 venda dentro do período que vamos filtrar, com parcela paga
  const vendaPaga = await autenticado(request(app).post('/vendas')).send({
    clienteId,
    valorTotal: 150,
    numParcelas: 1,
    dataInicio: diasAtras(2),
  });
  await autenticado(request(app).patch(`/vendas/${vendaPaga.body.venda.id}/parcelas/1/pagar`)).send({
    valorPago: 150,
  });

  // produto abaixo do estoque mínimo, pro relatório de estoque
  await autenticado(request(app).post('/produtos')).send({
    nome: 'Produto Relatorio',
    unidade: 'un',
    precoCusto: 10,
    precoVenda: 20,
    estoqueMinimo: 100,
  });
});

afterAll(async () => {
  await prisma.historicoCobranca.deleteMany({ where: { negocioId } });
  await prisma.parcela.deleteMany({ where: { venda: { negocioId } } });
  await prisma.venda.deleteMany({ where: { negocioId } });
  await prisma.produto.deleteMany({ where: { negocioId } });
  await prisma.cliente.deleteMany({ where: { negocioId } });
  await prisma.usuario.deleteMany({ where: { negocioId } });
  await prisma.$disconnect();
});

describe('GET /relatorios/vendas', () => {
  test('retorna só as vendas dentro do período e o total vendido', async () => {
    const resposta = await request(app)
      .get(`/relatorios/vendas?inicio=${diasAtras(3)}&fim=${diasAtras(0)}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.totalAcordos).toBe(1);
    expect(resposta.body.totalVendido).toBe(150);
    expect(resposta.body.vendas[0].cliente.nome).toBe('Cliente Relatorio');
  });

  test('retorna 400 quando o período é inválido', async () => {
    const resposta = await request(app)
      .get('/relatorios/vendas')
      .set('Authorization', `Bearer ${token}`);
    expect(resposta.status).toBe(400);
  });

  test('retorna 403 para perfil Funcionário', async () => {
    const tokenFuncionario = await criarTokenFuncionario(negocioId);
    const resposta = await request(app)
      .get(`/relatorios/vendas?inicio=${diasAtras(3)}&fim=${diasAtras(0)}`)
      .set('Authorization', `Bearer ${tokenFuncionario}`);
    expect(resposta.status).toBe(403);
  });
});

describe('GET /relatorios/inadimplencia', () => {
  test('agrupa as parcelas em aberto por cliente, com total atrasado', async () => {
    const resposta = await request(app)
      .get('/relatorios/inadimplencia')
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.clientes).toHaveLength(1);
    expect(resposta.body.clientes[0]).toMatchObject({ nome: 'Cliente Relatorio', totalAtrasado: 300 });
    expect(resposta.body.totalAtrasado).toBe(300);
  });
});

describe('GET /relatorios/estoque', () => {
  test('inclui o capital imobilizado e sinaliza produtos abaixo do mínimo', async () => {
    const resposta = await request(app)
      .get('/relatorios/estoque')
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.totalAbaixoDoMinimo).toBe(1);
    expect(resposta.body.produtos[0].capitalImobilizado).toBe(0);
  });
});
