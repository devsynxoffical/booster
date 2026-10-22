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
  Sliders
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
        if (prev.secondsUntilNextRun <= 1) {
          fetchAutoTrafficStatus();
          return { ...prev, secondsUntilNextRun: (prev.intervalMinutes || 5) * 60 };
        }
        return { ...prev, secondsUntilNextRun: prev.secondsUntilNextRun - 1 };
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
      if (data.success) {
        setSyncOrderMsg(data.message || 'Orders synced!');
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSyncOrderMsg(null), 5000);
      } else {
        setSyncOrderMsg(data.error || 'Sync notice: connecting...');
        setTimeout(() => setSyncOrderMsg(null), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingOrders(false);
    }
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

      {/* 24/7 Automated Daily Traffic Engine Card (Super Admin Exclusive - Hidden From Merchants) */}
      {!isMerchantMode && (
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
                <MapPin size={12} /> Target: United States (US Metros)
              </span>

              <span className="badge badge-purple" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Search size={12} /> Google Organic (88%) + Bing & Social
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
      )}

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
              <div className="trend-badge badge-trend-green">
                {stats.totalOrdersBoosted || 0} Orders
              </div>
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
          <div className="metric-large-number">
            ${stats.revenueGenerated ? stats.revenueGenerated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="metric-comparison" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: syncOrderMsg ? '#2563eb' : '#94a3b8', fontWeight: syncOrderMsg ? 600 : 400 }}>
              {syncOrderMsg ? syncOrderMsg : 'Directly synced from real Shopify orders'}
            </span>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>• Auto-syncing</span>
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
                  {item.type === 'popup_conversion' ? <ShoppingBag size={16} /> : <Search size={16} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {item.type === 'popup_conversion' ? `Real Store Order: $${item.revenue.toFixed(2)}` : item.source}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {item.type === 'popup_conversion' ? `${item.product} • ${item.buyer}` : `Target: ${item.keyword}`}
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
    </div>
  );
}
