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
