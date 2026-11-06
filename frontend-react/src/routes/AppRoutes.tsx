import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '../pages/public/HomePage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { ProtectedRoute } from './ProtectedRoute';

// Carga diferida (Code-Splitting) para paneles privados y páginas pesadas
const ClientDashboardPage = lazy(() =>
  import('../pages/client/ClientDashboardPage').then((m) => ({ default: m.ClientDashboardPage }))
);
const OperatorDashboardPage = lazy(() =>
  import('../pages/operator/OperatorDashboardPage').then((m) => ({ default: m.OperatorDashboardPage }))
);
const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminQuoteDetailPage = lazy(() =>
  import('../pages/admin/AdminQuoteDetailPage').then((m) => ({ default: m.AdminQuoteDetailPage }))
);
const DemoPage = lazy(() =>
  import('../pages/public/DemoPage').then((m) => ({ default: m.DemoPage }))
);

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-[#7AC143]/20 border-t-[#7AC143] rounded-full animate-spin" />
      <span className="text-xs font-semibold text-[#56696D]">Cargando módulo...</span>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/demo" element={<DemoPage />} />

        {/* Rutas Protegidas por Rol */}
        <Route
          path="/cliente"
          element={
            <ProtectedRoute allowedRoles={['CLIENT']}>
              <ClientDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operador"
          element={
            <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN']}>
              <OperatorDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/cotizaciones/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminQuoteDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
