import { useAuth } from '../context/AuthContext'

export function DashboardPage() {
  const { usuario, sair } = useAuth()

  return (
    <div className="min-h-svh bg-brand-bg p-8 text-brand-text">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-brand-muted">Bem-vindo, {usuario?.nome}</p>
        </div>
        <button
          onClick={sair}
          className="rounded-md border border-brand-border px-4 py-2 text-sm text-brand-text hover:border-brand-accent"
        >
          Sair
        </button>
      </div>

      <p className="mt-8 text-sm text-brand-muted">
        Os indicadores gerenciais (Módulo 5 do RFC) ainda não foram implementados no backend.
      </p>
    </div>
  )
}
