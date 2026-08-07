import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { Bell, LogOut, Clock, AlertTriangle, CheckCircle, Info, Check, Trash2, X, Sun, Moon } from 'lucide-react';
import api from '../../api';
import { supabase } from '../../supabaseClient';

export default function StaffLayout({ role, menuItems }) {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  // Dark mode (persisted in localStorage, scoped to the staff portal via the .dark wrapper below)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('staffTheme') === 'dark');

  useEffect(() => {
    localStorage.setItem('staffTheme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Session Operational Windows (5 Fixed Daily Seats)
  const [currentSession, setCurrentSession] = useState('Session Operational');
  const [sessionCountdown, setSessionCountdown] = useState({ formatted: '02:30:00', isPreEndWarning: false });

  // Notifications State & Dropdown
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get(`/notifikasi?role=${role.toUpperCase()}`);
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Supabase Realtime Subscription for Live Notification Updates
    const channel = supabase
      .channel('notifikasi_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifikasi' }, (payload) => {
        const newNotif = payload.new;
        if (!newNotif.role || newNotif.role.toUpperCase() === role.toUpperCase()) {
          setNotifications(prev => [newNotif, ...prev]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifikasi' }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);

      const hour = now.getHours();
      let sessionName = 'Off-Session';
      let endHour = 23;

      if (hour >= 10 && hour < 13) {
        sessionName = 'Session 1 (10:00 - 12:30)';
        endHour = 12;
      } else if (hour >= 13 && hour < 16) {
        sessionName = 'Session 2 (13:00 - 15:30)';
        endHour = 15;
      } else if (hour >= 16 && hour < 19) {
        sessionName = 'Session 3 (16:00 - 18:30)';
        endHour = 18;
      } else if (hour >= 19 && hour < 22) {
        sessionName = 'Session 4 (19:00 - 21:30)';
        endHour = 21;
      } else if (hour >= 22 || hour < 1) {
        sessionName = 'Session 5 (22:00 - 23:30)';
        endHour = 23;
      }

      setCurrentSession(sessionName);

      const targetEnd = new Date(now);
      targetEnd.setHours(endHour, 30, 0, 0);
      let diffMs = targetEnd - now;
      if (diffMs < 0) diffMs = 0;

      const remainingSec = Math.floor(diffMs / 1000);
      const hrs = Math.floor(remainingSec / 3600);
      const mins = Math.floor((remainingSec % 3600) / 60);
      const secs = remainingSec % 60;

      const formatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      const isPreEndWarning = remainingSec > 0 && remainingSec <= 300; // 5 minutes before end

      setSessionCountdown({ formatted, isPreEndWarning });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleMarkAsRead = async (notifId) => {
    try {
      await api.patch(`/notifikasi/${notifId}/read`);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, dibaca: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifikasi/read-all', { role: role.toUpperCase() });
      setNotifications(prev => prev.map(n => ({ ...n, dibaca: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const unreadNotifs = notifications.filter(n => !n.dibaca);

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen bg-gray-50 dark:bg-gray-950 font-sans`}>
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-serif font-bold text-primary dark:text-accent">Resto Unikom</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role} Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-primary/10 text-primary dark:text-accent font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 z-30">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 capitalize">{role} Dashboard</h1>

            <div className="hidden md:flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-6">
              <div className={`text-xs font-bold px-2 py-1 rounded ${currentSession === 'Off-Session' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'}`}>
                {currentSession}
              </div>
              <div className={`text-xs font-bold px-2 py-1 rounded border ${sessionCountdown.isPreEndWarning ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse' : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'}`}>
                ⏱️ Session Time Remaining: {sessionCountdown.formatted}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center text-gray-600 dark:text-gray-400 font-medium text-sm">
              <Clock className="w-4 h-4 mr-2 text-primary dark:text-accent" />
              {timeString}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Bell Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 relative text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Notifications"
              >
                <Bell className="w-6 h-6" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none shadow-sm animate-bounce">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Notifications</h3>
                      {unreadNotifs.length > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-extrabold rounded-full">
                          {unreadNotifs.length} New
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {unreadNotifs.length > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-primary dark:text-accent hover:underline font-bold"
                        >
                          Mark all as read
                        </button>
                      )}
                      <button onClick={() => setShowNotifDropdown(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkAsRead(n.id)}
                          className={`p-3.5 flex items-start space-x-3 transition-colors cursor-pointer ${n.dibaca ? 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400' : 'bg-blue-50/60 dark:bg-blue-950/40 font-semibold text-gray-900 dark:text-gray-100'}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.tipe === 'WARNING' || n.tipe === 'ALERT' ? (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            ) : n.tipe === 'SUCCESS' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Info className="w-4 h-4 text-blue-500" />
                            )}
                          </div>

                          <div className="flex-1 text-xs">
                            <div className="flex justify-between items-center">
                              <p className="font-bold text-gray-900 dark:text-gray-100">{n.judul}</p>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{n.pesan}</p>
                          </div>

                          {!n.dibaca && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {role.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Global Pre-End Session Warning Banner */}
        {sessionCountdown.isPreEndWarning && (
          <div className="bg-red-600 text-white px-8 py-2.5 text-xs font-bold flex justify-between items-center animate-pulse z-20 shadow-md">
            <span className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              ATTENTION ALL STAFF: Active Fine Dining Session ends in less than 5 minutes! Prepare table turnover and final bills.
            </span>
            <span className="font-mono bg-white text-red-700 px-2 py-0.5 rounded font-extrabold">
              {sessionCountdown.formatted}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
