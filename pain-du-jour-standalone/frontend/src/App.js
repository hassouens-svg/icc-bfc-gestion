import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import PainDuJourPage from './pages/PainDuJourPage';
import PainDuJourAdminPage from './pages/PainDuJourAdminPage';
import PainDuJourQuizPage from './pages/PainDuJourQuizPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Page principale */}
          <Route path="/" element={<PainDuJourPage />} />
          
          {/* Admin */}
          <Route path="/admin" element={<PainDuJourAdminPage />} />
          
          {/* Quiz */}
          <Route path="/quiz/:date" element={<PainDuJourQuizPage />} />
          
          {/* Redirections */}
          <Route path="/pain-du-jour" element={<Navigate to="/" replace />} />
          <Route path="/pain-du-jour/admin" element={<Navigate to="/admin" replace />} />
          <Route path="/pain-du-jour/quiz/:date" element={<PainDuJourQuizPage />} />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}

export default App;
