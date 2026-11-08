import type { ReactElement } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RotaProtegida } from './components/RotaProtegida'
import { ClientesPage } from './pages/ClientesPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditarProdutoPage } from './pages/EditarProdutoPage'
import { LoginPage } from './pages/LoginPage'
import { NovaVendaPage } from './pages/NovaVendaPage'
import { NovoClientePage } from './pages/NovoClientePage'
import { NovoProdutoPage } from './pages/NovoProdutoPage'
import { ProdutosPage } from './pages/ProdutosPage'
import { VendasPage } from './pages/VendasPage'

function protegida(elemento: ReactElement) {
  return <RotaProtegida>{elemento}</RotaProtegida>
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={protegida(<DashboardPage />)} />
      <Route path="/clientes" element={protegida(<ClientesPage />)} />
      <Route path="/clientes/novo" element={protegida(<NovoClientePage />)} />
      <Route path="/vendas" element={protegida(<VendasPage />)} />
      <Route path="/vendas/novo" element={protegida(<NovaVendaPage />)} />
      <Route path="/produtos" element={protegida(<ProdutosPage />)} />
      <Route path="/produtos/novo" element={protegida(<NovoProdutoPage />)} />
      <Route path="/produtos/:id/editar" element={protegida(<EditarProdutoPage />)} />
    </Routes>
  )
}
