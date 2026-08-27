import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AssistantPage from './pages/AssistantPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AssistantPage />} />
      <Route path="/app" element={<AssistantPage />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
