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

export interface Cliente {
  id: string
  nome: string
  telefone: string
  email: string | null
  cpf: string | null
  observacoes: string | null
  ativo: boolean
  score: Score
  criadoEm: string
}
