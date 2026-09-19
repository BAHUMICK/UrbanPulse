import React from 'react';

function ReportIssue() {
  return (
    <div className="card">
      <h2>Report New Infrastructure Issue</h2>
      <p>Submit a new incident for potholes, broken lights, waterlogging, or debris.</p>
      <div className="placeholder-box">
        <p>Report Issue form component ready. Will connect to <code>POST /api/issues</code> in the next stage.</p>
      </div>
    </div>
  );
}

export default ReportIssue;
