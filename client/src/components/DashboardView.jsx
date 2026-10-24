import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  FileText, 
  User, 
  BarChart2, 
  Download, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Search,
  Zap,
  Globe,
  Store,
  ShieldCheck,
  Radio,
  MapPin,
  RefreshCw,
  Clock,
  Play,
  Pause,
  Activity,
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Check,
  ExternalLink,
  Key
} from 'lucide-react';

export default function DashboardView({ stats, config, connection, isMerchantMode, onOpenConnect, onNavigate, onRefreshData }) {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase().replace(/,/g, ' ·');

  const merchantName = connection?.storeDetails?.name || config?.storeName || (isMerchantMode ? 'USA BEAUTY STORE' : 'Store Admin');
  const isConnected = connection?.isConnected;

  // Real region list from recorded visitor telemetry
  const regionEntries = Object.entries(stats?.regions || {});
  const totalRegionHits = regionEntries.reduce((sum, [, count]) => sum + count, 0);

  const formatCountryName = (code) => {
    if (!code) return 'Unknown';
    const clean = String(code).trim().toUpperCase();
    const map = {
      'US': 'United States (US)',
      'USA': 'United States (US)',
      'UNITED STATES': 'United States (US)',
      'PK': 'Pakistan (PK)',
      'GB': 'United Kingdom (UK)',
      'UK': 'United Kingdom (UK)',
      'CA': 'Canada (CA)',
      'AU': 'Australia (AU)',
      'DE': 'Germany (DE)',
      'FR': 'France (FR)',
      'IT': 'Italy (IT)',
      'ES': 'Spain (ES)',
      'NL': 'Netherlands (NL)',
      'AE': 'United Arab Emirates (UAE)',
      'SA': 'Saudi Arabia (SA)',
      'IN': 'India (IN)'
    };
    return map[clean] || code;
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return { val: '0', unit: '' };
    if (num >= 1000000) return { val: (num / 1000000).toFixed(2), unit: 'M' };
    if (num >= 1000) return { val: (num / 1000).toFixed(1), unit: 'K' };
    return { val: String(num), unit: '' };
  };

  const visitsFmt = formatNumber(stats.totalVisitors || 0);
  const viewsFmt = formatNumber(stats.pageViews || 0);
  const organicFmt = formatNumber(stats.organicVisitors || 0);
  const ordersFmt = formatNumber(stats.totalOrdersBoosted || 0);

  const [isGeneratingTraffic, setIsGeneratingTraffic] = useState(false);
  const [trafficResult, setTrafficResult] = useState(null);
  const [viewsCountInput, setViewsCountInput] = useState('240');
  const [targetPathInput, setTargetPathInput] = useState('/');

  const handleSendViews = async (countOverride) => {
    setIsGeneratingTraffic(true);
    setTrafficResult(null);
    try {
      const countToSend = countOverride !== undefined ? countOverride : parseInt(viewsCountInput, 10);
      const qs = connection?.shopDomain ? `?shop=${encodeURIComponent(connection.shopDomain)}` : '';
      const res = await fetch(`/api/traffic/boost${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          count: countToSend,
          targetPath: targetPathInput || '/'
        })
      });
      const data = await res.json();
      if (data.success) {
        setTrafficResult(data.message);
        if (onRefreshData) onRefreshData();
        setTimeout(() => setTrafficResult(null), 10000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTraffic(false);
    }
  };

  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [syncOrderMsg, setSyncOrderMsg] = useState(null);

  // Orders & Auto-Sync Management Modal State
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [ordersList, setOrdersList] = useState([]);
  const [ordersModalTab, setOrdersModalTab] = useState('list'); // 'list' | 'import' | 'setup'
  const [orderImportText, setOrderImportText] = useState('');
  const [isImportingOrders, setIsImportingOrders] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [tokenSaveResult, setTokenSaveResult] = useState(null);
  const [hasShopifyToken, setHasShopifyToken] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://booster-5imz.onrender.com/api/webhooks/orders/create');
  const [webhookCopied, setWebhookCopied] = useState(false);

  const fetchOrdersList = async () => {
    try {
      const qs = connection?.shopDomain ? `?shop=${encodeURIComponent(connection.shopDomain)}` : '';
      const res = await fetch(`/api/stores/orders${qs}`);
      const data = await res.json();
      if (data.success) {
        setOrdersList(data.orders || []);
        setHasShopifyToken(Boolean(data.hasToken));
        if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
      }
    } catch (e) {
      console.warn('Failed to fetch orders:', e);
    }
  };

  // Auto-Pilot Continuous Traffic Engine State
  const [autoTrafficCfg, setAutoTrafficCfg] = useState({
    enabled: true,
    intervalMinutes: 5,
    minViewsPerCycle: 2,
    maxViewsPerCycle: 8,
    targetPath: '/',
    dailyAddedCount: 0,
    secondsUntilNextRun: 300
  });
  const [isUpdatingAutoTraffic, setIsUpdatingAutoTraffic] = useState(false);
  const [autoTrafficNotice, setAutoTrafficNotice] = useState(null);
  const [isTriggeringCycle, setIsTriggeringCycle] = useState(false);
  const [showAdvancedAutoCfg, setShowAdvancedAutoCfg] = useState(false);

  const fetchAutoTrafficStatus = async () => {
    try {
      const qs = connection?.shopDomain ? `?shop=${encodeURIComponent(connection.shopDomain)}` : '';
      const res = await fetch(`/api/traffic/auto-status${qs}`);
      const data = await res.json();
      if (data.success && data.autoTraffic) {
        setAutoTrafficCfg(prev => ({
          ...prev,
          ...data.autoTraffic
        }));
      }
    } catch (e) {
      console.warn('Auto-traffic status error:', e);
    }
  };

  useEffect(() => {
    fetchAutoTrafficStatus();
    const interval = setInterval(fetchAutoTrafficStatus, 4000);
    return () => clearInterval(interval);
  }, [connection?.shopDomain]);

  // Real-time second countdown to next automatic run
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoTrafficCfg(prev => {
        if (!prev.enabled) return prev;
        if (!prev.secondsUntilNextRun || prev.secondsUntilNextRun <= 1) {
          fetchAutoTrafficStatus();
          return { ...prev, secondsUntilNextRun: (prev.intervalMinutes || 5) * 60 };
        }
        return { ...prev, secondsUntilNextRun: Math.max(1, prev.secondsUntilNextRun - 1) };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateAutoTraffic = async (patch) => {
    setIsUpdatingAutoTraffic(true);
    setAutoTrafficNotice(null);
    try {
      const qs = connection?.shopDomain ? `?shop=${encodeURIComponent(connection.shopDomain)}` : '';
      const res = await fetch(`/api/traffic/auto-config${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (data.success && data.autoTraffic) {
        setAutoTrafficCfg(prev => ({
          ...prev,
          ...data.autoTraffic
        }));
        setAutoTrafficNotice(data.message || 'Auto-Pilot settings saved!');
        if (onRefreshData) onRefreshData();
        setTimeout(() => setAutoTrafficNotice(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingAutoTraffic(false);
    }
  };

  const handleTriggerAutoCycle = async () => {
    setIsTriggeringCycle(true);
    setAutoTrafficNotice(null);
    try {
      const qs = connection?.shopDomain ? `?shop=${encodeURIComponent(connection.shopDomain)}` : '';
      const res = await fetch(`/api/traffic/auto-trigger${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setAutoTrafficNotice(data.message);
        if (data.autoTraffic) {
          setAutoTrafficCfg(prev => ({
            ...prev,
            ...data.autoTraffic
          }));
        }
        if (onRefreshData) onRefreshData();
        setTimeout(() => setAutoTrafficNotice(null), 6000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriggeringCycle(false);
    }
  };

  const handleSyncOrders = async () => {
    setIsSyncingOrders(true);
    setSyncOrderMsg(null);
    try {
      const qs = connection?.shopDomain ? `?shop=${encodeURIComponent(connection.shopDomain)}` : '';
      const res = await fetch(`/api/stores/sync-orders${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.orders) setOrdersList(data.orders);
      if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
      if (data.success) {
        setSyncOrderMsg(data.message || 'Orders synced!');
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSyncOrderMsg(null), 5000);
      } else {
        setSyncOrderMsg(data.message || data.error || 'Sync notice: token required');
        if (data.requiresToken) {
          setShowOrdersModal(true);
          setOrdersModalTab('setup');
          fetchOrdersList();
        }
        setTimeout(() => setSyncOrderMsg(null), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingOrders(false);
    }
  };

  const handleImportOrders = async (e) => {
    e.preventDefault();
    if (!orderImportText.trim()) return;
    setIsImportingOrders(true);
    setImportResult(null);
    try {
      const qs = connection?.shopDomain ? `?shop=${encodeURIComponent(connection.shopDomain)}` : '';
      const res = await fetch(`/api/stores/import-orders${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: orderImportText })
      });
      const data = await res.json();
      if (data.success) {
        setImportResult({ type: 'success', text: data.message });
        setOrdersList(data.orders || []);
        setOrderImportText('');
        if (onRefreshData) onRefreshData();
        setTimeout(() => setOrdersModalTab('list'), 1500);
      } else {
        setImportResult({ type: 'error', text: data.error || 'Failed to parse orders' });
      }
    } catch (err) {
      setImportResult({ type: 'error', text: 'Network error importing orders' });
    } finally {
      setIsImportingOrders(false);
    }
  };

  const handleSaveToken = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setIsSavingToken(true);
    setTokenSaveResult(null);
    try {
      const qs = connection?.shopDomain ? `?shop=${encodeURIComponent(connection.shopDomain)}` : '';
      const res = await fetch(`/api/stores/save-token${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tokenInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setTokenSaveResult({ type: 'success', text: data.message });
        setHasShopifyToken(true);
        setOrdersList(data.orders || []);
        setTokenInput('');
        if (onRefreshData) onRefreshData();
      } else {
        setTokenSaveResult({ type: 'error', text: data.error || 'Failed to save token' });
      }
    } catch (err) {
      setTokenSaveResult({ type: 'error', text: 'Network connection error' });
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2500);
  };

  return (
    <div>
      {/* Top Banner Connection Notice */}
      {isMerchantMode ? (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '16px',
          padding: '14px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}></span>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#065f46' }}>
                Booster Engine is Live & Active on {merchantName}
              </div>
              <div style={{ fontSize: '12px', color: '#047857' }}>
                Real-time traffic telemetry, social proof popups, and conversion widgets are actively running on your storefront.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-white"
            onClick={() => onNavigate('widgets')}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Customize Widgets
          </button>
        </div>
      ) : (!isConnected ? (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#2563eb',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '14px' }}>
                Connect your real Shopify Store to sync live products & orders
              </div>
              <div style={{ fontSize: '12.5px', color: '#3b82f6' }}>
                Enter your store domain and Shopify Admin API Token to activate real-time tracking with 0 dummy data.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-blue"
            onClick={onOpenConnect}
            style={{ fontSize: '13px' }}
          >
            <ShieldCheck size={16} /> Connect Live Shopify Store
          </button>
        </div>
      ) : (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '16px',
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}></span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>
              Live Store Connected: <strong>{connection?.storeDetails?.name}</strong> ({connection?.shopDomain})
            </span>
            <span className="badge badge-green" style={{ fontSize: '11px' }}>
              {connection.realProductCount || 0} Products Synced
            </span>
          </div>
          <button 
            className="btn btn-white"
            onClick={onOpenConnect}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Manage Connection
          </button>
        </div>
      ))}

      {/* Page Header (Adminator Style) */}
      <div className="page-header-wrap">
        <div>
          <div className="header-date-tag">{formattedDate}</div>
          <h1 className="page-title">
            Welcome back, <span className="highlight-blue">{merchantName}</span>
          </h1>
          <p className="page-subtitle">
            {stats.totalVisitors > 0 ? (
              <>
                Live store tracking is active. Total visitors recorded: <strong>{stats.totalVisitors}</strong> with <strong>{stats.organicSharePercent}%</strong> arriving organically.
              </>
            ) : (
              <>
                Booster engine is running live. Embed script is ready on your storefront to capture incoming organic shoppers.
              </>
            )}
          </p>
        </div>

        <div className="header-action-btns">
          {!isMerchantMode && (
            <button className="btn btn-white" onClick={onOpenConnect}>
              <Store size={15} /> Store Settings
            </button>
          )}
          <button className="btn btn-blue" onClick={() => onNavigate('seo')}>
            <Plus size={15} /> New SEO Article
          </button>
        </div>
      </div>

      {/* 24/7 Automated Daily Traffic Engine Card (Store Admin Panel - Never Visible to Storefront Shoppers) */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
        border: '1px solid #bfdbfe',
        borderRadius: '16px',
        padding: '22px 24px',
        marginBottom: '26px',
        boxShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.08)'
      }}>
        {/* Top Header & Live Status */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '18px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className={autoTrafficCfg.enabled ? "badge badge-green" : "badge badge-gray"} style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: autoTrafficCfg.enabled ? '#10b981' : '#94a3b8',
                  boxShadow: autoTrafficCfg.enabled ? '0 0 8px #10b981' : 'none',
                  display: 'inline-block'
                }}></span>
                {autoTrafficCfg.enabled ? '24/7 Auto-Pilot: ACTIVE' : 'Auto-Pilot: PAUSED'}
              </span>

              <span className="badge badge-blue" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={12} /> Store Admin Only • 100% Hidden From Storefront Shoppers
              </span>

              <span className="badge badge-purple" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={12} /> Target: United States (US Metros)
              </span>
            </div>

            <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: '#2563eb' }} />
              Automated Daily Views Engine
            </div>
            <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '3px', maxWidth: '720px', lineHeight: 1.5 }}>
              Automatically streams realistic random US views on a recurring schedule round-the-clock (every few minutes or hours). Runs non-stop on the server even when your computer is closed.
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={autoTrafficCfg.enabled ? "btn btn-white" : "btn btn-blue"}
              onClick={() => handleUpdateAutoTraffic({ enabled: !autoTrafficCfg.enabled })}
              disabled={isUpdatingAutoTraffic}
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                fontWeight: 600,
                borderColor: autoTrafficCfg.enabled ? '#cbd5e1' : '#2563eb',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {autoTrafficCfg.enabled ? (
                <>
                  <Pause size={14} color="#64748b" /> Pause Auto-Pilot
                </>
              ) : (
                <>
                  <Play size={14} /> Resume Auto-Pilot
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-blue"
              onClick={handleTriggerAutoCycle}
              disabled={isTriggeringCycle}
              style={{
                fontSize: '12.5px',
                padding: '7px 16px',
                fontWeight: 700,
                boxShadow: '0 3px 10px rgba(37, 99, 235, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isTriggeringCycle ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Adding Views...
                </>
              ) : (
                <>
                  <Zap size={14} /> ⚡ Trigger Cycle Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Live Metric Pills */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginBottom: '18px'
        }}>
          {/* Stat 1: Delivered Today */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} color="#2563eb" /> Added Today (Auto)
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              +{autoTrafficCfg.dailyAddedCount || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>
              Persists across restarts
            </div>
          </div>

          {/* Stat 2: Interval */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sliders size={13} color="#10b981" /> Delivery Interval
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {autoTrafficCfg.intervalMinutes < 60 ? `Every ${autoTrafficCfg.intervalMinutes}m` : `Every ${Math.round(autoTrafficCfg.intervalMinutes / 60)}h`}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Automated scheduler
            </div>
          </div>

          {/* Stat 3: Volume / Batch */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Eye size={13} color="#8b5cf6" /> Views per Cycle
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {autoTrafficCfg.minViewsPerCycle} - {autoTrafficCfg.maxViewsPerCycle} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>views</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Randomized variance
            </div>
          </div>

          {/* Stat 4: Next Run Countdown */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Radio size={13} color={autoTrafficCfg.enabled ? "#ef4444" : "#94a3b8"} className={autoTrafficCfg.enabled ? "animate-pulse" : ""} /> Next Auto Run
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: autoTrafficCfg.enabled ? '#2563eb' : '#94a3b8', marginTop: '4px', fontFamily: 'monospace' }}>
              {autoTrafficCfg.enabled ? (
                `${Math.floor((autoTrafficCfg.secondsUntilNextRun || 0) / 60)}m ${String((autoTrafficCfg.secondsUntilNextRun || 0) % 60).padStart(2, '0')}s`
              ) : (
                'Paused'
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {autoTrafficCfg.enabled ? 'Live background timer' : 'Enable to resume'}
            </div>
          </div>
        </div>

        {/* Schedule & Volume Controls */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Row 1: Frequency Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#2563eb" /> Run Schedule (Frequency):
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'Every 1 min (Turbo)', val: 1 },
                { label: 'Every 2 mins', val: 2 },
                { label: 'Every 5 mins (Default)', val: 5 },
                { label: 'Every 15 mins', val: 15 },
                { label: 'Every 30 mins', val: 30 },
                { label: 'Every 1 hour', val: 60 }
              ].map(opt => {
                const isActive = autoTrafficCfg.intervalMinutes === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleUpdateAutoTraffic({ intervalMinutes: opt.val })}
                    disabled={isUpdatingAutoTraffic}
                    style={{
                      fontSize: '11.5px',
                      padding: '5px 11px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isActive ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      background: isActive ? '#eff6ff' : '#f8fafc',
                      color: isActive ? '#1d4ed8' : '#475569'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Volume Intensity Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={14} color="#10b981" /> Random View Intensity:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'Gentle (2-5 views)', min: 2, max: 5 },
                { label: 'Steady (5-12 views)', min: 5, max: 12 },
                { label: 'High (15-30 views)', min: 15, max: 30 },
                { label: 'Surge (35-70 views)', min: 35, max: 70 }
              ].map(opt => {
                const isActive = autoTrafficCfg.minViewsPerCycle === opt.min && autoTrafficCfg.maxViewsPerCycle === opt.max;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleUpdateAutoTraffic({ minViewsPerCycle: opt.min, maxViewsPerCycle: opt.max })}
                    disabled={isUpdatingAutoTraffic}
                    style={{
                      fontSize: '11.5px',
                      padding: '5px 11px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isActive ? '1px solid #10b981' : '1px solid #e2e8f0',
                      background: isActive ? '#ecfdf5' : '#f8fafc',
                      color: isActive ? '#065f46' : '#475569'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowAdvancedAutoCfg(!showAdvancedAutoCfg)}
                style={{
                  fontSize: '11.5px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  background: showAdvancedAutoCfg ? '#f1f5f9' : '#ffffff',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {showAdvancedAutoCfg ? '▲ Custom Range' : '▼ Custom Range'}
              </button>
            </div>
          </div>

          {/* Expandable Advanced Options */}
          {showAdvancedAutoCfg && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 14px',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>Min Views:</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={autoTrafficCfg.minViewsPerCycle}
                  onChange={(e) => handleUpdateAutoTraffic({ minViewsPerCycle: parseInt(e.target.value, 10) || 1 })}
                  style={{ width: '70px', padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>Max Views:</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={autoTrafficCfg.maxViewsPerCycle}
                  onChange={(e) => handleUpdateAutoTraffic({ maxViewsPerCycle: parseInt(e.target.value, 10) || 10 })}
                  style={{ width: '70px', padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>Landing Page:</span>
                <input
                  type="text"
                  value={autoTrafficCfg.targetPath || '/'}
                  onChange={(e) => handleUpdateAutoTraffic({ targetPath: e.target.value })}
                  placeholder="/"
                  style={{ width: '130px', padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}
                />
              </div>

              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Changes save automatically and apply immediately to ongoing cycles.
              </span>
            </div>
          )}
        </div>

        {/* Live Feedback Toast Notification */}
        {autoTrafficNotice && (
          <div style={{
            marginTop: '14px',
            padding: '11px 16px',
            borderRadius: '8px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            fontSize: '13px',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)'
          }}>
            <Sparkles size={16} style={{ color: '#10b981', flexShrink: 0 }} />
            {autoTrafficNotice}
          </div>
        )}

        {/* Optional Manual Super Admin Quick Presets */}
        {!isMerchantMode && (
          <div style={{
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px dashed #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge badge-blue" style={{ fontSize: '10px' }}>Admin Manual Burst</span>
              Send one-off instant traffic spikes:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-white"
                onClick={() => { setViewsCountInput('27'); handleSendViews(27); }}
                disabled={isGeneratingTraffic}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                +27 Views
              </button>
              <button
                type="button"
                className="btn btn-white"
                onClick={() => { setViewsCountInput('240'); handleSendViews(240); }}
                disabled={isGeneratingTraffic}
                style={{ fontSize: '11px', padding: '4px 10px', color: '#1d4ed8', borderColor: '#93c5fd' }}
              >
                +240 Views
              </button>
              <button
                type="button"
                className="btn btn-white"
                onClick={() => { setViewsCountInput('300'); handleSendViews(300); }}
                disabled={isGeneratingTraffic}
                style={{ fontSize: '11px', padding: '4px 10px', color: '#15803d', borderColor: '#86efac' }}
              >
                +300 Views
              </button>
              {trafficResult && (
                <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
                  {trafficResult}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2x2 Metric Cards Grid (Real Store Telemetry) */}
      <div className="metrics-grid-2x2">
        {/* Card 1: Total Visits */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-card-title-group">
              <div className="metric-icon-box box-green">
                <Eye size={18} />
              </div>
              <span className="metric-label">Total Store Visits</span>
            </div>
            <div className="trend-badge badge-trend-green">
              <Radio size={12} className="animate-pulse" /> Live Telemetry
            </div>
          </div>
          <div className="metric-large-number">
            {visitsFmt.val}<span className="unit">{visitsFmt.unit}</span>
          </div>
          <div className="metric-comparison">
            Real visits recorded via storefront embed script
          </div>
        </div>

        {/* Card 2: Page Views */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-card-title-group">
              <div className="metric-icon-box box-blue">
                <FileText size={18} />
              </div>
              <span className="metric-label">Store Page Views</span>
            </div>
            <div className="trend-badge badge-trend-teal">
              Active Tracking
            </div>
          </div>
          <div className="metric-large-number">
            {viewsFmt.val}<span className="unit">{viewsFmt.unit}</span>
          </div>
          <div className="metric-comparison">
            Total product & collection impressions browsed
          </div>
        </div>

        {/* Card 3: Organic Search Visitors */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-card-title-group">
              <div className="metric-icon-box box-purple">
                <Search size={18} />
              </div>
              <span className="metric-label">Organic Search Traffic</span>
            </div>
            <div className="trend-badge badge-trend-purple">
              {stats.organicSharePercent}% of total
            </div>
          </div>
          <div className="metric-large-number">
            {organicFmt.val}<span className="unit">{organicFmt.unit}</span>
          </div>
          <div className="metric-comparison">
            Free visits from Google, Bing, Pinterest & TikTok
          </div>
        </div>

        {/* Card 4: Orders & Revenue Boosted */}
        <div className="metric-card" style={{ position: 'relative' }}>
          <div className="metric-card-top">
            <div className="metric-card-title-group">
              <div className="metric-icon-box box-red">
                <ShoppingBag size={18} />
              </div>
              <span className="metric-label">Store Orders & Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div 
                className="trend-badge badge-trend-green"
                onClick={() => { setShowOrdersModal(true); fetchOrdersList(); }}
                style={{ cursor: 'pointer' }}
                title="Click to view all real orders"
              >
                {stats.totalOrdersBoosted || 0} Orders
              </div>
              <button
                type="button"
                onClick={() => { setShowOrdersModal(true); fetchOrdersList(); }}
                title="Manage Orders & Auto-Sync"
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  cursor: 'pointer',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Orders</span>
              </button>
              <button
                type="button"
                onClick={handleSyncOrders}
                disabled={isSyncingOrders}
                title="Sync Live Orders from Shopify"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: isSyncingOrders ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: isSyncingOrders ? '#2563eb' : '#64748b',
                  borderRadius: '6px',
                  transition: 'color 0.2s'
                }}
              >
                <RefreshCw size={13} style={{ animation: isSyncingOrders ? 'spin 0.8s linear infinite' : 'none' }} />
              </button>
            </div>
          </div>
          <div 
            className="metric-large-number"
            onClick={() => { setShowOrdersModal(true); fetchOrdersList(); }}
            style={{ cursor: 'pointer' }}
            title="Click to view order breakdown"
          >
            ${stats.revenueGenerated ? stats.revenueGenerated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="metric-comparison" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span 
              onClick={() => { setShowOrdersModal(true); fetchOrdersList(); }}
              style={{ color: syncOrderMsg ? '#2563eb' : '#94a3b8', fontWeight: syncOrderMsg ? 600 : 400, cursor: 'pointer' }}
            >
              {syncOrderMsg ? syncOrderMsg : 'Directly synced from real Shopify orders'}
            </span>
            <span 
              onClick={() => { setShowOrdersModal(true); setOrdersModalTab('setup'); fetchOrdersList(); }}
              style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, cursor: 'pointer' }}
              title="Click to configure live auto-sync"
            >
              • Auto-syncing
            </span>
          </div>
        </div>
      </div>

      {/* Geography / Live Visitor Telemetry Report Card */}
      <div className="report-card">
        <div className="report-header">
          <div>
            <div className="report-tag">Real Visitor Geography</div>
            <div className="report-title">Live Store Traffic by Region</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            <span style={{ width: '7px', height: '7px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
            Real-Time Telemetry
          </div>
        </div>

        {regionEntries.length > 0 ? (
          <div className="regions-grid">
            {regionEntries.slice(0, 4).map(([regionName, count], idx) => {
              const pct = totalRegionHits > 0 ? Math.round((count / totalRegionHits) * 100) : 0;
              const colors = ['#8b5cf6', '#10b981', '#2563eb', '#334155'];
              const color = colors[idx % colors.length];

              return (
                <div key={regionName} className="region-item">
                  <div className="region-label-wrap">
                    <span className="region-dot" style={{ background: color }}></span>
                    <span style={{ fontWeight: 600 }}>{formatCountryName(regionName)}</span>
                  </div>
                  <div className="region-value-wrap">
                    <div className="region-value">{count}</div>
                    <div className="region-percent">{pct}%</div>
                  </div>
                  <div className="region-progress-track">
                    <div className="region-progress-bar" style={{ width: `${pct}%`, background: color }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: '36px 20px',
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1'
          }}>
            <Globe size={32} style={{ color: '#2563eb', margin: '0 auto 10px auto' }} />
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Waiting for First Store Visitors
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '4px auto 0 auto' }}>
              When shoppers browse your Shopify store or arrive from search engines, their location and referral source will populate here in real time.
            </p>
          </div>
        )}
      </div>

      {/* Real Live Activity Stream */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Zap size={18} style={{ color: '#2563eb' }} /> Live Activity Stream
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            <span style={{ width: '7px', height: '7px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
            Real-time Feed
          </span>
        </div>

        {stats.recentEvents && stats.recentEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.recentEvents.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #eef2f6'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: item.type === 'popup_conversion' ? '#ecfdf5' : '#eff6ff',
                  color: item.type === 'popup_conversion' ? '#10b981' : '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {(item.type === 'popup_conversion' || item.type === 'order_boosted') ? <ShoppingBag size={16} /> : <Search size={16} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {(item.type === 'popup_conversion' || item.type === 'order_boosted') ? `Real Store Order: $${(Number(item.revenue) || 0).toFixed(2)}` : item.source}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {(item.type === 'popup_conversion' || item.type === 'order_boosted') ? `${item.product} • ${item.buyer || 'Verified Buyer'}` : `Target: ${item.keyword}`}
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            No customer events recorded yet. Live customer visits and browsing activity will appear here in real time.
          </div>
        )}
      </div>

      {/* Real Orders & Auto-Sync Control Modal */}
      {showOrdersModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                    Shopify Real Orders & Auto-Pilot
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Verified Purchase Social Proof & Order Telemetry
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOrdersModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              padding: '0 24px'
            }}>
              <button
                type="button"
                onClick={() => setOrdersModalTab('list')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: ordersModalTab === 'list' ? '#2563eb' : '#64748b',
                  borderBottom: ordersModalTab === 'list' ? '2px solid #2563eb' : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                Recorded Orders ({ordersList.length || stats.totalOrdersBoosted || 0})
              </button>
              <button
                type="button"
                onClick={() => setOrdersModalTab('import')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: ordersModalTab === 'import' ? '#2563eb' : '#64748b',
                  borderBottom: ordersModalTab === 'import' ? '2px solid #2563eb' : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                Quick Import / Paste
              </button>
              <button
                type="button"
                onClick={() => setOrdersModalTab('setup')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: ordersModalTab === 'setup' ? '#2563eb' : '#64748b',
                  borderBottom: ordersModalTab === 'setup' ? '2px solid #2563eb' : '2px solid transparent',
                  marginBottom: '-1px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Live Auto-Sync Setup</span>
                {hasShopifyToken ? (
                  <span style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>Active</span>
                ) : (
                  <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px' }}>Setup Required</span>
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Tab 1: Orders List */}
              {ordersModalTab === 'list' && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#15803d' }}>
                        Verified Revenue: ${stats.revenueGenerated ? stats.revenueGenerated.toFixed(2) : '0.00'} USD
                      </div>
                      <div style={{ fontSize: '12px', color: '#166534' }}>
                        {ordersList.length || stats.totalOrdersBoosted || 0} real Shopify store orders active in Booster social proof
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSyncOrders}
                      disabled={isSyncingOrders}
                      style={{
                        padding: '8px 14px',
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: isSyncingOrders ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={13} style={{ animation: isSyncingOrders ? 'spin 0.8s linear infinite' : 'none' }} />
                      <span>{isSyncingOrders ? 'Syncing...' : 'Sync Shopify'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(ordersList.length > 0 ? ordersList : []).map(order => (
                      <div key={order.id} style={{
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '12px'
                          }}>
                            #{order.order_number || order.id?.slice(-4)}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                              {order.name} <span style={{ color: '#64748b', fontWeight: '400', fontSize: '12px' }}>• {order.city}</span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                              {order.product} • {order.time}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                            ${Number(order.revenue || order.total_price || 0).toFixed(2)}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '3px' }}>
                            <span style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: '#dcfce7',
                              color: '#166534',
                              fontWeight: '600'
                            }}>
                              {order.financial_status || 'Paid'}
                            </span>
                            {order.fulfillment_status && (
                              <span style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: order.fulfillment_status === 'fulfilled' ? '#e0f2fe' : '#fef3c7',
                                color: order.fulfillment_status === 'fulfilled' ? '#0369a1' : '#92400e',
                                fontWeight: '600'
                              }}>
                                {order.fulfillment_status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Quick Import / Paste */}
              {ordersModalTab === 'import' && (
                <div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                    Copy order text straight from your <strong>Shopify Admin ➔ Orders</strong> page and paste it below. The system automatically extracts order IDs, customer names, products, dates, and amounts.
                  </p>

                  <form onSubmit={handleImportOrders}>
                    <textarea
                      rows={8}
                      value={orderImportText}
                      onChange={(e) => setOrderImportText(e.target.value)}
                      placeholder="Paste Shopify order summary, e.g.:&#10;Select gid://shopify/Order/7551651709223&#10;[#1094](...)&#10;Today at 3:13 am&#10;Jerry Brack&#10;$65.84&#10;Paid"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '12.5px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />

                    {importResult && (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        background: importResult.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: importResult.type === 'success' ? '#15803d' : '#b91c1c',
                        border: `1px solid ${importResult.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                      }}>
                        {importResult.text}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                      <button
                        type="submit"
                        disabled={isImportingOrders || !orderImportText.trim()}
                        style={{
                          padding: '10px 20px',
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: (isImportingOrders || !orderImportText.trim()) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isImportingOrders ? 'Parsing & Saving...' : 'Parse & Save Orders'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 3: Auto-Sync Setup */}
              {ordersModalTab === 'setup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Webhook Section */}
                  <div style={{
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#f8fafc'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Zap size={16} color="#2563eb" />
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>Method 1: Shopify Instant Webhook (Zero Delay)</strong>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                      Shopify automatically pushes new orders directly into your Booster database the moment a customer pays:
                    </p>
                    <ol style={{ margin: '0 0 12px 0', paddingLeft: '20px', fontSize: '12.5px', color: '#475569', lineHeight: 1.6 }}>
                      <li>In your Shopify Admin, click <strong>Settings</strong> ➔ <strong>Notifications</strong>.</li>
                      <li>Scroll to the bottom to <strong>Webhooks</strong> and click <strong>Create webhook</strong>.</li>
                      <li>Event: select <strong>Order creation</strong> (and create a second one for <strong>Order payment</strong>). Format: <strong>JSON</strong>.</li>
                      <li>Paste this exact Webhook URL:</li>
                    </ol>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}>
                      <code style={{ flex: 1, fontSize: '12px', color: '#0f172a', wordBreak: 'break-all' }}>
                        {webhookUrl}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyWebhookUrl}
                        style={{
                          padding: '6px 12px',
                          background: webhookCopied ? '#16a34a' : '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}
                      >
                        {webhookCopied ? <Check size={12} /> : <Copy size={12} />}
                        <span>{webhookCopied ? 'Copied!' : 'Copy URL'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Token Section */}
                  <div style={{
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#f8fafc'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Key size={16} color="#2563eb" />
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>Method 2: Shopify Admin API Token (Automatic 60s Polling)</strong>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                      Allows Booster to automatically query Shopify Admin API every 60 seconds and sync all paid/fulfilled orders:
                    </p>

                    <form onSubmit={handleSaveToken} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="password"
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                          placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                        <button
                          type="submit"
                          disabled={isSavingToken || !tokenInput.trim()}
                          style={{
                            padding: '10px 16px',
                            background: '#0f172a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            cursor: (isSavingToken || !tokenInput.trim()) ? 'not-allowed' : 'pointer',
                            flexShrink: 0
                          }}
                        >
                          {isSavingToken ? 'Saving...' : 'Save & Activate'}
                        </button>
                      </div>

                      {tokenSaveResult && (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          background: tokenSaveResult.type === 'success' ? '#f0fdf4' : '#fef2f2',
                          color: tokenSaveResult.type === 'success' ? '#15803d' : '#b91c1c',
                          border: `1px solid ${tokenSaveResult.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                        }}>
                          {tokenSaveResult.text}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
