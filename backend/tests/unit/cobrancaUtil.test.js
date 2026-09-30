const { gerarMensagem, gerarLinkWhatsapp, normalizarTelefone } = require('../../src/lib/cobrancaUtil');

describe('gerarMensagem (RF13)', () => {
  test('inclui nome, valor formatado em reais e data de vencimento', () => {
    const mensagem = gerarMensagem({
      nomeCliente: 'Jodan Martins',
      valor: 226.67,
      vencimento: '2026-06-05T00:00:00.000Z',
    });

    expect(mensagem).toContain('Jodan Martins');
    expect(mensagem).toContain('R$');
    expect(mensagem).toContain('226,67');
    expect(mensagem).toContain('05/06/2026');
  });
});

describe('normalizarTelefone', () => {
  test('remove formatação e adiciona DDI 55 quando ausente', () => {
    expect(normalizarTelefone('(47) 99456-7890')).toBe('5547994567890');
  });

  test('não duplica o DDI se o número já vier com 55', () => {
    expect(normalizarTelefone('55 47 99456-7890')).toBe('5547994567890');
  });
});

describe('gerarLinkWhatsapp (RF14)', () => {
  test('monta o link wa.me com o telefone normalizado e a mensagem codificada', () => {
    const link = gerarLinkWhatsapp('(47) 99456-7890', 'Olá! Teste & confirmação.');

    expect(link).toBe(
      'https://wa.me/5547994567890?text=' + encodeURIComponent('Olá! Teste & confirmação.'),
    );
  });
});
