import type { ReactElement } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RotaProtegida } from './components/RotaProtegida'
import { ClientesPage } from './pages/ClientesPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NovaVendaPage } from './pages/NovaVendaPage'
import { NovoClientePage } from './pages/NovoClientePage'
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
    </Routes>
  )
}
