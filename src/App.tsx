import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { NotesList } from '@/pages/NotesList';
import { NoteEditor } from '@/pages/NoteEditor';
import { Projects } from '@/pages/Projects';
import { ProjectDetail } from '@/pages/ProjectDetail';
import { Ask } from '@/pages/Ask';
import { Settings } from '@/pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
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
