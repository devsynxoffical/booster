import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  TrendingUp, 
  BookOpen, 
  Zap, 
  Code, 
  Layers, 
  ExternalLink,
  Loader2
} from 'lucide-react';

export default function SeoEngineView({ isMerchantMode, activeStore }) {
  const currentShop = activeStore?.shopDomain || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('shop') || '' : '');
  const [keywords, setKeywords] = useState([]);
  const [articles, setArticles] = useState([]);
  const [nicheInput, setNicheInput] = useState('minimalist lifestyle & ergonomics');
  const [selectedKeyword, setSelectedKeyword] = useState('best noise cancelling earbuds under 100');
  const [productFocus, setProductFocus] = useState('Ergonomic Laptop Stand');
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [isFindingKeywords, setIsFindingKeywords] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeTab, setActiveTab] = useState('articles'); // 'articles' | 'keywords' | 'audit' | 'schema'
  const [selectedArticleModal, setSelectedArticleModal] = useState(null);

  useEffect(() => {
    const qs = currentShop ? `?shop=${encodeURIComponent(currentShop)}` : '';
    fetch(`/api/seo/keywords${qs}`)
      .then(r => r.json())
      .then(d => setKeywords(d))
      .catch(() => {});

    fetch(`/api/seo/articles${qs}`)
      .then(r => r.json())
      .then(d => setArticles(d))
      .catch(() => {});
  }, [currentShop]);

  const handleFindKeywords = async () => {
    setIsFindingKeywords(true);
    try {
      const qs = currentShop ? `?shop=${encodeURIComponent(currentShop)}` : '';
      const res = await fetch(`/api/seo/generate-keyword${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: nicheInput, productCategory: nicheInput, shop: currentShop })
      });
      const data = await res.json();
      if (data.keywords) setKeywords(data.keywords);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFindingKeywords(false);
    }
  };

  const handleGenerateArticle = async () => {
    setIsGeneratingArticle(true);
    try {
      const qs = currentShop ? `?shop=${encodeURIComponent(currentShop)}` : '';
      const res = await fetch(`/api/seo/generate-article${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetKeyword: selectedKeyword, productFocus, shop: currentShop })
      });
      const data = await res.json();
      if (data.article) {
        setArticles(prev => [data.article, ...prev]);
        setSelectedArticleModal(data.article);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const qs = currentShop ? `?shop=${encodeURIComponent(currentShop)}` : '';
      const res = await fetch(`/api/seo/audit${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: currentShop })
      });
      const data = await res.json();
      if (data.audit) {
        setAuditData(data.audit);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  const [isAutoPiloting, setIsAutoPiloting] = useState(false);
  const [autoPilotStatus, setAutoPilotStatus] = useState(null);

  const handleRunFullAutoCampaign = async () => {
    setIsAutoPiloting(true);
    setAutoPilotStatus('Scanning store catalog and niche search trends on Google...');
    try {
      const qs = currentShop ? `?shop=${encodeURIComponent(currentShop)}` : '';
      const kwRes = await fetch(`/api/seo/generate-keyword${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: nicheInput, shop: currentShop })
      });
      const kwData = await kwRes.json();
      const discoveredKw = kwData.keywords || [];
      if (discoveredKw.length > 0) setKeywords(discoveredKw);

      setAutoPilotStatus('Auto-writing & publishing high-ranking buyer guide to Shopify Blog...');
      const targetKw = discoveredKw[0]?.keyword || selectedKeyword;

      const artRes = await fetch(`/api/seo/generate-article${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetKeyword: targetKw, productFocus, shop: currentShop })
      });
      const artData = await artRes.json();
      if (artData.article) {
        setArticles(prev => [artData.article, ...prev]);
        setSelectedArticleModal(artData.article);
      }

      setAutoPilotStatus(`Campaign Complete! Auto-targeted "${targetKw}" with rich schema & blog guide.`);
      setTimeout(() => setAutoPilotStatus(null), 6000);
    } catch (e) {
      console.error(e);
      setAutoPilotStatus('Error executing autonomous campaign.');
    } finally {
      setIsAutoPiloting(false);
    }
  };

  return (
    <div>
      {/* View Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
          Programmatic SEO & Organic Traffic Engine
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Drive automated, recurring organic customers from Google without ad spend by auto-generating high-ranking articles, targeting buyer search terms, and deploying rich JSON-LD snippets.
        </p>
      </div>

      {/* Autonomous Organic Research & Execution Banner (Super Admin Only) */}
      {!isMerchantMode && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
          border: '1px solid #86efac',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '26px',
          boxShadow: '0 4px 15px -3px rgba(16, 185, 129, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  Autonomous SEO Extension Active
                </span>
                <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600 }}>
                  Google 5-Star Rich Snippet Schema • Live Telemetry • Niche Intelligence
                </span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                Full Auto-Pilot Organic Search & Research Engine
              </h3>
              <p style={{ fontSize: '13px', color: '#334155', maxWidth: '680px', lineHeight: 1.5 }}>
                Automatically crawls commercial buyer queries on Google for your niche, generates and publishes ranking buyer guides directly to your Shopify blog, and auto-injects 5-star Product Rich Snippets on your storefront.
              </p>
            </div>

            <button 
              className="btn btn-blue"
              onClick={handleRunFullAutoCampaign}
              disabled={isAutoPiloting}
              style={{
                padding: '12px 20px',
                fontSize: '13.5px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isAutoPiloting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Auto-Piloting Campaign...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> ⚡ Run 1-Click Organic Growth Campaign
                </>
              )}
            </button>
          </div>

          {autoPilotStatus && (
            <div style={{
              marginTop: '14px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #93c5fd',
              fontSize: '12.5px',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600
            }}>
              <Sparkles size={14} style={{ color: '#2563eb' }} />
              {autoPilotStatus}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <button 
          className={`btn ${activeTab === 'articles' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('articles')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <FileText size={16} /> Programmatic Blog Engine ({articles.length})
        </button>
        <button 
          className={`btn ${activeTab === 'keywords' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('keywords')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <Search size={16} /> AI Keyword Discovery ({keywords.length})
        </button>
        <button 
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('audit')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <CheckCircle size={16} /> Instant Catalog SEO Audit
        </button>
        <button 
          className={`btn ${activeTab === 'schema' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('schema')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <Code size={16} /> Rich Schema (JSON-LD)
        </button>
      </div>

      {/* TAB 1: ARTICLES */}
      {activeTab === 'articles' && (
        <div>
          {/* Generator Card */}
          <div className="card" style={{ marginBottom: '28px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <div className="card-header">
              <div className="card-title">
                <Sparkles size={18} style={{ color: '#10b981' }} /> 1-Click Programmatic Buyer-Guide Generator
              </div>
              <span className="badge badge-green">Shopify Blog API Connected</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Select a target keyword from your catalog and our AI writes a comprehensive 1,500+ word buyer guide that automatically answers search queries and seamlessly recommends your products.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label className="form-label">Target Google Search Keyword</label>
                <select 
                  className="form-select"
                  value={selectedKeyword}
                  onChange={(e) => setSelectedKeyword(e.target.value)}
                >
                  {keywords.map(k => (
                    <option key={k.id} value={k.keyword}>{k.keyword} ({k.volume.toLocaleString()} mo. searches)</option>
                  ))}
                  <option value="best minimalist everyday carry items">best minimalist everyday carry items (14,200 mo.)</option>
                  <option value="how to organize aesthetic desk setup">how to organize aesthetic desk setup (9,800 mo.)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Featured Store Product to Sell</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={productFocus}
                  onChange={(e) => setProductFocus(e.target.value)}
                  placeholder="e.g. Ergonomic Aluminium Laptop Stand"
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                ⚡ Auto-includes: H2/H3 structure, FAQ Schema (Google Rich Results), Internal product CTA, and Meta description.
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleGenerateArticle}
                disabled={isGeneratingArticle}
              >
                {isGeneratingArticle ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Generating & Publishing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Generate & Publish to Shopify Blog
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Published Articles List */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <BookOpen size={18} style={{ color: '#3b82f6' }} /> Published Organic Ranking Articles
              </div>
              <span className="badge badge-blue">{articles.length} Active Pages</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {articles.map((art) => (
                <div key={art.id} style={{
                  padding: '18px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-green">{art.status}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>Published on {art.publishedAt}</span>
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
                      {art.title}
                    </h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {art.summary}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                      <span style={{ color: '#34d399', fontWeight: '600' }}>
                        🎯 Keyword: "{art.targetKeyword}"
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        📈 Est. Monthly Traffic: ~{art.estimatedMonthlyTraffic.toLocaleString()} clicks
                      </span>
                    </div>
                  </div>

                  <button 
                    className="btn btn-outline"
                    onClick={() => setSelectedArticleModal(art)}
                    style={{ fontSize: '13px', whiteSpace: 'nowrap' }}
                  >
                    View Article Content <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KEYWORDS */}
      {activeTab === 'keywords' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Search size={18} style={{ color: '#10b981' }} /> AI Keyword Intent Discovery
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Uncovers high-volume search queries that active buyers enter on Google with low SEO competition.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input 
              type="text" 
              className="form-input" 
              value={nicheInput} 
              onChange={(e) => setNicheInput(e.target.value)}
              placeholder="Enter your store niche (e.g. coffee accessories, vegan skincare)"
              style={{ maxWidth: '450px' }}
            />
            <button 
              className="btn btn-primary"
              onClick={handleFindKeywords}
              disabled={isFindingKeywords}
            >
              {isFindingKeywords ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Discover Intent Keywords
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Target Search Query</th>
                  <th>Monthly Searches</th>
                  <th>Difficulty</th>
                  <th>Intent</th>
                  <th>Google Ranking Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map(k => (
                  <tr key={k.id}>
                    <td><strong>{k.keyword}</strong></td>
                    <td>{k.volume.toLocaleString()}</td>
                    <td>
                      <span style={{ 
                        color: k.difficulty < 20 ? '#34d399' : '#fbbf24', 
                        fontWeight: '700' 
                      }}>
                        {k.difficulty}/100 ({k.difficulty < 20 ? 'Easy' : 'Moderate'})
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-purple">{k.intent}</span>
                    </td>
                    <td>
                      <span className="badge badge-green">{k.status}</span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        onClick={() => {
                          setSelectedKeyword(k.keyword);
                          setActiveTab('articles');
                        }}
                      >
                        Target with Article
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT */}
      {activeTab === 'audit' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CheckCircle size={18} style={{ color: '#10b981' }} /> Storefront Catalog SEO Auditor
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleRunAudit}
              disabled={isAuditing}
            >
              {isAuditing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              Run Full Store Scan
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Scans product titles, meta descriptions, image ALT tags, structured JSON-LD schemas, and Core Web Vitals compliance.
          </p>

          {auditData ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '12px', color: '#34d399', fontWeight: '600' }}>Overall SEO Health Score</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: '4px 0' }}>{auditData.score}/100</div>
                  <div style={{ fontSize: '11px', color: '#34d399' }}>✓ Excellent Search Visibility</div>
                </div>

                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pages & Products Scanned</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '4px 0' }}>{auditData.totalPagesScanned}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>All collection & product pages</div>
                </div>

                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-Injected Schemas</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#60a5fa', margin: '4px 0' }}>{auditData.schemaCoverage}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>Google Rich Snippets verified</div>
                </div>

                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Image Alt-Tags Auto-Fixed</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#a78bfa', margin: '4px 0' }}>{auditData.imageAltTagsOptimized}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>Ready for Google Image search</div>
                </div>
              </div>

              <div style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Audit Insights & Applied Boosts</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {auditData.opportunities.map((opp, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>{opp.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
              <Sparkles size={36} style={{ color: '#10b981', marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', fontWeight: '600' }}>Click "Run Full Store Scan" to audit catalog SEO health.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SCHEMA */}
      {activeTab === 'schema' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Code size={18} style={{ color: '#8b5cf6' }} /> Automated Google Rich Results JSON-LD Schema
            </div>
            <span className="badge badge-green">Automatically Active on Storefront</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            This structured markup is automatically injected into every product page so Google displays ⭐⭐⭐⭐⭐ review stars, in-stock badges, price alerts, and FAQs directly in organic search results.
          </p>

          <pre style={{
            background: '#090d16',
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            fontSize: '12.5px',
            fontFamily: 'var(--font-mono)',
            color: '#34d399',
            overflowX: 'auto',
            lineHeight: 1.6
          }}>
{`{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Minimalist Leather Cardholder",
  "image": ["https://cdn.shopify.com/s/files/.../cardholder.jpg"],
  "description": "Handcrafted premium top-grain leather cardholder with RFID protection.",
  "brand": {
    "@type": "Brand",
    "name": "Modern Essentials"
  },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "42.00",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "127"
  }
}`}
          </pre>
        </div>
      )}

      {/* Modal for Article Preview */}
      {selectedArticleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span className="badge badge-green">Shopify Blog Article</span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                  {selectedArticleModal.title}
                </h3>
              </div>
              <button 
                className="btn btn-outline"
                style={{ padding: '6px 12px' }}
                onClick={() => setSelectedArticleModal(null)}
              >
                Close
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.7' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {selectedArticleModal.content || selectedArticleModal.summary}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
