import React, { useState } from 'react';
import { 
  Store, 
  Key, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  X,
  Trash2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

export default function ShopifyConnectModal({ isOpen, onClose, connectionStatus, onConnectionSuccess }) {
  const [shopDomain, setShopDomain] = useState(connectionStatus?.shopDomain || '');
  const [accessToken, setAccessToken] = useState('');
  const [publicAppUrl, setPublicAppUrl] = useState(connectionStatus?.publicAppUrl || window.location.origin);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  if (!isOpen) return null;

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!shopDomain || !accessToken) {
      setStatusMsg({ type: 'error', text: 'Please enter both your Shopify store domain and Admin API Access Token.' });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/shopify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopDomain, accessToken, publicAppUrl })
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg({
          type: 'success',
          text: `Connected to ${data.store?.name || shopDomain}! Synchronized ${data.productsCount} products and ${data.ordersCount} recent orders.`
        });
        onConnectionSuccess();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Connection failed. Please check your credentials.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error communicating with the server.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect this store?')) return;
    setIsLoading(true);
    try {
      await fetch('/api/shopify/disconnect', { method: 'POST' });
      setStatusMsg({ type: 'info', text: 'Store disconnected.' });
      onConnectionSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetStats = async () => {
    if (!window.confirm('Reset all live visit and analytics counts to 0?')) return;
    try {
      await fetch('/api/shopify/reset-stats', { method: 'POST' });
      setStatusMsg({ type: 'success', text: 'All analytics metrics reset to fresh live start (0).' });
      onConnectionSuccess();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Connect Live Shopify Store
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Sync live products, real orders, and publish real SEO articles
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {statusMsg && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              marginBottom: '18px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: statusMsg.type === 'success' ? '#ecfdf5' : statusMsg.type === 'error' ? '#fef2f2' : '#eff6ff',
              color: statusMsg.type === 'success' ? '#065f46' : statusMsg.type === 'error' ? '#991b1b' : '#1e40af',
              border: `1px solid ${statusMsg.type === 'success' ? '#a7f3d0' : statusMsg.type === 'error' ? '#fecaca' : '#bfdbfe'}`
            }}>
              {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleConnect}>
            <div className="form-group">
              <label className="form-label">
                Shopify Store Domain (.myshopify.com)
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. your-brand.myshopify.com"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                required
              />
              <div className="form-help">Enter your exact myshopify domain name</div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Shopify Admin API Access Token
              </label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                required
              />
              <div className="form-help">
                Generated in <strong>Shopify Admin &gt; Settings &gt; Apps and sales channels &gt; Develop apps</strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Public App Host URL
              </label>
              <input 
                type="url" 
                className="form-input" 
                value={publicAppUrl}
                onChange={(e) => setPublicAppUrl(e.target.value)}
                placeholder="http://localhost:3005 or https://your-domain.com"
              />
              <div className="form-help">Used by your Shopify storefront theme to communicate with the booster</div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#475569'
            }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Required API Scopes in Shopify:
              </div>
              <code>read_products, write_products, read_content, write_content, read_orders</code>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
              {connectionStatus?.isConnected && (
                <>
                  <button 
                    type="button" 
                    className="btn btn-white"
                    onClick={handleResetStats}
                    style={{ fontSize: '12.5px', color: '#d97706' }}
                  >
                    <RefreshCw size={14} /> Reset Stats (0)
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-white"
                    onClick={handleDisconnect}
                    style={{ fontSize: '12.5px', color: '#dc2626' }}
                  >
                    <Trash2 size={14} /> Disconnect
                  </button>
                </>
              )}
              <button 
                type="submit" 
                className="btn btn-blue"
                disabled={isLoading}
                style={{ minWidth: '140px' }}
              >
                {isLoading ? <><Loader2 size={15} className="animate-spin" /> Verifying...</> : <><ShieldCheck size={16} /> Connect Store</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
