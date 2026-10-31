import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { DemoBanner } from './components/common/DemoBanner';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DemoBanner />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
