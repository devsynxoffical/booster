import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  ShoppingBag, 
  Share2, 
  Eye, 
  BookOpen, 
  BarChart2, 
  Bell, 
  Moon, 
  ChevronsUpDown, 
  Plus, 
  Store, 
  Layers,
  ChevronDown,
  Lock,
  LogOut,
  ShieldAlert
} from 'lucide-react';

import DashboardView from './components/DashboardView.jsx';
import SeoEngineView from './components/SeoEngineView.jsx';
import WidgetsConfigView from './components/WidgetsConfigView.jsx';
import SocialSyndicationView from './components/SocialSyndicationView.jsx';
import StorefrontSimulatorView from './components/StorefrontSimulatorView.jsx';
import SetupGuideView from './components/SetupGuideView.jsx';
import ShopifyConnectModal from './components/ShopifyConnectModal.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [storesData, setStoresData] = useState({ activeStoreId: null, stores: [], appConfig: {} });
  const [activeStore, setActiveStore] = useState(null);

  // Admin Master Password State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('devsynx_admin_auth') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [stats, setStats] = useState({
    totalVisitors: 0,
    pageViews: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    organicVisitors: 0,
    organicSharePercent: 0,
    conversionRate: 0,
    conversionUpliftPercent: 0,
    totalOrdersBoosted: 0,
    revenueGenerated: 0.00,
    popupImpressions: 0,
    popupClicks: 0,
    regions: {},
    recentEvents: []
  });

  const [config, setConfig] = useState({
    storeName: "My Shopify Store",
    storeUrl: "",
    enableBooster: true,
    enablePopups: true,
    popupPosition: "bottom-left",
    popupDelay: 6,
    popupDuration: 5,
    enableVisitorCounter: true,
    minVisitors: 12,
    maxVisitors: 36,
    enableFreeShipping: true,
    freeShippingThreshold: 50,
    shippingCurrency: "$",
    enableCountdown: true,
    countdownMinutes: 15,
    enableSeoSchema: true,
    accentColor: "#2563eb",
    themeMode: "light"
  });

  const getUrlShop = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('shop') || '';
    } catch {
      return '';
    }
  };

  const refreshAllData = async () => {
    try {
      const shopParam = getUrlShop();
      const qs = shopParam ? `?shop=${encodeURIComponent(shopParam)}` : '';

      const storesRes = await fetch(`/api/stores${qs}`);
      const sData = await storesRes.json();
      setStoresData(sData);

      let active = null;
      if (shopParam) {
        const clean = shopParam.replace(/^https?:\/\//, '').replace(/\/$/, '');
        active = sData.stores?.find(s => s.shopDomain === clean || s.shopDomain.includes(clean));
      }
      if (!active) {
        active = sData.stores?.find(s => s.id === sData.activeStoreId) || sData.stores?.[0] || null;
      }
      setActiveStore(active);

      const storeQs = active ? `?shop=${encodeURIComponent(active.shopDomain)}` : qs;

      const statsRes = await fetch(`/api/stats${storeQs}`);
      const stData = await statsRes.json();
      setStats(stData);

      const configRes = await fetch(`/api/config${storeQs}`);
      const cfgData = await configRes.json();
      setConfig(cfgData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateConfig = async (newConfig) => {
    setConfig(newConfig);
    try {
      const qs = activeStore ? `?shop=${encodeURIComponent(activeStore.shopDomain)}` : '';
      await fetch(`/api/config${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newConfig, shop: activeStore?.shopDomain })
      });
    } catch (e) {
      console.error('Failed to update config:', e);
    }
  };

  const handleSwitchStore = async (storeId) => {
    try {
      await fetch('/api/stores/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId })
      });
      refreshAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('devsynx_admin_auth', 'true');
        setIsAdminLoggedIn(true);
        refreshAllData();
      } else {
        setLoginError(data.error || 'Incorrect admin password');
      }
    } catch {
      setLoginError('Could not verify password with server');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('devsynx_admin_auth');
    setIsAdminLoggedIn(false);
  };

  const getBreadcrumbTitle = () => {
    switch(currentView) {
      case 'dashboard': return 'Dashboard';
      case 'seo': return 'Programmatic SEO';
      case 'widgets': return 'Conversion Widgets';
      case 'social': return 'Social Syndication';
      case 'simulator': return 'Storefront Simulator';
      case 'guide': return 'Go Live Guide';
      default: return 'Dashboard';
    }
  };

  const isEmbedded = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('embedded') === '1' || window.self !== window.top;
    } catch {
      return false;
    }
  })();
  const isMerchantMode = isEmbedded || !!getUrlShop();

  const currentStoreDisplayName = activeStore?.storeName || (getUrlShop() ? 'USA BEAUTY STORE' : 'Devsynx Admin');
  const storeInitials = currentStoreDisplayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Super Admin Password Gate (Only shown to agency admins on public website, never to clients inside Shopify)
  if (!isMerchantMode && !isAdminLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '20px',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          width: '100%',
          maxWidth: '430px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          padding: '40px 32px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
            }}>
              <Lock size={26} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
              DEVSYNX Master Admin
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Enter your master password to access multi-store management, client analytics, and API keys.
            </p>
          </div>

          {loginError && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '12.5px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldAlert size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 600 }}>Master Password</label>
              <input 
                type="password"
                className="form-input"
                placeholder="Enter master password..."
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                autoFocus
                required
                style={{ padding: '10px 14px', fontSize: '14px' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-blue" 
              disabled={isLoggingIn}
              style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isLoggingIn ? 'Verifying...' : 'Unlock Admin Panel'}
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              Protected by Devsynx Security · Multi-Store Architecture
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-badge">
            <div className="brand-icon">
              B
            </div>
            <div className="brand-title-wrap">
              <div className="brand-title">Growth Booster</div>
              <div className="brand-subtitle">
                {isMerchantMode ? 'Conversion & SEO Engine' : (storesData.stores?.length > 0 ? `${storesData.stores.length} Stores Connected` : 'Multi-Store SaaS')}
              </div>
            </div>
          </div>
        </div>

        {/* Store Indicator in Sidebar */}
        <div style={{ padding: '0 14px 10px 14px' }}>
          {isMerchantMode ? (
            <div 
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
                flexShrink: 0
              }}></span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentStoreDisplayName}
              </span>
            </div>
          ) : (
            <div 
              onClick={() => setIsConnectModalOpen(true)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activeStore ? '#10b981' : '#94a3b8',
                  flexShrink: 0
                }}></span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeStore ? activeStore.storeName : '+ Connect Store'}
                </span>
              </div>
              <ChevronsUpDown size={14} color="#64748b" style={{ flexShrink: 0 }} />
            </div>
          )}
        </div>

        <nav className="nav-menu">
          <div className="nav-section-title">Workspace</div>

          <div 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <TrendingUp size={16} className="nav-icon" />
            <span>Dashboard</span>
          </div>

          {!isMerchantMode && (
            <div 
              className="nav-item"
              onClick={() => setIsConnectModalOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              <Store size={16} className="nav-icon" />
              <span>Multi-Store</span>
              <span className="nav-badge-blue">
                {storesData.stores?.length || 0}
              </span>
            </div>
          )}

          <div className="nav-section-title">Traffic & Sales</div>

          <div 
            className={`nav-item ${currentView === 'seo' ? 'active' : ''}`}
            onClick={() => setCurrentView('seo')}
          >
            <Search size={16} className="nav-icon" />
            <span>Organic SEO</span>
          </div>

          <div 
            className={`nav-item ${currentView === 'widgets' ? 'active' : ''}`}
            onClick={() => setCurrentView('widgets')}
          >
            <ShoppingBag size={16} className="nav-icon" />
            <span>CRO Widgets</span>
          </div>

          <div 
            className={`nav-item ${currentView === 'social' ? 'active' : ''}`}
            onClick={() => setCurrentView('social')}
          >
            <Share2 size={16} className="nav-icon" />
            <span>Social Syndication</span>
          </div>

          <div className="nav-section-title">Components</div>

          <div 
            className={`nav-item ${currentView === 'simulator' ? 'active' : ''}`}
            onClick={() => setCurrentView('simulator')}
          >
            <BarChart2 size={16} className="nav-icon" />
            <span>Store Simulator</span>
            <span className="nav-badge-green">TEST</span>
          </div>

          {!isMerchantMode && (
            <div 
              className={`nav-item ${currentView === 'guide' ? 'active' : ''}`}
              onClick={() => setCurrentView('guide')}
            >
              <BookOpen size={16} className="nav-icon" />
              <span>Go Live Guide</span>
            </div>
          )}
        </nav>

        {/* Sidebar Footer User / Store Profile */}
        <div className="sidebar-footer" onClick={() => !isMerchantMode && setIsConnectModalOpen(true)} style={{ cursor: isMerchantMode ? 'default' : 'pointer' }}>
          <div className="user-profile">
            <div className="avatar-circle">
              {storeInitials}
            </div>
            <div className="user-info">
              <div className="user-name" style={{ maxWidth: '130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentStoreDisplayName}
              </div>
              <div className="user-role">
                {isMerchantMode ? 'Verified Active Store' : (activeStore ? activeStore.shopDomain : 'Click to add store')}
              </div>
            </div>
          </div>
          {!isMerchantMode && <ChevronsUpDown size={15} color="#94a3b8" />}
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="breadcrumbs">
            <span className="crumb-muted">Workspace</span>
            <span className="crumb-separator">›</span>
            <span className="crumb-active">{getBreadcrumbTitle()}</span>
            <span className="crumb-separator">›</span>
            <span style={{ fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              {currentStoreDisplayName}
            </span>
          </div>

          <div className="top-nav-actions">
            {isMerchantMode ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                color: '#065f46',
                fontWeight: 600
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981'
                }}></span>
                Booster Engine Live & Active
              </div>
            ) : (
              <>
                {storesData.stores && storesData.stores.length > 1 && (
                  <select 
                    className="form-select"
                    style={{ width: 'auto', padding: '5px 10px', fontSize: '12px', background: '#f8fafc' }}
                    value={storesData.activeStoreId || ''}
                    onChange={(e) => handleSwitchStore(e.target.value)}
                  >
                    {storesData.stores.map(s => (
                      <option key={s.id} value={s.id}>{s.storeName} ({s.shopDomain})</option>
                    ))}
                  </select>
                )}

                <button 
                  className="btn btn-blue"
                  onClick={() => setIsConnectModalOpen(true)}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <Plus size={14} /> Add / Switch Store
                </button>

                <button 
                  className="btn btn-white"
                  onClick={handleAdminLogout}
                  title="Lock Admin Panel"
                  style={{ fontSize: '12px', padding: '6px 11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <LogOut size={13} /> Lock
                </button>
              </>
            )}

            <button className="nav-icon-btn" aria-label="Notifications" onClick={refreshAllData} title="Refresh Live Data">
              <Bell size={17} />
            </button>

            <button className="nav-icon-btn" aria-label="Theme Mode">
              <Moon size={17} />
            </button>

            <div 
              className="avatar-circle" 
              style={{ width: '32px', height: '32px', fontSize: '11.5px', marginLeft: '4px', cursor: 'pointer' }}
              onClick={() => setIsConnectModalOpen(true)}
              title="Manage Stores"
            >
              {storeInitials}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="main-content">
          {currentView === 'dashboard' && (
            <DashboardView 
              stats={stats} 
              config={config} 
              isMerchantMode={isMerchantMode}
              connection={{
                isConnected: !!activeStore || isMerchantMode,
                shopDomain: activeStore?.shopDomain || (getUrlShop() || 'chandkali.myshopify.com'),
                storeDetails: { name: currentStoreDisplayName },
                realProductCount: activeStore?.productsCount || 0,
                realOrderCount: activeStore?.ordersCount || 0
              }}
              onOpenConnect={() => setIsConnectModalOpen(true)}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'seo' && (
            <SeoEngineView />
          )}

          {currentView === 'widgets' && (
            <WidgetsConfigView 
              config={config} 
              onUpdateConfig={handleUpdateConfig} 
            />
          )}

          {currentView === 'social' && (
            <SocialSyndicationView />
          )}

          {currentView === 'simulator' && (
            <StorefrontSimulatorView 
              config={config} 
            />
          )}

          {currentView === 'guide' && (
            <SetupGuideView 
              onNavigate={setCurrentView} 
              onOpenConnect={() => setIsConnectModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Multi-Store Manager Modal */}
      <ShopifyConnectModal 
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onStoreChanged={refreshAllData}
      />
    </div>
  );
}
