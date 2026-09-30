const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatoData = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

// RF13: mensagem padronizada com nome do cliente, valor da parcela e vencimento.
function gerarMensagem({ nomeCliente, valor, vencimento }) {
  return (
    `Olá, ${nomeCliente}! Passando para lembrar que sua parcela de ` +
    `${formatoMoeda.format(Number(valor))} vence em ${formatoData.format(new Date(vencimento))}. ` +
    'Qualquer dúvida, estou à disposição!'
  );
}

// RF14: link wa.me com a mensagem pré-preenchida — sem precisar da API oficial do WhatsApp.
function gerarLinkWhatsapp(telefone, mensagem) {
  const numero = normalizarTelefone(telefone);
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

// Mantém só dígitos e garante o DDI 55 (padrão brasileiro) quando ausente.
function normalizarTelefone(telefone) {
  const digitos = telefone.replace(/\D/g, '');
  if (digitos.startsWith('55') && digitos.length >= 12) return digitos;
  return `55${digitos}`;
}

module.exports = { gerarMensagem, gerarLinkWhatsapp, normalizarTelefone };
