import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { QuoteModalProvider } from './context/QuoteModalContext';
import { AppRoutes } from './routes/AppRoutes';
import { DemoBanner } from './components/common/DemoBanner';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <QuoteModalProvider>
            <DemoBanner />
            <AppRoutes />
          </QuoteModalProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
