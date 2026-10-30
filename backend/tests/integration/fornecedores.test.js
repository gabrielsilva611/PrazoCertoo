const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');
const { testarCrudSimples } = require('../helpers/crudSimples');

const { autenticado, getNegocioId } = testarCrudSimples({
  recurso: 'fornecedores',
  singular: 'fornecedor',
  plural: 'fornecedores',
  campoNome: 'nome',
  modeloPrisma: 'fornecedor',
});

describe('campo contato (RF22)', () => {
  test('cria e atualiza o contato do fornecedor', async () => {
    const criado = await autenticado(request(app).post('/fornecedores')).send({
      nome: 'Distribuidora ABC',
      contato: '(47) 99999-0000',
    });
    expect(criado.body.fornecedor.contato).toBe('(47) 99999-0000');

    const atualizado = await autenticado(request(app).put(`/fornecedores/${criado.body.fornecedor.id}`)).send({
      contato: '(47) 90000-0000',
    });
    expect(atualizado.body.fornecedor.contato).toBe('(47) 90000-0000');
  });
});

describe('exclusão com fornecedor em uso', () => {
  test('DELETE retorna 409 quando o fornecedor está vinculado a uma movimentação de estoque', async () => {
    const negocioId = getNegocioId();

    const fornecedor = await autenticado(request(app).post('/fornecedores')).send({ nome: 'Em Uso' });
    const fornecedorId = fornecedor.body.fornecedor.id;

    // Produto e movimentação ainda não têm rota própria (vêm nos próximos
    // PRs) — criados direto via Prisma só pra exercitar a restrição de FK.
    const produto = await prisma.produto.create({
      data: {
        negocioId,
        nome: 'Produto de Teste',
        unidade: 'un',
        precoCusto: 10,
        precoVenda: 20,
        estoqueMinimo: 1,
      },
    });
    const movimentacao = await prisma.movimentacaoEstoque.create({
      data: {
        produtoId: produto.id,
        usuarioId: negocioId,
        fornecedorId,
        tipo: 'ENTRADA',
        quantidade: 5,
        saldoAnterior: 0,
        saldoPosterior: 5,
      },
    });

    const resposta = await autenticado(request(app).delete(`/fornecedores/${fornecedorId}`));
    expect(resposta.status).toBe(409);

    await prisma.movimentacaoEstoque.delete({ where: { id: movimentacao.id } });
    await prisma.produto.delete({ where: { id: produto.id } });
  });
});
