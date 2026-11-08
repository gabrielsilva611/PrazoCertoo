jest.mock('../../src/repositories/clienteRepository');
jest.mock('../../src/repositories/parcelaRepository');

const clienteRepository = require('../../src/repositories/clienteRepository');
const parcelaRepository = require('../../src/repositories/parcelaRepository');
const { listar } = require('../../src/services/clienteService');

const AGORA = new Date('2026-06-15T12:00:00Z');
const DIA_EM_MS = 1000 * 60 * 60 * 24;

function parcela(clienteId, { diasAtras, paga = false }) {
  return {
    pagoEm: paga ? new Date() : null,
    vencimento: new Date(AGORA.getTime() - diasAtras * DIA_EM_MS),
    venda: { clienteId },
  };
}

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(AGORA);
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

// Regressão da issue #31: listar clientes fazia 1 query de parcelas por
// cliente (N+1) em vez de uma query só pra todos.
describe('clienteService.listar', () => {
  test('busca as parcelas de todos os clientes numa única query, não uma por cliente', async () => {
    clienteRepository.listarPorNegocio.mockResolvedValue([
      { id: 'cliente-1', nome: 'Ana' },
      { id: 'cliente-2', nome: 'Bruno' },
      { id: 'cliente-3', nome: 'Carla' },
    ]);
    parcelaRepository.listarPorClientes.mockResolvedValue([]);

    await listar('negocio-1');

    expect(parcelaRepository.listarPorClientes).toHaveBeenCalledTimes(1);
    expect(parcelaRepository.listarPorClientes).toHaveBeenCalledWith(
      ['cliente-1', 'cliente-2', 'cliente-3'],
      expect.any(Date),
    );
    expect(parcelaRepository.listarPorCliente).not.toHaveBeenCalled();
  });

  test('calcula o score de cada cliente a partir das parcelas agrupadas corretamente', async () => {
    clienteRepository.listarPorNegocio.mockResolvedValue([
      { id: 'cliente-1', nome: 'Ana' },
      { id: 'cliente-2', nome: 'Bruno' },
    ]);
    parcelaRepository.listarPorClientes.mockResolvedValue([
      parcela('cliente-1', { diasAtras: 5 }),
      parcela('cliente-1', { diasAtras: 10 }),
      parcela('cliente-1', { diasAtras: 15 }),
      parcela('cliente-2', { diasAtras: 5 }),
    ]);

    const clientes = await listar('negocio-1');

    expect(clientes.find((c) => c.id === 'cliente-1').score).toBe('INADIMPLENTE');
    expect(clientes.find((c) => c.id === 'cliente-2').score).toBe('IRREGULAR');
  });

  test('cliente sem nenhuma parcela recebe BOM_PAGADOR', async () => {
    clienteRepository.listarPorNegocio.mockResolvedValue([{ id: 'cliente-1', nome: 'Ana' }]);
    parcelaRepository.listarPorClientes.mockResolvedValue([]);

    const clientes = await listar('negocio-1');
    expect(clientes[0].score).toBe('BOM_PAGADOR');
  });

  test('negócio sem clientes não chama a busca de parcelas', async () => {
    clienteRepository.listarPorNegocio.mockResolvedValue([]);

    const clientes = await listar('negocio-1');
    expect(clientes).toEqual([]);
    expect(parcelaRepository.listarPorClientes).not.toHaveBeenCalled();
  });
});
