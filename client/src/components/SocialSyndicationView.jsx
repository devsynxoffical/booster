import React, { useState } from 'react';
import { 
  Share2, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Play, 
  Image, 
  Hash, 
  TrendingUp,
  Loader2
} from 'lucide-react';

export default function SocialSyndicationView({ activeStore }) {
  const currentShop = activeStore?.shopDomain || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('shop') || '' : '');
  const storeProducts = activeStore?.realProducts || [];
  const defaultProduct = storeProducts.length > 0 ? storeProducts[0].title : 'Organic Night Repair Face Cream';

  const [productName, setProductName] = useState(defaultProduct);
  const [platform, setPlatform] = useState('Pinterest');
  const [syndicationResult, setSyndicationResult] = useState({
    pinTitle: `Aesthetic Must-Haves: ${defaultProduct}`,
    pinDescription: `Upgrade your daily focus with ${defaultProduct}. Formulated with verified premium quality, fast tracked delivery, and 5-star buyer ratings. Tap to shop with free shipping!`,
    board: 'Modern Aesthetic & Daily Essentials',
    tags: ['#aestheticfinds', '#shopifymusthaves', '#curatedessentials', '#viralproducts']
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync default product when activeStore changes
  React.useEffect(() => {
    if (storeProducts.length > 0 && !storeProducts.some(p => p.title === productName)) {
      setProductName(storeProducts[0].title);
    }
  }, [activeStore]);

  const handleGenerate = async (targetPlatform = platform) => {
    setIsGenerating(true);
    setPlatform(targetPlatform);
    try {
      const res = await fetch('/api/social/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platform: targetPlatform, 
          productName,
          shop: currentShop
        })
      });
      const data = await res.json();
      if (data.syndication) {
        setSyndicationResult(data.syndication);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
          Viral Organic Social Syndication
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Drive organic buyers from visual search engines (Pinterest, TikTok, Instagram) by turning your product catalog into viral hook scripts and rich pin posts.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Generator Controls */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={18} style={{ color: '#8b5cf6' }} /> Catalog Hook & Post Generator
            </div>
            <span className="badge badge-purple">AI Driven</span>
          </div>

          <div className="form-group">
            <label className="form-label">Store Product to Promote</label>
            {storeProducts.length > 0 ? (
              <select 
                className="form-select"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              >
                {storeProducts.map(p => (
                  <option key={p.id} value={p.title}>{p.title}</option>
                ))}
              </select>
            ) : (
              <input 
                type="text"
                className="form-input"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Organic Night Repair Face Cream"
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Target Social Traffic Channel</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {['Pinterest', 'TikTok', 'Instagram'].map(p => (
                <button
                  key={p}
                  type="button"
                  className={`btn ${platform === p ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '12.5px', padding: '8px' }}
                  onClick={() => handleGenerate(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button 
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={() => handleGenerate(platform)}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
            Generate {platform} Organic Campaign
          </button>
        </div>

        {/* Generated Post Preview */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Share2 size={18} style={{ color: '#10b981' }} /> {platform} Ready-to-Post Asset
            </div>
            <button 
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={() => handleCopy(JSON.stringify(syndicationResult, null, 2))}
            >
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Content</>}
            </button>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            padding: '18px',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {platform === 'Pinterest' && (
              <>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Pin Title</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>{syndicationResult.pinTitle}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Pin Description</div>
                  <div style={{ color: '#d1d5db', marginTop: '2px', lineHeight: 1.5 }}>{syndicationResult.pinDescription}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Recommended Board</div>
                  <div style={{ color: '#60a5fa', fontWeight: '600' }}>📌 {syndicationResult.board}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {syndicationResult.tags?.map(t => (
                    <span key={t} className="badge badge-purple">{t}</span>
                  ))}
                </div>
              </>
            )}

            {platform === 'TikTok' && (
              <>
                <div>
                  <div style={{ fontSize: '11px', color: '#f43f5e', textTransform: 'uppercase', fontWeight: '700' }}>First 3-Second Viral Hook</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>"{syndicationResult.hook}"</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Caption & Tags</div>
                  <div style={{ color: '#d1d5db', marginTop: '2px' }}>{syndicationResult.caption}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Sound & Vibe</div>
                  <div style={{ color: '#34d399' }}>🎵 {syndicationResult.soundRecommendation}</div>
                </div>
              </>
            )}

            {platform === 'Instagram' && (
              <>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Reel / Carousel Caption</div>
                  <div style={{ color: '#d1d5db', marginTop: '2px', lineHeight: 1.6 }}>{syndicationResult.caption}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>High-Reach Hashtags</div>
                  <div style={{ color: '#a78bfa', fontWeight: '600' }}>{syndicationResult.hashtags}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
