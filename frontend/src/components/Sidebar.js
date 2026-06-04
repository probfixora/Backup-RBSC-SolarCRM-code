import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { APP_CONFIG } from '../config';

/* ── Icon map — Tabler Icons class names ─────────────────────────────────── */
const ICONS = {
  'Dashboard':           'ti ti-layout-dashboard',
  'Finance':             'ti ti-report-money',
  'All Customers':       'ti ti-users',
  'Quotation List':      'ti ti-file-invoice',
  'Team':                'ti ti-users-group',
  'Create Case':         'ti ti-circle-plus',
  'Customers':           'ti ti-users',
  'Quotation Form':      'ti ti-file-plus',
  'Approved Customer':   'ti ti-user-check',
  'Final Leads':         'ti ti-rocket',
  'Departments':         'ti ti-building',
  'Reports':             'ti ti-chart-bar',
  'Tracking':            'ti ti-map-pin',
  'ERP Tasks':           'ti ti-checklist',
  'Inventory':           'ti ti-package',
  'Procurement':         'ti ti-building-warehouse',
  'Dispatch':            'ti ti-truck-delivery',
  'Capacity Mapping':    'ti ti-bolt',
  'Technical QA':        'ti ti-microscope',
  'Accounts':            'ti ti-calculator',
  'CRM Tasks':           'ti ti-heart-handshake',
  'Audit Log':           'ti ti-shield-lock',
};

/* ── Admin navigation structure ─────────────────────────────────────────── */
const NAV = {
  admin: [
    { group: 'Overview', items: [
      { name: 'Dashboard',        path: '/admin-dashboard' },
      { name: 'Finance',          path: '/finance-tracking' },
    ]},
    { group: 'Management', items: [
      { name: 'All Customers',    path: '/cases' },
      { name: 'Quotation List',   path: '/quotations' },
      { name: 'Team',             path: '/users' },
    ]},
    { group: 'ERP', items: [
      { name: 'Procurement',      path: '/procurement-portal' },
      { name: 'Dispatch',         path: '/b2c-dispatch' },
      { name: 'Audit Log',        path: '/audit-log' },
    ]},
    { group: 'Apps', items: [
      { name: 'Departments',      path: '/department-portal' },
      { name: 'Tracking',         path: '/track', external: true },
    ]},
  ],
};

/* ── Role-based navigation builder ──────────────────────────────────────── */
const getRoleGroups = (role) => {
  const dashMap = {
    sales:            '/sales-dashboard',
    registration:     '/registration-dashboard',
    banking:          '/banking-dashboard',
    inventory:        '/inventory-dashboard',
    field_installation: '/installation-dashboard',
    electrical:       '/electrical-dashboard',
    subsidy:          '/subsidy-dashboard',
    technical:        '/technical-dashboard',
    accounts:         '/accounts-dashboard',
    customer_service: '/customer-service-dashboard',
    procurement:      '/procurement-dashboard',
  };

  if (role === 'sales') {
    return [
      { group: 'Overview', items: [
        { name: 'Dashboard',         path: '/sales-dashboard' },
        { name: 'Tracking',          path: '/track', external: true },
      ]},
      { group: 'Quotations', items: [
        { name: 'Quotation Form',    path: '/quotation-form' },
        { name: 'Quotation List',    path: '/quotations' },
        { name: 'Approved Customer', path: '/approved-quotations' },
        { name: 'Final Leads',       path: '/final-leads' },
      ]},
    ];
  }

  if (role === 'technical') {
    return [{ group: 'Workspace', items: [
      { name: 'Dashboard',  path: '/technical-dashboard' },
      { name: 'Customers',  path: '/cases' },
    ]}];
  }

  if (role === 'accounts') {
    return [{ group: 'Workspace', items: [
      { name: 'Dashboard',  path: '/accounts-dashboard' },
      { name: 'Customers',  path: '/cases' },
      { name: 'Finance',    path: '/finance-tracking' },
    ]}];
  }

  if (role === 'customer_service') {
    return [{ group: 'Workspace', items: [
      { name: 'Dashboard',  path: '/customer-service-dashboard' },
      { name: 'Customers',  path: '/cases' },
    ]}];
  }

  if (role === 'inventory') {
    return [{ group: 'Workspace', items: [
      { name: 'Dashboard',  path: dashMap[role] || '/admin-dashboard' },
      { name: 'Customers',  path: '/cases' },
      { name: 'Dispatch',   path: '/b2c-dispatch' },
    ]}];
  }

  if (role === 'procurement') {
    return [{ group: 'Workspace', items: [
      { name: 'Dashboard',    path: '/procurement-dashboard' },
      { name: 'Procurement',  path: '/procurement-portal' },
      { name: 'Customers',    path: '/dispatch-customers' },
    ]}];
  }

  // All other operational roles: Dashboard + Customers (+ extras per role)
  const items = [
    { name: 'Dashboard', path: dashMap[role] || '/admin-dashboard' },
    { name: 'Customers', path: '/cases' },
  ];
  if (role === 'registration') {
    items.splice(1, 0, { name: 'Create Case', path: '/create-case' });
  }
  if (role === 'banking') {
    items.push({ name: 'Finance', path: '/finance-tracking' });
  }
  // All roles get Customers access
  return [{ group: 'Workspace', items }];
};

