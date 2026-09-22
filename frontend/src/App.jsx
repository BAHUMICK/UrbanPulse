import React, { useState } from 'react';

import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import Issues from './pages/Issues';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import MapView from './components/MapView';

import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;

      case 'report':
        return <ReportIssue />;

      case 'issues':
        return <Issues />;

      case 'map':
        return <MapView />;

      case 'analytics':
        return <Analytics />;

      case 'alerts':
        return <Alerts />;

      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1 className="logo">UrbanPulse</h1>

          <p className="subtitle">
            Infrastructure Intelligence Platform
          </p>
        </div>

        <nav className="navigation">
          <button
            className={
              currentPage === 'dashboard'
                ? 'nav-button active'
                : 'nav-button'
            }
            onClick={() => setCurrentPage('dashboard')}
          >
            Dashboard
          </button>

          <button
            className={
              currentPage === 'report'
                ? 'nav-button active'
                : 'nav-button'
            }
            onClick={() => setCurrentPage('report')}
          >
            Report Issue
          </button>

          <button
            className={
              currentPage === 'issues'
                ? 'nav-button active'
                : 'nav-button'
            }
            onClick={() => setCurrentPage('issues')}
          >
            Issues
          </button>

          <button
            className={
              currentPage === 'map'
                ? 'nav-button active'
                : 'nav-button'
            }
            onClick={() => setCurrentPage('map')}
          >
            Map
          </button>

          <button
            className={
              currentPage === 'analytics'
                ? 'nav-button active'
                : 'nav-button'
            }
            onClick={() => setCurrentPage('analytics')}
          >
            Analytics
          </button>

          <button
            className={
              currentPage === 'alerts'
                ? 'nav-button active'
                : 'nav-button'
            }
            onClick={() => setCurrentPage('alerts')}
          >
            Alerts
          </button>
        </nav>
      </header>

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
