import { Route, Routes } from 'react-router-dom'
import { RotaProtegida } from './components/RotaProtegida'
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
    </Routes>
  )
}
