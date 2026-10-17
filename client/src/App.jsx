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
  ChevronDown
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

  const refreshAllData = async () => {
    try {
      const storesRes = await fetch('/api/stores');
      const sData = await storesRes.json();
      setStoresData(sData);

      const active = sData.stores?.find(s => s.id === sData.activeStoreId) || sData.stores?.[0] || null;
      setActiveStore(active);

      const statsRes = await fetch('/api/stats');
      const stData = await statsRes.json();
      setStats(stData);

      const configRes = await fetch('/api/config');
      const cfgData = await configRes.json();
      setConfig(cfgData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateConfig = async (newConfig) => {
    setConfig(newConfig);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
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

  const storeInitials = activeStore?.storeName 
    ? activeStore.storeName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

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
                {storesData.stores?.length > 0 ? `${storesData.stores.length} Stores Connected` : 'Multi-Store SaaS'}
              </div>
            </div>
          </div>
        </div>

        {/* Store Selector Pill in Sidebar */}
        <div style={{ padding: '0 14px 10px 14px' }}>
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

          <div 
            className={`nav-item ${currentView === 'guide' ? 'active' : ''}`}
            onClick={() => setCurrentView('guide')}
          >
            <BookOpen size={16} className="nav-icon" />
            <span>Go Live Guide</span>
          </div>
        </nav>

        {/* Sidebar Footer User / Store Profile */}
        <div className="sidebar-footer" onClick={() => setIsConnectModalOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="user-profile">
            <div className="avatar-circle">
              {storeInitials}
            </div>
            <div className="user-info">
              <div className="user-name" style={{ maxWidth: '130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeStore?.storeName || 'Add Store'}
              </div>
              <div className="user-role">
                {activeStore ? activeStore.shopDomain : 'Click to add store'}
              </div>
            </div>
          </div>
          <ChevronsUpDown size={15} color="#94a3b8" />
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
            {activeStore && (
              <>
                <span className="crumb-separator">›</span>
                <span style={{ fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {activeStore.storeName}
                </span>
              </>
            )}
          </div>

          <div className="top-nav-actions">
            {/* Quick Store Switcher if multiple stores exist */}
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
              connection={{
                isConnected: !!activeStore,
                shopDomain: activeStore?.shopDomain || '',
                storeDetails: { name: activeStore?.storeName || 'Add Your First Store' },
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