/* ── Role display label ──────────────────────────────────────────────────── */
const getRoleLabel = (role) => {
  if (role === 'field_installation') return 'Installation';
  if (role === 'admin')              return 'Admin';
  if (role === 'sales')              return 'Sales';
  if (role === 'technical')          return 'Technical QA';
  if (role === 'accounts')           return 'Accounts';
  if (role === 'customer_service')   return 'Customer Service';
  if (role === 'procurement')        return 'Procurement';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

/* ── Role accent color ───────────────────────────────────────────────────── */
const ROLE_COLORS = {
  admin:              '#2563EB',
  sales:              '#7C3AED',
  registration:       '#0EA5E9',
  banking:            '#F59E0B',
  inventory:          '#10B981',
  field_installation: '#F97316',
  electrical:         '#EF4444',
  subsidy:            '#EC4899',
  technical:          '#06B6D4',
  accounts:           '#84CC16',
  customer_service:   '#A78BFA',
  procurement:        '#3B82F6',
};

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Sidebar = ({ onLogout }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [userName, setUserName] = useState(localStorage.getItem('name') || 'User');
  const [userRole, setUserRole] = useState((localStorage.getItem('role') || 'user').toLowerCase());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const initials   = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
  };
  const groups     = userRole === 'admin' ? NAV.admin : getRoleGroups(userRole);
  const roleColor  = ROLE_COLORS[userRole] || '#2563EB';
  const roleLabel  = getRoleLabel(userRole);

  /* ── Sync profile from DB on mount ──────────────────────────────────── */
  useEffect(() => {
    const isSimulating = localStorage.getItem('simulating') === 'true';
    if (isSimulating) {
      setUserRole((localStorage.getItem('role') || 'user').toLowerCase());
      setUserName(localStorage.getItem('name') || 'User');
      return;
    }

    const syncProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', user.id)
          .single();
        if (profile) {
          if (profile.name) { localStorage.setItem('name', profile.name); setUserName(profile.name); }
          if (profile.role) { localStorage.setItem('role', profile.role); setUserRole(profile.role.toLowerCase()); }
        }
      } catch { /* silent fail */ }
    };
    syncProfile();
  }, []);

  /* ── Close mobile sidebar on route change ──────────────────────────── */
  useEffect(() => { 
    setMobileOpen(false); 
    setAccountDrawerOpen(false);
  }, [location.pathname]);

  /* ── Listen for custom event from Header to open menu ──────────────── */
  useEffect(() => {
    const handleOpen = () => setMobileOpen(true);
    window.addEventListener('openMobileMenu', handleOpen);
    return () => window.removeEventListener('openMobileMenu', handleOpen);
  }, []);

  /* ── Nav item click handler ─────────────────────────────────────────── */
  const handleNav = (item) => {
    if (item.external) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(item.path);
    }
    setMobileOpen(false);
  };

  /* ── Sidebar inner content (shared between desktop & mobile) ─────────── */
  const SidebarContent = () => (
    <>
      {/* Logo / Brand */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid var(--color-border)` }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}
          onClick={() => navigate('/')}
          title="Go to dashboard"
        >
          <img src={APP_CONFIG.logoPath} alt={APP_CONFIG.companyName} style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Role badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 10px', borderRadius: 'var(--radius-pill)',
          background: `${roleColor}15`,
          border: `1px solid ${roleColor}30`,
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: roleColor, flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: roleColor }}>
            {roleLabel} Portal
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {groups.map(({ group, items }, gi) => (
          <div key={group}>
            {gi > 0 && <div style={{ height: '1px', background: 'var(--color-border)', margin: '6px 10px' }} />}
            <p className="nav-section-label">{group}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {items.map((item) => {
                const isActive  = !item.external && location.pathname === item.path;
                const iconCls   = ICONS[item.name] || 'ti ti-point';
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNav(item)}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    title={item.name}
                  >
                    {item.name === 'Tracking' ? (
                      <MapPin style={{ width: '15px', height: '15px', flexShrink: 0, opacity: 0.85 }} />
                    ) : (
                      <i className={iconCls} style={{ fontSize: '15px', width: '18px', textAlign: 'center', flexShrink: 0 }} />
                    )}
                    <span style={{ flex: 1 }}>{item.name}</span>
                    {item.external && (
                      <i className="ti ti-external-link" style={{
                        fontSize: '11px', opacity: 0.45, flexShrink: 0,
                        transition: 'opacity 0.15s',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: Support + Profile */}
      <div style={{ padding: '8px 6px 12px', borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={() => { navigate('/support'); setMobileOpen(false); }}
          className={`nav-item${location.pathname === '/support' ? ' active' : ''}`}
          style={{ marginBottom: '6px' }}
          title="Support"
        >
          <i className="ti ti-headset" style={{ fontSize: '15px', width: '18px', textAlign: 'center' }} />
          <span>Support</span>
        </button>

        {/* User Profile card */}
        <div
          onClick={() => { navigate('/profile'); setMobileOpen(false); }}
          title="View profile"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', borderRadius: 'var(--radius-md)',
            background: 'var(--surface-2)', cursor: 'pointer',
            transition: 'background 0.15s ease', marginTop: '2px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
        >
          {/* Avatar */}
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: roleColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: '#fff',
            letterSpacing: '0.5px',
          }}>
            {initials}
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '12.5px', fontWeight: 600, color: 'var(--text-1)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
            }}>
              {userName}
            </p>
            <span style={{ fontSize: '10.5px', fontWeight: 500, color: 'var(--text-4)', textTransform: 'capitalize' }}>
              {roleLabel}
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={e => { e.stopPropagation(); onLogout(); }}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-4)', padding: '5px',
              borderRadius: 'var(--radius-xs)',
              transition: 'all 0.15s ease', display: 'flex', alignItems: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.background = 'var(--color-danger-muted)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'none'; }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside className="sidebar-desktop" style={{ display: 'flex', flexDirection: 'column' }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile: Slide-in sidebar drawer ─────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 150,
              background: 'hsla(222,47%,5%,0.55)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              animation: 'fadeIn 0.2s ease both',
            }}
          />

          {/* Drawer panel */}
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 160,
            width: '260px',
            background: 'var(--sidebar-bg)',
            border: '1px solid var(--color-border)',
            borderLeft: 'none',
            borderRadius: '0 var(--radius-xl) var(--radius-xl) 0',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInLeft 0.25s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'absolute', top: '12px', right: '12px',
                background: 'var(--surface-2)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-3)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
              title="Close menu"
            >
              <i className="ti ti-x" style={{ fontSize: '14px' }} />
            </button>

            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Mobile Bottom Navigation ─────────────────────────────────────── */}
      <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
        {/* Home */}
        <button
          onClick={() => navigate(groups[0]?.items[0]?.path || '/admin-dashboard')}
          className={`mobile-nav-btn ${location.pathname === (groups[0]?.items[0]?.path || '/admin-dashboard') ? 'active' : ''}`}
          aria-label="Home"
        >
          <div className="mobile-nav-icon-wrap"><i className="ti ti-home" style={{ fontSize: '19px' }} /></div>
          <span className="mobile-nav-label">Home</span>
        </button>

        {/* Clients */}
        <button
          onClick={() => navigate('/cases')}
          className={`mobile-nav-btn ${location.pathname === '/cases' ? 'active' : ''}`}
          aria-label="Clients"
        >
          <div className="mobile-nav-icon-wrap"><i className="ti ti-users" style={{ fontSize: '19px' }} /></div>
          <span className="mobile-nav-label">Clients</span>
        </button>

        {/* Team */}
        <button
          onClick={() => navigate('/users')}
          className={`mobile-nav-btn ${location.pathname === '/users' ? 'active' : ''}`}
          aria-label="Team"
        >
          <div className="mobile-nav-icon-wrap"><i className="ti ti-users-group" style={{ fontSize: '19px' }} /></div>
          <span className="mobile-nav-label">Team</span>
        </button>

        {/* Account */}
        <button
          onClick={() => setAccountDrawerOpen(true)}
          className={`mobile-nav-btn ${accountDrawerOpen ? 'active' : ''}`}
          aria-label="Account"
        >
          <div
            className="mobile-nav-icon-wrap"
            style={{
              background: accountDrawerOpen ? roleColor : 'var(--surface-2)',
              borderRadius: 'var(--radius-md)',
              width: '32px', height: '32px',
            }}
          >
            <span style={{
              fontSize: '12px', fontWeight: 800, color: accountDrawerOpen ? '#fff' : 'var(--text-3)',
            }}>
              {initials}
            </span>
          </div>
          <span className="mobile-nav-label" style={{ marginTop: '2px' }}>Account</span>
        </button>
      </nav>

      {/* ── Account Drawer (Bottom Sheet) ─────────────────────────────────────── */}
      {accountDrawerOpen && (
        <>
          <div
            onClick={() => setAccountDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 190,
              background: 'hsla(222,47%,5%,0.55)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              animation: 'fadeIn 0.2s ease both',
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
            background: 'var(--surface)',
            borderTopLeftRadius: 'var(--radius-2xl)',
            borderTopRightRadius: 'var(--radius-2xl)',
            padding: '24px 16px 32px',
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '20px', borderBottom: '1px solid var(--border-2)', marginBottom: '16px', flexShrink: 0 }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: roleColor, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 700
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{userName}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-4)', textTransform: 'capitalize', marginTop: '2px' }}>{roleLabel}</div>
              </div>
              <button 
                onClick={() => setAccountDrawerOpen(false)} 
                style={{ marginLeft: 'auto', background: 'var(--surface-2)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', cursor: 'pointer' }}
              >
                <i className="ti ti-x" style={{ fontSize: '16px' }} />
              </button>
            </div>

            {/* Other nav items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {groups.flatMap(g => g.items)
                .filter(i => !['Dashboard', 'Customers', 'All Customers', 'Team'].includes(i.name))
                .map(item => {
                  const iconCls = ICONS[item.name] || 'ti ti-point';
                  return (
                    <button
                      key={item.name}
                      onClick={() => { handleNav(item); setAccountDrawerOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 12px',
                        background: 'none', border: 'none', width: '100%', textAlign: 'left',
                        fontSize: '15px', fontWeight: 600, color: 'var(--text-2)', borderRadius: 'var(--radius-md)',
                        fontFamily: 'inherit', cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <i className={iconCls} style={{ fontSize: '20px', width: '24px', textAlign: 'center', color: 'var(--text-4)' }} />
                      <span style={{ flex: 1 }}>{item.name}</span>
                      {item.external && <i className="ti ti-external-link" style={{ fontSize: '14px', color: 'var(--text-5)' }} />}
                    </button>
                  );
                })
              }
              
              {/* Divider if there are items above */}
              {groups.flatMap(g => g.items).filter(i => !['Dashboard', 'Customers', 'All Customers', 'Team'].includes(i.name)).length > 0 && (
                <div style={{ height: '1px', background: 'var(--border-2)', margin: '8px 0' }} />
              )}

              {/* Fixed Actions */}
              <button
                onClick={() => { navigate('/profile'); setAccountDrawerOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 12px', background: 'none', border: 'none', width: '100%', textAlign: 'left', fontSize: '15px', fontWeight: 600, color: 'var(--text-2)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <i className="ti ti-user" style={{ fontSize: '20px', width: '24px', textAlign: 'center', color: 'var(--text-4)' }} />
                <span>Profile Settings</span>
              </button>

              <button
                onClick={toggleDark}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 12px', background: 'none', border: 'none', width: '100%', textAlign: 'left', fontSize: '15px', fontWeight: 600, color: 'var(--text-2)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <i className={darkMode ? "ti ti-sun" : "ti ti-moon"} style={{ fontSize: '20px', width: '24px', textAlign: 'center', color: 'var(--text-4)' }} />
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button
                onClick={() => { navigate('/support'); setAccountDrawerOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 12px', background: 'none', border: 'none', width: '100%', textAlign: 'left', fontSize: '15px', fontWeight: 600, color: 'var(--text-2)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <i className="ti ti-headset" style={{ fontSize: '20px', width: '24px', textAlign: 'center', color: 'var(--text-4)' }} />
                <span>Help & Support</span>
              </button>

              <button
                onClick={() => { onLogout(); setAccountDrawerOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 12px', background: 'var(--color-danger-muted)', border: 'none', width: '100%', textAlign: 'left', fontSize: '15px', fontWeight: 600, color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginTop: '8px', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                <i className="ti ti-logout" style={{ fontSize: '20px', width: '24px', textAlign: 'center', color: 'var(--color-danger)' }} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
