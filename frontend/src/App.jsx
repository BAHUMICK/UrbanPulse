import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import Issues from './pages/Issues';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import MapView from './components/MapView';

import { getIssues, getActiveAlerts, checkBackendHealth, getCurrentUser, logoutAccount } from './services/api';
import AuthPage from './pages/AuthPage';
import './App.css';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current page from URL path
  const path = location.pathname.replace(/^\//, '').split('?')[0];
  const currentPage = ['dashboard', 'map', 'issues', 'report', 'alerts', 'analytics'].includes(path)
    ? path
    : 'dashboard';

  const [totalIssuesCount, setTotalIssuesCount] = useState(0);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [systemOnline, setSystemOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const authPage = path === 'login' || path === 'register';

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((current) => { if (mounted) setUser(current); })
      .catch(() => { if (mounted) setUser(null); })
      .finally(() => { if (mounted) setAuthLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const expireSession = () => { setUser(null); navigate('/login', { replace: true }); };
    window.addEventListener('urbanpulse:session-expired', expireSession);
    return () => window.removeEventListener('urbanpulse:session-expired', expireSession);
  }, [navigate]);

  useEffect(() => {
    if (authLoading) return;
    if (!user && !authPage) navigate('/login', { replace: true });
    else if (user && authPage) navigate('/dashboard', { replace: true });
  }, [authLoading, user, authPage, navigate]);

  // Load telemetry stats for sidebar and header counters
  const fetchTelemetry = useCallback(async () => {
    try {
      setRefreshing(true);
      const [healthData, issuesData, alertsData] = await Promise.all([
        checkBackendHealth().catch(() => ({ status: 'DOWN' })),
        getIssues().catch(() => []),
        getActiveAlerts().catch(() => []),
      ]);

      setSystemOnline(healthData?.status === 'UP');
      setTotalIssuesCount(Array.isArray(issuesData) ? issuesData.length : 0);
      setActiveAlertCount(Array.isArray(alertsData) ? alertsData.length : 0);
    } catch (err) {
      console.error('Error fetching global telemetry:', err);
      setSystemOnline(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    // Poll telemetry every 30 seconds
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  function handleNavigate(pageId) {
    if (pageId === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate(`/${pageId}`);
    }
  }

  function handleRefresh() {
    fetchTelemetry();
    setRefreshKey((prev) => prev + 1);
  }

  async function handleLogout() {
    try { await logoutAccount(); } catch (error) { console.error('Sign-out request failed:', error.message); }
    setUser(null);
    navigate('/login', { replace: true });
  }

  if (authLoading) return <main className="auth-loading" role="status">Loading UrbanPulse…</main>;
  if (!user) return <AuthPage onAuthenticated={(nextUser) => { setUser(nextUser); navigate('/dashboard', { replace: true }); }} />;

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            key={refreshKey}
            onNavigate={handleNavigate}
            onTelemetryUpdate={fetchTelemetry}
            isAdmin={user.role === 'admin'}
          />
        );
      case 'map':
        return <MapView key={refreshKey} onNavigate={handleNavigate} />;
      case 'issues':
        return <Issues key={refreshKey} onNavigate={handleNavigate} isAdmin={user.role === 'admin'} />;
      case 'report':
        return (
          <ReportIssue
            key={refreshKey}
            onIssueCreated={() => {
              fetchTelemetry();
              handleNavigate('issues');
            }}
          />
        );
      case 'alerts':
        return (
          <Alerts
            key={refreshKey}
            onAlertUpdated={fetchTelemetry}
            onNavigate={handleNavigate}
            isAdmin={user.role === 'admin'}
          />
        );
      case 'analytics':
        return <Analytics key={refreshKey} onNavigate={handleNavigate} />;
      default:
        return <Dashboard key={refreshKey} onNavigate={handleNavigate} />;
    }
  }

  return (
    <div className="app-shell">
      {/* LEFT PERSISTENT SIDEBAR */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        activeAlertCount={activeAlertCount}
        totalIssuesCount={totalIssuesCount}
        systemOnline={systemOnline}
        user={user}
        onLogout={handleLogout}
      />

      {/* MAIN COMMAND LAYOUT */}
      <div className="app-main-layout">
        {/* TOP COMMAND HEADER */}
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          activeAlertCount={activeAlertCount}
          systemOnline={systemOnline}
          user={user}
          onLogout={handleLogout}
        />

        {/* PAGE CONTENT CONTAINER (SCROLLABLE) */}
        <main className="app-content-body">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
