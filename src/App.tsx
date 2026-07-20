import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { NotesList } from '@/pages/NotesList';
import { NoteEditor } from '@/pages/NoteEditor';
import { Projects } from '@/pages/Projects';
import { ProjectDetail } from '@/pages/ProjectDetail';
import { Ask } from '@/pages/Ask';
import { Settings } from '@/pages/Settings';
import { useStore } from '@/store/useStore';
import { isConfigured } from '@/lib/firebase';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const firebaseInitialized = useStore((s) => s.firebaseInitialized);
  const initAuth = useStore((s) => s.initAuth);

  useEffect(() => {
    const unsub = initAuth();
    return unsub;
  }, [initAuth]);

  if (isConfigured && !firebaseInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink-900 text-smoke">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 border border-paper/20 border-t-gold rounded-full animate-spin" />
          加载中…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/notes" element={<NotesList />} />
          <Route path="/notes/new" element={<Navigate to="/notes" replace />} />
          <Route path="/notes/:id" element={<NoteEditor />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
