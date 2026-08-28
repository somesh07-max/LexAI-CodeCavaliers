import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { LoadingScreen } from './components/UI';
import AssistantPage from './pages/AssistantPage';
import { LoginPage, SignupPage } from './pages/AuthPages';

function RequireAuth({ children }) {
  const { ready, user } = useAuth();
  if (!ready) return <LoadingScreen label="Restoring your learning space…" />;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }) {
  const { ready, user } = useAuth();
  if (!ready) return <LoadingScreen label="Checking your session…" />;
  return user ? <Navigate to="/app" replace /> : children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/app' : '/login'} replace />} />
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
      <Route path="/app" element={<RequireAuth><AssistantPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to={user ? '/app' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
