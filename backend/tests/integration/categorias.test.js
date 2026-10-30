const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');
const { testarCrudSimples } = require('../helpers/crudSimples');

const { autenticado, getNegocioId } = testarCrudSimples({
  recurso: 'categorias',
  singular: 'categoria',
  plural: 'categorias',
  campoNome: 'nome',
  modeloPrisma: 'categoria',
});

describe('exclusão com categoria em uso', () => {
  test('DELETE retorna 409 quando a categoria está vinculada a um produto', async () => {
    const categoria = await autenticado(request(app).post('/categorias')).send({ nome: 'Em Uso' });
    const categoriaId = categoria.body.categoria.id;

    // Produto ainda não tem rota própria (vem no próximo PR) — criado direto
    // via Prisma só pra exercitar a restrição de FK.
    const produto = await prisma.produto.create({
      data: {
        negocioId: getNegocioId(),
        categoriaId,
        nome: 'Produto de Teste',
        unidade: 'un',
        precoCusto: 10,
        precoVenda: 20,
        estoqueMinimo: 1,
      },
    });

    const resposta = await autenticado(request(app).delete(`/categorias/${categoriaId}`));
    expect(resposta.status).toBe(409);

    await prisma.produto.delete({ where: { id: produto.id } });
  });
});
