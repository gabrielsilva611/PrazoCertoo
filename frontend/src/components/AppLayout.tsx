import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Receipt,
  Package,
  Tags,
  Truck,
  ClipboardList,
  Settings,
  LogOut,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../AuthContext'

const ITENS_MENU = [
  { rotulo: 'Dashboard', para: '/', icone: LayoutDashboard },
  { rotulo: 'Clientes', para: '/clientes', icone: Users },
  { rotulo: 'Vendas a Prazo', para: '/vendas', icone: Receipt },
  { rotulo: 'Produtos', para: '/produtos', icone: Package },
  { rotulo: 'Categorias', para: '/categorias', icone: Tags },
  { rotulo: 'Fornecedores', para: '/fornecedores', icone: Truck },
  // RF28, RN13: inventário físico é exclusivo do Dono, assim como no backend.
  { rotulo: 'Inventário', para: '/inventario', icone: ClipboardList, somenteDono: true },
  // Configurações do negócio (ex: cor de destaque) são exclusivas do Dono, como no backend.
  { rotulo: 'Configurações', para: '/configuracoes', icone: Settings, somenteDono: true },
]

function linkClasse({ isActive }: { isActive: boolean }) {
  const base = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition'
  return isActive
    ? `${base} bg-brand-accent/10 text-brand-accent`
    : `${base} text-brand-muted hover:bg-brand-bg hover:text-brand-text`
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { usuario, sair } = useAuth()

  return (
    <div className="flex min-h-svh bg-brand-bg text-brand-text">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-brand-border bg-brand-surface p-4">
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent text-brand-surface">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Prazo Certo</span>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {ITENS_MENU.filter((item) => !item.somenteDono || usuario?.perfil === 'DONO').map((item) => (
            <NavLink key={item.para} to={item.para} end className={linkClasse}>
              <item.icone className="h-4.5 w-4.5" />
              {item.rotulo}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between gap-2 rounded-lg border border-brand-border bg-brand-bg p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-sm font-semibold text-brand-accent">
              {usuario?.nome?.charAt(0)?.toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{usuario?.nome}</p>
              <p className="truncate text-xs text-brand-muted">{usuario?.perfil}</p>
            </div>
          </div>
          <button
            onClick={sair}
            title="Sair"
            className="flex-shrink-0 rounded-md p-1.5 text-brand-muted transition hover:bg-brand-surface hover:text-brand-text"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  )
}
