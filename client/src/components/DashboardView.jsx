import React from 'react';
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
  Radio
} from 'lucide-react';

export default function DashboardView({ stats, config, connection, isMerchantMode, onOpenConnect, onNavigate }) {
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
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-card-title-group">
              <div className="metric-icon-box box-red">
                <ShoppingBag size={18} />
              </div>
              <span className="metric-label">Store Orders & Revenue</span>
            </div>
            <div className="trend-badge badge-trend-green">
              {stats.totalOrdersBoosted} Orders
            </div>
          </div>
          <div className="metric-large-number">
            ${stats.revenueGenerated ? stats.revenueGenerated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="metric-comparison">
            Directly synced from real Shopify orders
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
          <div className="report-link" onClick={() => onNavigate('simulator')}>
            Test in Live Simulator <ArrowRight size={14} />
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
                    <span>{regionName}</span>
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
            No customer events recorded yet. Browse your store with the booster enabled or test with the Storefront Simulator.
          </div>
        )}
      </div>
    </div>
  );
}
