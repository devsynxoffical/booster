import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  ShoppingBag, 
  Share2, 
  Eye, 
  BookOpen, 
  Zap, 
  Star,
  FileText,
  BarChart2,
  Bell,
  Inbox,
  Moon,
  ChevronsUpDown,
  Download,
  Plus,
  Store,
  ShieldCheck,
  CheckCircle2
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
  const [connection, setConnection] = useState({
    isConnected: false,
    shopDomain: "",
    publicAppUrl: "http://localhost:3005",
    storeDetails: { name: "Connect Store", email: "", currency: "USD", domain: "" },
    realProductCount: 0,
    realOrderCount: 0
  });

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

  const refreshAllData = () => {
    fetch('/api/shopify/status')
      .then(res => res.json())
      .then(data => setConnection(data))
      .catch(() => {});

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});

    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => {});
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 10000); // Poll live stats every 10s
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

  const getBreadcrumbTitle = () => {
    switch(currentView) {
      case 'dashboard': return 'Dashboard';
      case 'seo': return 'Programmatic SEO';
      case 'widgets': return 'Conversion Widgets';
      case 'social': return 'Social Syndication';
      case 'simulator': return 'Storefront Simulator';
      case 'guide': return 'Setup Guide';
      default: return 'Dashboard';
    }
  };

  const storeInitials = connection?.storeDetails?.name 
    ? connection.storeDetails.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  return (
    <div className="app-container">
      {/* Sidebar (Adminator Style) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-badge">
            <div className="brand-icon">
              B
            </div>
            <div className="brand-title-wrap">
              <div className="brand-title">Shopify Booster</div>
              <div className="brand-subtitle">
                {connection?.isConnected ? '● Connected Live' : '○ Setup Required'}
              </div>
            </div>
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
            <span>Live Store</span>
            <span className={connection?.isConnected ? "nav-badge-green" : "nav-badge-blue"}>
              {connection?.isConnected ? "LIVE" : "CONNECT"}
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
            <FileText size={16} className="nav-icon" />
            <span>Go Live Guide</span>
          </div>
        </nav>

        {/* Sidebar Footer Real Store Profile */}
        <div className="sidebar-footer" onClick={() => setIsConnectModalOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="user-profile">
            <div className="avatar-circle">
              {storeInitials}
            </div>
            <div className="user-info">
              <div className="user-name" style={{ maxWidth: '130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {connection?.storeDetails?.name || 'Connect Store'}
              </div>
              <div className="user-role">
                {connection?.isConnected ? connection.shopDomain : 'Click to connect'}
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
          </div>

          <div className="top-nav-actions">
            <button 
              className="btn btn-blue"
              onClick={() => setIsConnectModalOpen(true)}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Store size={14} />
              {connection?.isConnected ? 'Store Settings' : 'Connect Store'}
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
              title="Manage Shopify Connection"
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
              connection={connection}
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

      {/* Shopify Connection Modal */}
      <ShopifyConnectModal 
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        connectionStatus={connection}
        onConnectionSuccess={refreshAllData}
      />
    </div>
  );
}
