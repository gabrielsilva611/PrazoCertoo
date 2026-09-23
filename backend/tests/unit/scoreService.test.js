jest.mock('../../src/repositories/parcelaRepository');

const parcelaRepository = require('../../src/repositories/parcelaRepository');
const { calcularScore } = require('../../src/services/scoreService');

const AGORA = new Date('2026-06-15T12:00:00Z');
const DIA_EM_MS = 1000 * 60 * 60 * 24;

function parcela({ diasAtras, paga = false }) {
  return {
    pagoEm: paga ? new Date() : null,
    vencimento: new Date(AGORA.getTime() - diasAtras * DIA_EM_MS),
  };
}

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(AGORA);
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('calcularScore (RN02)', () => {
  test('sem parcelas retorna BOM_PAGADOR', async () => {
    parcelaRepository.listarPorCliente.mockResolvedValue([]);
    expect(await calcularScore('cliente-1')).toBe('BOM_PAGADOR');
  });

  test('parcela paga, mesmo com vencimento no passado, não conta como atraso', async () => {
    parcelaRepository.listarPorCliente.mockResolvedValue([parcela({ diasAtras: 10, paga: true })]);
    expect(await calcularScore('cliente-1')).toBe('BOM_PAGADOR');
  });

  test('parcela com vencimento futuro não conta como atraso', async () => {
    parcelaRepository.listarPorCliente.mockResolvedValue([parcela({ diasAtras: -5 })]);
    expect(await calcularScore('cliente-1')).toBe('BOM_PAGADOR');
  });

  test('1 atraso vira IRREGULAR', async () => {
    parcelaRepository.listarPorCliente.mockResolvedValue([parcela({ diasAtras: 5 })]);
    expect(await calcularScore('cliente-1')).toBe('IRREGULAR');
  });

  test('2 atrasos ainda é IRREGULAR', async () => {
    parcelaRepository.listarPorCliente.mockResolvedValue([
      parcela({ diasAtras: 5 }),
      parcela({ diasAtras: 10 }),
    ]);
    expect(await calcularScore('cliente-1')).toBe('IRREGULAR');
  });

  test('3 atrasos vira INADIMPLENTE', async () => {
    parcelaRepository.listarPorCliente.mockResolvedValue([
      parcela({ diasAtras: 5 }),
      parcela({ diasAtras: 10 }),
      parcela({ diasAtras: 15 }),
    ]);
    expect(await calcularScore('cliente-1')).toBe('INADIMPLENTE');
  });

  test('1 único atraso, mas com mais de 30 dias, já vira INADIMPLENTE mesmo sem 3 atrasos', async () => {
    parcelaRepository.listarPorCliente.mockResolvedValue([parcela({ diasAtras: 31 })]);
    expect(await calcularScore('cliente-1')).toBe('INADIMPLENTE');
  });

  test('atraso de exatos 30 dias ainda não conta como "mais de 30 dias"', async () => {
    parcelaRepository.listarPorCliente.mockResolvedValue([parcela({ diasAtras: 30 })]);
    expect(await calcularScore('cliente-1')).toBe('IRREGULAR');
  });
});
