import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/layouts/AppShell';
import { WizardStageLayout } from '@/layouts/WizardStageLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { WizardHomePage } from '@/pages/WizardHomePage';
import { StepOutlet } from '@/pages/wizard/StepOutlet';
import { SettingsPage } from '@/pages/SettingsPage';
import { UploadsPage } from '@/pages/UploadsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { EsocialLotePage } from '@/pages/EsocialLotePage';
const DatabaseErDiagramPage = lazy(() =>
  import('@/documentations/DatabaseErDiagramPage').then((m) => ({ default: m.DatabaseErDiagramPage })),
);

export default function App() {
  return (
    <HashRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/documentacao/diagrama-banco"
          element={
            <Suspense
              fallback={
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                  <Spin size="large" />
                </div>
              }
            >
              <DatabaseErDiagramPage />
            </Suspense>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/uploads" element={<UploadsPage />} />
            <Route path="/wizard" element={<Outlet />}>
              <Route index element={<WizardHomePage />} />
              <Route path="etapa-1" element={<WizardStageLayout />}>
                <Route index element={<Navigate to="passo-1" replace />} />
                <Route path=":stepSlug" element={<StepOutlet />} />
              </Route>
              <Route path="etapa-2" element={<WizardStageLayout />}>
                <Route index element={<Navigate to="passo-1" replace />} />
                <Route path=":stepSlug" element={<StepOutlet />} />
              </Route>
              <Route path="etapa-3" element={<WizardStageLayout />}>
                <Route index element={<Navigate to="passo-1" replace />} />
                <Route path=":stepSlug" element={<StepOutlet />} />
              </Route>
              <Route path="etapa-4" element={<WizardStageLayout />}>
                <Route index element={<Navigate to="passo-1" replace />} />
                <Route path=":stepSlug" element={<StepOutlet />} />
              </Route>
              <Route path="etapa-5" element={<WizardStageLayout />}>
                <Route index element={<Navigate to="passo-1" replace />} />
                <Route path=":stepSlug" element={<StepOutlet />} />
              </Route>
              <Route path="etapa-6" element={<WizardStageLayout />}>
                <Route index element={<Navigate to="passo-1" replace />} />
                <Route path="lote/:batchId" element={<EsocialLotePage />} />
                <Route path=":stepSlug" element={<StepOutlet />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}
