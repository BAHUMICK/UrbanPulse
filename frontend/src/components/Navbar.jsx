import React from 'react';

function Navbar({ activeTab, setActiveTab, backendStatus }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'issues', label: 'Issues List' },
    { id: 'report', label: 'Report Issue' },
    { id: 'map', label: 'Map View' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>UrbanPulse</h1>
        <span>City Infrastructure Intelligence</span>
      </div>

      <div className="nav-links">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        <span
          className={`status-badge ${
            backendStatus === 'UP' ? 'status-online' : 'status-offline'
          }`}
        >
          API: {backendStatus === 'UP' ? 'Online' : 'Checking...'}
        </span>
      </div>
    </nav>
  );
}

export default Navbar;
