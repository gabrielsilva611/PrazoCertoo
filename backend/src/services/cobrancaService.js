const vendaRepository = require('../repositories/vendaRepository');
const historicoCobrancaRepository = require('../repositories/historicoCobrancaRepository');
const { gerarMensagem, gerarLinkWhatsapp } = require('../lib/cobrancaUtil');
const AppError = require('../lib/AppError');

const CANAL_WHATSAPP = 'WHATSAPP';

// RF13-RF15, RN07: gera a mensagem + link do WhatsApp e registra no
// histórico do cliente — link é gerado sob demanda, não fica salvo pronto.
async function gerarCobranca(negocioId, vendaId, numero) {
  const parcela = await vendaRepository.buscarParcelaComCliente(negocioId, vendaId, numero);
  if (!parcela) {
    throw new AppError('Parcela não encontrada.', 404);
  }
  if (parcela.pagoEm) {
    throw new AppError('Esta parcela já está paga — não é possível gerar cobrança.', 409);
  }

  const { cliente } = parcela.venda;
  const mensagem = gerarMensagem({
    nomeCliente: cliente.nome,
    valor: parcela.valor,
    vencimento: parcela.vencimento,
  });
  const linkWhatsapp = gerarLinkWhatsapp(cliente.telefone, mensagem);

  const historico = await historicoCobrancaRepository.criar({
    negocioId,
    clienteId: cliente.id,
    parcelaId: parcela.id,
    mensagem,
    canal: CANAL_WHATSAPP,
  });

  return { mensagem, linkWhatsapp, historico };
}

module.exports = { gerarCobranca };
