export type Perfil = 'DONO' | 'FUNCIONARIO'

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: Perfil
}

export interface LoginResponse {
  token: string
  usuario: Usuario
}

export type Score = 'BOM_PAGADOR' | 'IRREGULAR' | 'INADIMPLENTE'

// Campos que toda rota retorna (vem direto do banco).
export interface ClienteBasico {
  id: string
  nome: string
  telefone: string
  email: string | null
  cpf: string | null
  observacoes: string | null
  ativo: boolean
  criadoEm: string
}

// GET /clientes calcula o score sob demanda — outras rotas que trazem o
// cliente aninhado (ex: GET /vendas) NÃO têm esse campo, por isso é um tipo
// separado em vez de só marcar `score` como opcional em todo lugar.
export interface Cliente extends ClienteBasico {
  score: Score
}

export type StatusParcela = 'PENDENTE' | 'PAGO' | 'ATRASADO'

export interface Parcela {
  id: string
  numero: number
  valor: string
  vencimento: string
  pagoEm: string | null
  status: StatusParcela
}

export interface Indicadores {
  totalAReceber: { valor: number; quantidade: number }
  vencimentosHoje: { valor: number; quantidade: number }
  emAtraso: { valor: number; clientes: number }
  vencimentosProximos7Dias: { valor: number; quantidade: number }
  recebidoNoMes: number
  clientesInadimplentes: number
}

export interface Categoria {
  id: string
  nome: string
  descricao: string | null
}

export interface Fornecedor {
  id: string
  nome: string
  contato: string | null
}

export interface Produto {
  id: string
  categoriaId: string | null
  nome: string
  unidade: string
  precoCusto: string
  precoVenda: string
  saldoAtual: number
  estoqueMinimo: number
  ativo: boolean
  capitalImobilizado: number
}

export type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'INVENTARIO'

export interface MovimentacaoEstoque {
  id: string
  produtoId: string
  fornecedorId: string | null
  tipo: TipoMovimentacao
  quantidade: number
  saldoAnterior: number
  saldoPosterior: number
  motivo: string | null
  criadoEm: string
}

export interface Venda {
  id: string
  clienteId: string
  cliente?: ClienteBasico
  descricao: string | null
  observacoes: string | null
  valorTotal: string
  numParcelas: number
  dataInicio: string
  criadoEm: string
  parcelas: Parcela[]
}

export interface HistoricoCobranca {
  id: string
  parcelaId: string | null
  mensagem: string
  canal: string
  enviadoEm: string
}

// GET /clientes/:id — histórico completo (RF06), além do que ClienteBasico já traz.
export interface ClienteDetalhe extends ClienteBasico {
  score: Score
  vendas: Venda[]
  historicoCobrancas: HistoricoCobranca[]
}

export interface DadosProduto {
  nome: string
  unidade: string
  categoriaId?: string | null
  precoCusto: number
  precoVenda: number
  estoqueMinimo: number
}

export interface DadosCliente {
  nome: string
  telefone: string
  email?: string
  cpf?: string
  observacoes?: string
}
