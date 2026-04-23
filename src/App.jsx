import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EbaySync from './pages/EbaySync';
import Logybox from './pages/Logybox';
import Inventario from './pages/Inventario';
import Reportes from './pages/Reportes';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública - Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas - Requieren autenticación */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="ebay-sync" element={<EbaySync />} />
            <Route path="logybox" element={<Logybox />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="reportes" element={<Reportes />} />
          </Route>
          
          {/* Redirigir cualquier ruta no encontrada al dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;