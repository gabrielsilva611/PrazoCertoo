import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const ITENS_MENU = [
  { rotulo: 'Dashboard', para: '/' },
  { rotulo: 'Clientes', para: '/clientes' },
  { rotulo: 'Vendas a Prazo', para: '/vendas' },
]

function linkClasse({ isActive }: { isActive: boolean }) {
  const base = 'rounded-md px-3 py-2 text-sm transition'
  return isActive
    ? `${base} bg-brand-accent/15 text-brand-accent`
    : `${base} text-brand-muted hover:bg-brand-surface hover:text-brand-text`
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { usuario, sair } = useAuth()

  return (
    <div className="flex min-h-svh bg-brand-bg text-brand-text">
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-brand-border bg-brand-surface/40 p-4">
        <div className="flex items-center gap-2 px-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-brand-bg">
            ✓
          </span>
          <span className="font-semibold">Prazo Certo</span>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {ITENS_MENU.map((item) => (
            <NavLink key={item.para} to={item.para} end className={linkClasse}>
              {item.rotulo}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between rounded-md border border-brand-border p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{usuario?.nome}</p>
            <p className="truncate text-xs text-brand-muted">{usuario?.perfil}</p>
          </div>
          <button onClick={sair} className="text-xs text-brand-muted hover:text-brand-text">
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  )
}
