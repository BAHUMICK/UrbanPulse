import React, { useState, useEffect, useRef } from 'react';
import { IconBell, IconCheckCircle, IconRefresh } from './Icons';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/api';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationsDropdown({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  // Fetch unread count periodically
  const fetchCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // silent fallback
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 25000);
    return () => clearInterval(interval);
  }, []);

  // Fetch full list when opening dropdown
  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications();
      setNotifications(data);
      const unread = data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      setError('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  function toggleOpen() {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen((prev) => !prev);
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function handleNotificationClick(notif) {
    if (!notif.is_read) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Continue navigation regardless
      }
    }
    setIsOpen(false);
    if (onNavigate) {
      onNavigate('issues');
    }
  }

  async function handleMarkAllRead(e) {
    e.stopPropagation();
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }

  return (
    <div className="notif-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`header-notif-btn ${unreadCount > 0 ? 'has-unread' : ''} ${isOpen ? 'active' : ''}`}
        onClick={toggleOpen}
        aria-label={`Notifications: ${unreadCount} unread`}
        aria-expanded={isOpen}
        title="In-App Resolution Notifications"
      >
        <IconBell size={16} />
        {unreadCount > 0 && (
          <span className="notif-badge-pill" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown" role="region" aria-label="Notifications panel">
          <div className="notif-header">
            <div className="notif-title-group">
              <span className="notif-title">Notifications</span>
              {unreadCount > 0 && (
                <span className="notif-unread-tag">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-action-btn"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notif-body">
            {loading ? (
              <div className="notif-state-message">
                <IconRefresh size={18} className="spin-anim" />
                <span>Checking updates…</span>
              </div>
            ) : error ? (
              <div className="notif-state-message notif-error">
                <span>{error}</span>
                <button type="button" className="notif-retry-btn" onClick={loadNotifications}>
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-state-message notif-empty">
                <div className="notif-empty-icon">
                  <IconBell size={24} />
                </div>
                <strong>All caught up</strong>
                <p>You will receive in-app alerts here when your reported civic issues are marked as resolved.</p>
              </div>
            ) : (
              <ul className="notif-list">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`notif-item ${n.is_read ? 'is-read' : 'is-unread'}`}
                    onClick={() => handleNotificationClick(n)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(n);
                      }
                    }}
                  >
                    <div className="notif-icon-col">
                      <span className="notif-status-icon resolved">
                        <IconCheckCircle size={14} />
                      </span>
                    </div>
                    <div className="notif-content-col">
                      <p className="notif-message">{n.message}</p>
                      <div className="notif-meta">
                        <span className="notif-time">{formatRelativeTime(n.created_at)}</span>
                        {n.issue_category && (
                          <span className="notif-tag">{n.issue_category}</span>
                        )}
                      </div>
                    </div>
                    {!n.is_read && <span className="notif-unread-dot" aria-hidden="true" />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
