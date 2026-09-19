-- UrbanPulse Database Schema
-- City Infrastructure Anomaly & Impact Intelligence Platform

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'Reported' CHECK (status IN ('Reported', 'In Progress', 'Resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for fast geo-queries, category filtering, and status lookups
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_coordinates ON issues(latitude, longitude);

-- Sample Seed Data (3 Realistic City Infrastructure Issues)
INSERT INTO issues (title, category, description, latitude, longitude, severity, status) VALUES
(
    'Deep Pothole on Main Arterial Corridor',
    'Road Damage',
    'Severe pothole approximately 45cm wide and 12cm deep located in the right lane near Sector 5 crossing. Creates severe accident risk for two-wheelers during rush hour.',
    22.5802100,
    88.4312500,
    'High',
    'Reported'
),
(
    'Cluster of Broken Streetlights on Outer Promenade',
    'Streetlight',
    'Four consecutive municipal streetlights are completely dead, causing hazardous low-visibility conditions along the pedestrian walkway and cycling lane.',
    22.5724500,
    88.4218900,
    'Medium',
    'In Progress'
),
(
    'Clogged Storm Drain Causing Monsoon Waterlogging',
    'Waterlogging',
    'Stormwater inlet blocked by debris and plastic waste, producing 30cm of stagnant standing water spanning across the central bus transit terminal.',
    22.5691000,
    88.4125000,
    'Critical',
    'Reported'
);
