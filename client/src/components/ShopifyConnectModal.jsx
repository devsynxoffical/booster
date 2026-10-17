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
  ArrowRight,
  Key,
  Save,
  Settings
} from 'lucide-react';

export default function ShopifyConnectModal({ isOpen, onClose, onStoreChanged }) {
  const [storesData, setStoresData] = useState({ activeStoreId: null, stores: [], appConfig: {} });
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'manual' | 'oauth' | 'keys'
  const [storeNameInput, setStoreNameInput] = useState('');
  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [oauthShopInput, setOauthShopInput] = useState('chandkali.myshopify.com');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // App Master Credentials State (Editable directly in UI!)
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [publicUrlInput, setPublicUrlInput] = useState('');

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      setStoresData(data);
      if (data.appConfig) {
        setClientIdInput(data.appConfig.clientId || 'bc4244d5d21d40ac26fb7e0154a47d35');
        setClientSecretInput(data.appConfig.clientSecret || '');
        setPublicUrlInput(data.appConfig.publicAppUrl || window.location.origin);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStores();
      setStatusMsg(null);
      setActiveTab('manage');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Save Master App Keys from UI
  const handleSaveAppConfig = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/stores/app-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientIdInput,
          clientSecret: clientSecretInput,
          publicAppUrl: publicUrlInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: 'App Client ID and Secret saved successfully in the database!' });
        fetchStores();
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to save app keys.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network connection error.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate 1-Click OAuth Install Link
  const handleGenerateOAuth = (e) => {
    e.preventDefault();
    if (!oauthShopInput) return;
    const clean = oauthShopInput.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const publicUrl = publicUrlInput || storesData.appConfig?.publicAppUrl || window.location.origin;
    const link = `${publicUrl}/auth?shop=${encodeURIComponent(clean)}`;
    setGeneratedLink(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Direct manual connect or quick-add for any store
  const handleManualConnect = async (e) => {
    e.preventDefault();
    if (!shopDomain) {
      setStatusMsg({ type: 'error', text: 'Please enter the Shopify store domain.' });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/stores/connect-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shopDomain, 
          storeName: storeNameInput,
          accessToken: accessToken ? accessToken.trim() : '' 
        })
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg({ type: 'success', text: data.message || `Store "${data.store.storeName}" connected successfully!` });
        setShopDomain('');
        setStoreNameInput('');
        setAccessToken('');
        fetchStores();
        onStoreChanged();
        setActiveTab('manage'); // Show in connected stores list!
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
      onClose(); // Automatically close modal and load dashboard for that store!
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete store
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
        maxWidth: '700px',
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
                Multi-Store Management Panel
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Manage all your customer Shopify stores without touching configuration files
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
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 24px', overflowX: 'auto' }}>
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
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            🏬 Switch Store ({storesData.stores?.length || 0})
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
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            ➕ Add Store
          </button>

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
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            ⚡ 1-Click Install Link
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'keys' ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === 'keys' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'keys' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            ⚙️ App Keys
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
                  Connect Any Store in 1-Click
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Enter your customer's store domain. Click the link to authorize and connect their store immediately.
                </p>
              </div>

              <form onSubmit={handleGenerateOAuth} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. chandkali.myshopify.com"
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
                    Your 1-Click Install Link:
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

          {/* TAB: Add Store */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualConnect}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                  Add a New Shopify Store
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Connect any customer store in seconds. Once added, you can switch to it anytime and monitor its live visitors and conversion popups.
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 600 }}>Store Brand Name (Display Name)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. USA Beauty Store, Fashion Brand, etc."
                  value={storeNameInput}
                  onChange={(e) => setStoreNameInput(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 600 }}>Shopify Store Domain (.myshopify.com) *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. storename.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 600 }}>Admin API Access Token (Optional)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx (Optional)"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Leave blank to connect via 1-line script tag immediately, or enter token to sync real store products & orders.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="submit" className="btn btn-blue" disabled={isLoading} style={{ minWidth: '160px' }}>
                  {isLoading ? <><Loader2 size={15} className="animate-spin" /> Adding Store...</> : <><Plus size={15} /> Add Store</>}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Connected Stores List */}
          {activeTab === 'manage' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                  Connected Customer Stores ({storesData.stores?.length || 0})
                </h4>
                <p style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Click "Switch to this Store" to view and manage its analytics, widgets, and SEO.
                </p>
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
                    Use the 1-Click Install Link or Token tab to connect your first store.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: In-App Master App Keys (No .env needed!) */}
          {activeTab === 'keys' && (
            <form onSubmit={handleSaveAppConfig}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                  Shopify App Keys (Configured In-App)
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  You do not need to edit .env or restart Render. Paste your Shopify App credentials here to save them directly in the database.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Client ID (API Key)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="bc4244d5d21d40ac26fb7e0154a47d35"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Client Secret (API Secret)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  placeholder="shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Public Server Host URL</label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={publicUrlInput}
                  onChange={(e) => setPublicUrlInput(e.target.value)}
                  placeholder="https://booster-5imz.onrender.com"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button type="submit" className="btn btn-blue" disabled={isLoading} style={{ minWidth: '160px' }}>
                  {isLoading ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> Save Keys to Database</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
