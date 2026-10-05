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
