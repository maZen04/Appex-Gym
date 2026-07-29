import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberProfile from './pages/MemberProfile';
import Memberships from './pages/Memberships';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Employees from './pages/Employees';
import Settings from './pages/Settings';
import WhatsAppLog from './pages/WhatsAppLog';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/members/:id" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
          <Route path="/memberships" element={<ProtectedRoute><Memberships /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/whatsapp" element={<ProtectedRoute><WhatsAppLog /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute ownerOnly><Employees /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute ownerOnly><Settings /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
