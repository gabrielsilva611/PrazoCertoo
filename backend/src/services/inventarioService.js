const inventarioRepository = require('../repositories/inventarioRepository');
const produtoRepository = require('../repositories/produtoRepository');
const AppError = require('../lib/AppError');

// RF28, RN13: abre um novo inventário (rascunho de contagem física).
// Só um inventário pode estar ABERTO por vez, pra não dividir a contagem
// física em dois rascunhos inconsistentes.
async function abrir(negocioId, usuarioId) {
  const aberto = await inventarioRepository.buscarAberto(negocioId);
  if (aberto) {
    throw new AppError(
      'Já existe um inventário aberto. Conclua-o antes de iniciar outro.',
      409,
    );
  }
  return inventarioRepository.criar(negocioId, usuarioId);
}

function listar(negocioId) {
  return inventarioRepository.listarPorNegocio(negocioId);
}

async function buscarDetalhe(negocioId, id) {
  return buscarOuFalhar(negocioId, id);
}

// RF28: registra (ou corrige) a contagem física de um produto no inventário aberto.
// A checagem de status ABERTO é feita de forma atômica dentro da transação
// do repositório (travando a linha do inventário) — não aqui, porque ler o
// status antes e só gravar o item depois é a mesma corrida check-then-act
// que permitia um item ser salvo num inventário concluído no meio do
// caminho, sem nunca virar movimentação de estoque.
async function registrarItem(negocioId, inventarioId, dados) {
  await buscarOuFalhar(negocioId, inventarioId);

  const produto = await produtoRepository.buscarPorId(negocioId, dados.produtoId);
  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }

  const saldoSistema = produto.saldoAtual;
  const diferenca = dados.saldoFisico - saldoSistema;
  if (diferenca !== 0 && !dados.justificativa) {
    throw new AppError(
      'Há divergência entre a contagem física e o saldo do sistema. Informe "justificativa" para confirmar.',
      409,
    );
  }

  return inventarioRepository.salvarItem({
    inventarioId,
    produtoId: dados.produtoId,
    saldoSistema,
    saldoFisico: dados.saldoFisico,
    diferenca,
    justificativa: dados.justificativa,
  });
}

// RF28, RN12: fecha o inventário — cada divergência encontrada na contagem
// gera uma movimentação de estoque (tipo INVENTARIO), aplicada como delta
// sobre o saldo atual do produto (não como substituição) pra não apagar
// vendas/entradas registradas depois da contagem e antes da conclusão. O
// delta é aplicado com "increment" dentro da transação do repositório — não
// lemos mais produto.saldoAtual aqui pra montar um saldoPosterior absoluto,
// porque essa leitura fora da transação é o que causava a corrida.
//
// A lista de itens também não é mais montada aqui: o repositório trava a
// linha do inventário e só então relê os itens, já dentro da transação —
// senão um registrarItem() que ganhasse a corrida contra esta conclusão
// ficaria de fora do "ajustes" montado com os dados velhos de antes do lock.
async function concluir(negocioId, inventarioId, usuarioId) {
  const inventario = await buscarOuFalhar(negocioId, inventarioId);
  if (inventario.status !== 'ABERTO') {
    throw new AppError('Este inventário já foi concluído.', 409);
  }
  if (inventario.itens.length === 0) {
    throw new AppError('Registre ao menos um item antes de concluir o inventário.', 409);
  }

  return inventarioRepository.concluir(negocioId, inventarioId, usuarioId);
}

async function buscarOuFalhar(negocioId, id) {
  const inventario = await inventarioRepository.buscarPorId(negocioId, id);
  if (!inventario) {
    throw new AppError('Inventário não encontrado.', 404);
  }
  return inventario;
}

module.exports = { abrir, listar, buscarDetalhe, registrarItem, concluir };
