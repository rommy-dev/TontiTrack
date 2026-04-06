// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';

// Layouts
import AuthLayout    from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Pages auth
import LoginPage    from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';

// Pages app
import DashboardPage     from './pages/dashboard/DashboardPage.jsx';
import GroupsPage        from './pages/groups/GroupsPage.jsx';
import GroupDetailPage   from './pages/groups/GroupDetailPage.jsx';
import ContributionsPage from './pages/contributions/ContributionsPage.jsx';
import ProfilePage       from './pages/profile/ProfilePage.jsx';

// ── Route protégée ────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const isAuth = useAuthStore((s) => s.isAuth);
  return isAuth ? children : <Navigate to="/login" replace />;
}

// ── Route publique (redirige si déjà connecté) ────────────────────────────────
function PublicRoute({ children }) {
  const isAuth = useAuthStore((s) => s.isAuth);
  return isAuth ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Routes publiques (login / register) ── */}
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        </Route>

        {/* ── Routes protégées (app principale) ── */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index                        element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"            element={<DashboardPage />} />
          <Route path="/groups"               element={<GroupsPage />} />
          <Route path="/groups/:groupId"      element={<GroupDetailPage />} />
          <Route path="/contributions"        element={<ContributionsPage />} />
          <Route path="/profile"              element={<ProfilePage />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}