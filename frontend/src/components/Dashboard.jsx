import React from 'react';

function Dashboard({ backendInfo }) {
  return (
    <div className="card">
      <h2>System Overview Dashboard</h2>
      <p>Welcome to UrbanPulse — City Infrastructure Anomaly & Impact Intelligence Platform.</p>
      
      <div className="placeholder-box">
        <h3>Platform Foundation Ready</h3>
        <p style={{ marginTop: '8px' }}>
          Backend REST API Connection:{' '}
          <strong style={{ color: backendInfo.status === 'UP' ? '#34d399' : '#f87171' }}>
            {backendInfo.status === 'UP' ? 'Connected (PostgreSQL Active)' : 'Connecting to http://localhost:5000...'}
          </strong>
        </p>
        {backendInfo.databaseTime && (
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            Database Server Time: {new Date(backendInfo.databaseTime).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
