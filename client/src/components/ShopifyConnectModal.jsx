import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Copy,
  Check,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ShopifyConnectModal({ isOpen, onClose, onStoreChanged }) {
  const [storesData, setStoresData] = useState({ activeStoreId: null, stores: [], appConfig: {} });
  const [activeTab, setActiveTab] = useState('oauth'); // 'oauth' | 'manual' | 'manage'
  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [oauthShopInput, setOauthShopInput] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      setStoresData(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStores();
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate 1-Click OAuth Install Link
  const handleGenerateOAuth = (e) => {
    e.preventDefault();
    if (!oauthShopInput) return;
    const clean = oauthShopInput.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const publicUrl = storesData.appConfig?.publicAppUrl || window.location.origin;
    const link = `${publicUrl}/auth?shop=${encodeURIComponent(clean)}`;
    setGeneratedLink(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Direct manual connect via Admin API token
  const handleManualConnect = async (e) => {
    e.preventDefault();
    if (!shopDomain || !accessToken) {
      setStatusMsg({ type: 'error', text: 'Please enter both shop domain and access token.' });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/stores/connect-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopDomain, accessToken })
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg({ type: 'success', text: `Store "${data.store.storeName}" connected successfully!` });
        setShopDomain('');
        setAccessToken('');
        fetchStores();
        onStoreChanged();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to connect store.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network connection error.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Switch active store
  const handleSwitchStore = async (storeId) => {
    setIsLoading(true);
    try {
      await fetch('/api/stores/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId })
      });
      fetchStores();
      onStoreChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete / Disconnect store
  const handleDeleteStore = async (storeId, storeName) => {
    if (!window.confirm(`Disconnect and remove ${storeName}?`)) return;
    try {
      await fetch(`/api/stores/${storeId}`, { method: 'DELETE' });
      fetchStores();
      onStoreChanged();
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
        maxWidth: '680px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Multi-Store Manager
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Connect and manage multiple Shopify stores from a single unified admin
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

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 24px' }}>
          <button
            onClick={() => setActiveTab('oauth')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'oauth' ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === 'oauth' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'oauth' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            ⚡ 1-Click Install Link
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'manual' ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === 'manual' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'manual' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            🔑 Admin API Token
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'manage' ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === 'manage' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'manage' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            🏬 Connected Stores ({storesData.stores?.length || 0})
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {statusMsg && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              marginBottom: '18px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: statusMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: statusMsg.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${statusMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`
            }}>
              {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: 1-Click OAuth Link */}
          {activeTab === 'oauth' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                  Generate 1-Click Shopify App Install Link
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Enter any Shopify store domain. Click the link (or send it to the store owner) to authorize and automatically connect the store into your booster!
                </p>
              </div>

              <form onSubmit={handleGenerateOAuth} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. chandkali.myshopify.com or brand.myshopify.com"
                    value={oauthShopInput}
                    onChange={(e) => setOauthShopInput(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-blue" style={{ whiteSpace: 'nowrap' }}>
                    Generate Link
                  </button>
                </div>
              </form>

              {generatedLink && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                    Your 1-Click OAuth Install Link:
                  </div>
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    wordBreak: 'break-all',
                    color: '#2563eb'
                  }}>
                    {generatedLink}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button 
                      type="button" 
                      className="btn btn-white" 
                      onClick={handleCopyLink}
                      style={{ fontSize: '12px', flex: 1 }}
                    >
                      {copied ? <><Check size={14} color="#10b981" /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                    </button>
                    <a 
                      href={generatedLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn btn-blue"
                      style={{ fontSize: '12px', flex: 1, textDecoration: 'none' }}
                    >
                      Open & Install Now <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Direct Admin API Token */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualConnect}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                  Direct Admin Access Token Connect
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Connect any store immediately using its Shopify Admin API Token (from Develop apps).
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Shopify Store Domain (.myshopify.com)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. chandkali.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admin API Access Token (shpat_...)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button type="submit" className="btn btn-blue" disabled={isLoading} style={{ minWidth: '160px' }}>
                  {isLoading ? <><Loader2 size={15} className="animate-spin" /> Verifying...</> : <><Plus size={15} /> Add Store</>}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Connected Stores List */}
          {activeTab === 'manage' && (
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                    Connected Stores ({storesData.stores?.length || 0})
                  </h4>
                  <p style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Click "Switch to this Store" to manage its specific dashboard, widgets & SEO.
                  </p>
                </div>
              </div>

              {storesData.stores && storesData.stores.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {storesData.stores.map(store => (
                    <div key={store.id} style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: store.isActive ? '#eff6ff' : '#f8fafc',
                      border: store.isActive ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                            {store.storeName}
                          </span>
                          {store.isActive && (
                            <span className="badge badge-blue">Active Store</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {store.shopDomain} • {store.productsCount} products • {store.ordersCount} orders
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!store.isActive && (
                          <button 
                            className="btn btn-white" 
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                            onClick={() => handleSwitchStore(store.id)}
                          >
                            Switch to this Store
                          </button>
                        )}
                        <button 
                          className="btn btn-white"
                          style={{ fontSize: '12px', padding: '6px 10px', color: '#dc2626' }}
                          onClick={() => handleDeleteStore(store.id, store.storeName)}
                          title="Disconnect Store"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
                  <Store size={36} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>No stores connected yet.</p>
                  <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                    Use the 1-Click Install Link or Admin API Token tab to add your first store.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
