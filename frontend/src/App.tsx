import { Route, Routes } from 'react-router-dom'
import { RotaProtegida } from './components/RotaProtegida'
import { ClientesPage } from './pages/ClientesPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RotaProtegida>
            <DashboardPage />
          </RotaProtegida>
        }
      />
      <Route
        path="/clientes"
        element={
          <RotaProtegida>
            <ClientesPage />
          </RotaProtegida>
        }
      />
    </Routes>
  )
}
