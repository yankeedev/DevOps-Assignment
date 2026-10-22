import { BrowserRouter, Route, Routes } from 'react-router-dom'
import EquipmentListingPage from './pages/EquipmentListingPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<EquipmentListingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin"     element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}
