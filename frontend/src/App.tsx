import type { ReactElement } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RotaProtegida } from './components/RotaProtegida'
import { CategoriasPage } from './pages/CategoriasPage'
import { ClienteDetalhePage } from './pages/ClienteDetalhePage'
import { ClientesPage } from './pages/ClientesPage'
import { ConfiguracoesPage } from './pages/ConfiguracoesPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditarClientePage } from './pages/EditarClientePage'
import { EditarProdutoPage } from './pages/EditarProdutoPage'
import { FornecedoresPage } from './pages/FornecedoresPage'
import { InventarioDetalhePage } from './pages/InventarioDetalhePage'
import { InventariosPage } from './pages/InventariosPage'
import { LoginPage } from './pages/LoginPage'
import { NovaVendaPage } from './pages/NovaVendaPage'
import { NovoClientePage } from './pages/NovoClientePage'
import { NovoProdutoPage } from './pages/NovoProdutoPage'
import { ProdutoDetalhePage } from './pages/ProdutoDetalhePage'
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
      <Route path="/clientes/:id" element={protegida(<ClienteDetalhePage />)} />
      <Route path="/clientes/:id/editar" element={protegida(<EditarClientePage />)} />
      <Route path="/vendas" element={protegida(<VendasPage />)} />
      <Route path="/vendas/novo" element={protegida(<NovaVendaPage />)} />
      <Route path="/produtos" element={protegida(<ProdutosPage />)} />
      <Route path="/produtos/novo" element={protegida(<NovoProdutoPage />)} />
      <Route path="/produtos/:id" element={protegida(<ProdutoDetalhePage />)} />
      <Route path="/produtos/:id/editar" element={protegida(<EditarProdutoPage />)} />
      <Route path="/categorias" element={protegida(<CategoriasPage />)} />
      <Route path="/fornecedores" element={protegida(<FornecedoresPage />)} />
      <Route path="/inventario" element={protegida(<InventariosPage />)} />
      <Route path="/inventario/:id" element={protegida(<InventarioDetalhePage />)} />
      <Route path="/configuracoes" element={protegida(<ConfiguracoesPage />)} />
    </Routes>
  )
}
