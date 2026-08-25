import { AppLayout } from '../components/AppLayout'
import { useAuth } from '../AuthContext'

export function DashboardPage() {
  const { usuario } = useAuth()

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-brand-muted">Bem-vindo, {usuario?.nome}</p>

      <p className="mt-8 text-sm text-brand-muted">
        Os indicadores gerenciais (Módulo 5 do RFC) ainda não foram implementados no backend.
      </p>
    </AppLayout>
  )
}
