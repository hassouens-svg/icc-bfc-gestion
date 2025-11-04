import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VisitorsPage from './pages/VisitorsPage';
import VisitorsTablePage from './pages/VisitorsTablePage';
import VisitorDetailPage from './pages/VisitorDetailPage';
import ReferentsPage from './pages/ReferentsPage';
import CitiesPage from './pages/CitiesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import StoppedVisitorsPage from './pages/StoppedVisitorsPage';
import FidelisationPage from './pages/FidelisationPage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/visitors" element={<VisitorsPage />} />
          <Route path="/visitors-table" element={<VisitorsTablePage />} />
          <Route path="/visitor/:id" element={<VisitorDetailPage />} />
          <Route path="/referents" element={<ReferentsPage />} />
          <Route path="/cities" element={<CitiesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/stopped-visitors" element={<StoppedVisitorsPage />} />
          <Route path="/fidelisation" element={<FidelisationPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
