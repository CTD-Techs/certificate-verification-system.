import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores';
import { PrivateRoute } from './routes/PrivateRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { UploadCertificatePage } from './pages/UploadCertificatePage';
import { VerificationsPage } from './pages/VerificationsPage';
import { VerificationDetailPage } from './pages/VerificationDetailPage';
import { VerifierQueuePage } from './pages/VerifierQueuePage';
import { VerifierReviewPage } from './pages/VerifierReviewPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminStatsPage } from './pages/AdminStatsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Routes - All Users */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/certificates"
          element={
            <PrivateRoute>
              <CertificatesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/certificates/upload"
          element={
            <PrivateRoute>
              <UploadCertificatePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/verifications"
          element={
            <PrivateRoute>
              <VerificationsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/verifications/:id"
          element={
            <PrivateRoute>
              <VerificationDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />

        {/* Protected Routes - Verifier Only */}
        <Route
          path="/verifier/queue"
          element={
            <PrivateRoute roles={['VERIFIER']}>
              <VerifierQueuePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/verifier/review/:id"
          element={
            <PrivateRoute roles={['VERIFIER']}>
              <VerifierReviewPage />
            </PrivateRoute>
          }
        />

        {/* Protected Routes - Admin Only */}
        <Route
          path="/admin/users"
          element={
            <PrivateRoute roles={['ADMIN']}>
              <AdminUsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <PrivateRoute roles={['ADMIN']}>
              <AdminStatsPage />
            </PrivateRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;