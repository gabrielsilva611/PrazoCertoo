const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

const emailDono = `teste-clientes-${Date.now()}@exemplo.com`;
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
  // Ordem importa: parcela -> venda -> cliente -> usuario, por causa das FKs
  // com RESTRICT (algumas descrições deste arquivo criam vendas pro cliente).
  await prisma.parcela.deleteMany({ where: { venda: { negocioId } } });
  await prisma.venda.deleteMany({ where: { negocioId } });
  await prisma.cliente.deleteMany({ where: { negocioId } });
  await prisma.usuario.deleteMany({ where: { email: emailDono } });
  await prisma.$disconnect();
});

function autenticado(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('POST /clientes', () => {
  test('cria cliente com nome e telefone (RF04)', async () => {
    const resposta = await autenticado(request(app).post('/clientes')).send({
      nome: 'Cliente Teste',
      telefone: '(47) 99999-0000',
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.cliente).toMatchObject({ nome: 'Cliente Teste', ativo: true, negocioId });
  });

  test('rejeita sem telefone com 400', async () => {
    const resposta = await autenticado(request(app).post('/clientes')).send({ nome: 'Sem Telefone' });
    expect(resposta.status).toBe(400);
  });

  test('rejeita sem token com 401', async () => {
    const resposta = await request(app).post('/clientes').send({ nome: 'X', telefone: '123' });
    expect(resposta.status).toBe(401);
  });
});

describe('fluxo de listagem, edição e desativação', () => {
  let clienteId;

  beforeAll(async () => {
    const resposta = await autenticado(request(app).post('/clientes')).send({
      nome: 'Cliente do Fluxo',
      telefone: '(47) 98888-1111',
    });
    clienteId = resposta.body.cliente.id;
  });

  test('aparece na listagem com score BOM_PAGADOR (RF07, sem histórico ainda)', async () => {
    const resposta = await autenticado(request(app).get('/clientes'));
    const cliente = resposta.body.clientes.find((c) => c.id === clienteId);

    expect(cliente).toBeDefined();
    expect(cliente.score).toBe('BOM_PAGADOR');
  });

  test('busca por nome filtra a listagem', async () => {
    const resposta = await autenticado(request(app).get('/clientes?busca=Fluxo'));
    expect(resposta.body.clientes.some((c) => c.id === clienteId)).toBe(true);

    const semResultado = await autenticado(request(app).get('/clientes?busca=NomeQueNaoExiste'));
    expect(semResultado.body.clientes).toHaveLength(0);
  });

  test('GET /clientes/:id retorna o detalhe com histórico de vendas vazio', async () => {
    const resposta = await autenticado(request(app).get(`/clientes/${clienteId}`));
    expect(resposta.status).toBe(200);
    expect(resposta.body.cliente.vendas).toEqual([]);
  });

  test('PUT /clientes/:id atualiza os dados (RF05)', async () => {
    const resposta = await autenticado(request(app).put(`/clientes/${clienteId}`)).send({
      telefone: '(47) 90000-0000',
    });
    expect(resposta.body.cliente.telefone).toBe('(47) 90000-0000');
  });

  test('PATCH /clientes/:id/desativar remove da listagem padrão, mas preserva o registro (RF05)', async () => {
    const desativar = await autenticado(request(app).patch(`/clientes/${clienteId}/desativar`));
    expect(desativar.status).toBe(204);

    const listaPadrao = await autenticado(request(app).get('/clientes'));
    expect(listaPadrao.body.clientes.some((c) => c.id === clienteId)).toBe(false);

    const comInativos = await autenticado(request(app).get('/clientes?incluirInativos=true'));
    const cliente = comInativos.body.clientes.find((c) => c.id === clienteId);
    expect(cliente).toBeDefined();
    expect(cliente.ativo).toBe(false);
  });
});

describe('isolamento multi-tenant (RN08)', () => {
  test('um negócio não vê os clientes de outro', async () => {
    const outroEmail = `teste-outro-negocio-${Date.now()}@exemplo.com`;
    const outroRegistro = await request(app)
      .post('/auth/registro')
      .send({ nome: 'Outro Dono', email: outroEmail, senha });
    const outroToken = outroRegistro.body.token;

    const listaDoOutro = await request(app).get('/clientes').set('Authorization', `Bearer ${outroToken}`);
    expect(listaDoOutro.body.clientes).toHaveLength(0);

    await prisma.usuario.deleteMany({ where: { email: outroEmail } });
  });

  test('GET /clientes/:id de outro negócio retorna 404, não os dados', async () => {
    const criado = await autenticado(request(app).post('/clientes')).send({
      nome: 'Cliente Privado',
      telefone: '(47) 91111-2222',
    });

    const outroEmail = `teste-isolamento-${Date.now()}@exemplo.com`;
    const outroRegistro = await request(app)
      .post('/auth/registro')
      .send({ nome: 'Outro Dono', email: outroEmail, senha });
    const outroToken = outroRegistro.body.token;

    const resposta = await request(app)
      .get(`/clientes/${criado.body.cliente.id}`)
      .set('Authorization', `Bearer ${outroToken}`);
    expect(resposta.status).toBe(404);

    await prisma.usuario.deleteMany({ where: { email: outroEmail } });
  });
});

// RN02: "Bom Pagador (sem atrasos nos últimos 6 meses)" — uma parcela vencida
// há mais de 6 meses sai da janela e não deveria contar pro score, mesmo
// nunca tendo sido paga. Ponto que ficou sem cobertura no scoreService.test.js
// (lá o repositório é mockado, então o filtro real de "desde" nunca é exercitado).
describe('score respeita a janela de 6 meses (RN02)', () => {
  function diasAtras(n) {
    return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
  }

  test('parcela vencida há mais de 6 meses não conta pro score', async () => {
    const cliente = await autenticado(request(app).post('/clientes')).send({
      nome: 'Cliente Dívida Antiga',
      telefone: '(47) 95555-6666',
    });
    const clienteId = cliente.body.cliente.id;

    await autenticado(request(app).post('/vendas')).send({
      clienteId,
      valorTotal: 100,
      numParcelas: 1,
      dataInicio: diasAtras(210), // ~7 meses atrás, fora da janela de 6 meses
    });

    const antes = await autenticado(request(app).get(`/clientes/${clienteId}`));
    expect(antes.body.cliente.score).toBe('BOM_PAGADOR');

    // Uma segunda parcela, essa dentro da janela, agora sim deve contar.
    await autenticado(request(app).post('/vendas')).send({
      clienteId,
      valorTotal: 100,
      numParcelas: 1,
      dataInicio: diasAtras(10),
    });

    const depois = await autenticado(request(app).get(`/clientes/${clienteId}`));
    expect(depois.body.cliente.score).toBe('IRREGULAR');
  });
});
