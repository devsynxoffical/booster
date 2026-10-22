import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  Truck, 
  Flame, 
  Palette, 
  Check, 
  Save, 
  RotateCcw,
  Sparkles,
  Layout
} from 'lucide-react';

export default function WidgetsConfigView({ config, onUpdateConfig }) {
  const [formData, setFormData] = useState({ ...config });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(prev => ({ ...prev, ...config }));
    }
  }, [config]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    await onUpdateConfig(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
            Storefront Conversion Rate Optimization (CRO)
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Customize social proof popups, live visitor counters, free shipping tier bars, and urgency timers.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleSave}
          style={{ minWidth: '150px' }}
        >
          {isSaved ? <><Check size={16} /> Settings Saved!</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* 1. Recent Sales Social Proof Popups */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShoppingBag size={18} style={{ color: '#10b981' }} /> Recent Purchase Popups (Social Proof)
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={formData.enablePopups} 
                onChange={(e) => handleChange('enablePopups', e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Displays realistic recent buyer notifications to establish instant buyer trust and trigger FOMO.
          </p>

          <div className="form-group">
            <label className="form-label">Screen Position</label>
            <select 
              className="form-select"
              value={formData.popupPosition}
              onChange={(e) => handleChange('popupPosition', e.target.value)}
            >
              <option value="bottom-left">Bottom Left (Recommended)</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Interval (Seconds)</label>
              <input 
                type="number" 
                className="form-input"
                min="3" 
                max="30"
                value={formData.popupDelay}
                onChange={(e) => handleChange('popupDelay', parseInt(e.target.value, 10))}
              />
              <div className="form-help">Delay between popups</div>
            </div>

            <div className="form-group">
              <label className="form-label">Duration (Seconds)</label>
              <input 
                type="number" 
                className="form-input"
                min="2" 
                max="15"
                value={formData.popupDuration}
                onChange={(e) => handleChange('popupDuration', parseInt(e.target.value, 10))}
              />
              <div className="form-help">Time on screen</div>
            </div>
          </div>
        </div>

        {/* 2. Free Shipping Goal Bar */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Truck size={18} style={{ color: '#3b82f6' }} /> Free Shipping Goal Progress Bar
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={formData.enableFreeShipping} 
                onChange={(e) => handleChange('enableFreeShipping', e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Increases Average Order Value (AOV) by showing customers exactly how much more they need to spend for free shipping.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Free Shipping Threshold ($)</label>
              <input 
                type="number" 
                className="form-input"
                value={formData.freeShippingThreshold}
                onChange={(e) => handleChange('freeShippingThreshold', parseFloat(e.target.value))}
              />
              <div className="form-help">e.g. $50 or $75 target</div>
            </div>

            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.shippingCurrency || '$'}
                onChange={(e) => handleChange('shippingCurrency', e.target.value)}
              />
              <div className="form-help">$, €, £, CAD</div>
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '12.5px' }}>
            💡 <strong>Smart Cart Sync:</strong> Automatically detects when customers add products to cart and updates the progress bar without reloading the page.
          </div>
        </div>

        {/* 3. Live Viewer & Scarcity Badge */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Flame size={18} style={{ color: '#f43f5e' }} /> Live Shoppers Counter
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={formData.enableVisitorCounter} 
                onChange={(e) => handleChange('enableVisitorCounter', e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Injects an animated flame indicator on product pages showing live shoppers ("🔥 19 people viewing this item").
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Min Shoppers</label>
              <input 
                type="number" 
                className="form-input"
                value={formData.minVisitors}
                onChange={(e) => handleChange('minVisitors', parseInt(e.target.value, 10))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Shoppers</label>
              <input 
                type="number" 
                className="form-input"
                value={formData.maxVisitors}
                onChange={(e) => handleChange('maxVisitors', parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        </div>

        {/* 4. Urgency Countdown Timer */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={18} style={{ color: '#f59e0b' }} /> Cart & Flash Sale Urgency Timer
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={formData.enableCountdown} 
                onChange={(e) => handleChange('enableCountdown', e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Displays a countdown box ("Orders reserved for next 15 mins") to reduce cart abandonment.
          </p>

          <div className="form-group">
            <label className="form-label">Countdown Duration (Minutes)</label>
            <input 
              type="number" 
              className="form-input"
              value={formData.countdownMinutes}
              onChange={(e) => handleChange('countdownMinutes', parseInt(e.target.value, 10))}
            />
            <div className="form-help">Resets per visitor session automatically</div>
          </div>
        </div>

        {/* 5. Theme & Appearance */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="card-title">
              <Palette size={18} style={{ color: '#8b5cf6' }} /> Widget Styling & Theme Modes
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Visual Theme Style</label>
              <select 
                className="form-select"
                value={formData.themeMode}
                onChange={(e) => handleChange('themeMode', e.target.value)}
              >
                <option value="glass">Frosted Glassmorphism (Modern & Sleek)</option>
                <option value="light">Crisp Clean Light</option>
                <option value="dark">Luxury Dark Mode</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Brand Primary Accent Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="color" 
                  value={formData.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  style={{ width: '44px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
