import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Invoices from './pages/Invoices';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Accounting from './pages/Accounting';
import MlEngine from './pages/MlEngine';
import Users from './pages/Users';
import Profile from './pages/Profile';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <AppLayout title="Dashboard">
          <Dashboard />
        </AppLayout>
      } />

      <Route path="/contacts" element={
        <AppLayout title="Contactos">
          <Contacts />
        </AppLayout>
      } />

      <Route path="/invoices" element={
        <AppLayout title="Facturas">
          <Invoices />
        </AppLayout>
      } />

      <Route path="/inventory" element={
        <AppLayout title="Inventario & Stock">
          <Inventory />
        </AppLayout>
      } />

      <Route path="/purchases" element={
        <AppLayout title="Compras a Proveedores">
          <Purchases />
        </AppLayout>
      } />

      <Route path="/accounting" element={
        <AppLayout title="Contabilidad & Flujo de Caja">
          <Accounting />
        </AppLayout>
      } />

      <Route path="/ml" element={
        <AppLayout title="Motor ML">
          <MlEngine />
        </AppLayout>
      } />

      <Route path="/users" element={
        <AppLayout title="Usuarios">
          <Users />
        </AppLayout>
      } />

      <Route path="/profile" element={
        <AppLayout title="Mi Perfil">
          <Profile />
        </AppLayout>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
