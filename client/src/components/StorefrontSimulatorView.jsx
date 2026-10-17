import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Monitor, 
  ShoppingBag, 
  Check, 
  Flame, 
  Clock, 
  Truck, 
  Star, 
  ShieldCheck, 
  Sparkles,
  Plus,
  RefreshCw
} from 'lucide-react';

export default function StorefrontSimulatorView({ config }) {
  const [device, setDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [cartCount, setCartCount] = useState(1);
  const [cartTotal, setCartTotal] = useState(42.00);
  const [showPopup, setShowPopup] = useState(true);
  const [activePopupIndex, setActivePopupIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(config.countdownMinutes * 60 || 885);

  const samplePurchases = [
    { name: "Sophia M.", city: "New York, NY", product: "Wireless Noise-Cancelling Earbuds", time: "2 mins ago", img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=150&auto=format&fit=crop&q=80" },
    { name: "David K.", city: "Austin, TX", product: "Minimalist Leather Cardholder", time: "4 mins ago", img: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=150&auto=format&fit=crop&q=80" },
    { name: "Emma R.", city: "London, UK", product: "Ultra-Hydrating Botanical Serum", time: "6 mins ago", img: "https://images.unsplash.com/photo-1608248597359-548481358942?w=150&auto=format&fit=crop&q=80" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cycle = setInterval(() => {
      setShowPopup(false);
      setTimeout(() => {
        setActivePopupIndex(prev => (prev + 1) % samplePurchases.length);
        setShowPopup(true);
      }, 800);
    }, (config.popupDelay + config.popupDuration) * 1000 || 8000);
    return () => clearInterval(cycle);
  }, [config.popupDelay, config.popupDuration]);

  const handleAddToCart = () => {
    setCartCount(prev => prev + 1);
    setCartTotal(prev => prev + 42.00);
  };

  const currentPurchase = samplePurchases[activePopupIndex];
  const threshold = config.freeShippingThreshold || 50;
  const remainingForFreeShipping = Math.max(0, threshold - cartTotal);
  const shippingPercent = Math.min(100, Math.round((cartTotal / threshold) * 100));

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div>
      {/* Simulator Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
            Interactive Storefront Simulator
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Experience your live storefront exactly as real shoppers will see it with the conversion booster active.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
            <button
              className={`btn ${device === 'desktop' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 12px', fontSize: '12px', border: 'none' }}
              onClick={() => setDevice('desktop')}
            >
              <Monitor size={14} /> Desktop View
            </button>
            <button
              className={`btn ${device === 'mobile' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 12px', fontSize: '12px', border: 'none' }}
              onClick={() => setDevice('mobile')}
            >
              <Smartphone size={14} /> Mobile Phone View
            </button>
          </div>

          <button 
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => { setCartCount(1); setCartTotal(42.00); }}
          >
            <RefreshCw size={14} /> Reset Cart
          </button>
        </div>
      </div>

      {/* Simulator Device Frame */}
      <div style={{
        maxWidth: device === 'mobile' ? '400px' : '100%',
        margin: '0 auto',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div className="simulator-wrapper" style={{ minHeight: '640px' }}>
          {/* Simulated Browser Bar */}
          <div style={{
            background: '#f1f5f9',
            padding: '8px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11.5px',
            color: '#64748b'
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399' }}></div>
            </div>
            <div style={{
              flex: 1,
              background: '#fff',
              padding: '3px 12px',
              borderRadius: '6px',
              textAlign: 'center',
              fontWeight: '500',
              border: '1px solid #cbd5e1'
            }}>
              🔒 https://modern-essentials.myshopify.com/products/leather-cardholder
            </div>
          </div>

          {/* 1. Free Shipping Progress Bar Widget */}
          {config.enableFreeShipping && (
            <div style={{
              background: config.themeMode === 'dark' ? '#0f172a' : '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              padding: '8px 16px',
              textAlign: 'center',
              color: config.themeMode === 'dark' ? '#f8fafc' : '#1e293b'
            }}>
              <div style={{ fontSize: '12.5px', marginBottom: '5px' }}>
                {remainingForFreeShipping <= 0 ? (
                  <span>🎉 <strong>Congratulations!</strong> You have unlocked <strong>FREE Express Shipping</strong>!</span>
                ) : (
                  <span>🚚 Add <strong>${remainingForFreeShipping.toFixed(2)}</strong> more to get <strong>FREE Express Shipping</strong>!</span>
                )}
              </div>
              <div style={{ width: '100%', maxWidth: '400px', height: '6px', background: '#e2e8f0', borderRadius: '999px', margin: '0 auto', overflow: 'hidden' }}>
                <div style={{
                  width: `${shippingPercent}%`,
                  height: '100%',
                  background: config.accentColor || '#10b981',
                  transition: 'width 0.4s ease'
                }}></div>
              </div>
            </div>
          )}

          {/* Storefront Navigation Bar */}
          <div style={{
            padding: '14px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}>
            <div style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px', color: '#0f172a' }}>
              MODERN ESSENTIALS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#475569' }}>
              <span>Catalog</span>
              <span>Reviews</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', color: '#0f172a', fontWeight: '600' }}>
                <ShoppingBag size={18} />
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-10px',
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '700',
                  borderRadius: '999px',
                  padding: '1px 6px'
                }}>
                  {cartCount}
                </span>
              </div>
            </div>
          </div>

          {/* Product Page Layout */}
          <div style={{
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: device === 'mobile' ? '1fr' : '1fr 1.1fr',
            gap: '24px',
            background: '#ffffff'
          }}>
            {/* Product Image */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <img 
                src="https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80" 
                alt="Minimalist Leather Cardholder" 
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
              />
            </div>

            {/* Product Details & Booster Widgets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '12px' }}>
                <Star size={14} fill="#f59e0b" />
                <Star size={14} fill="#f59e0b" />
                <Star size={14} fill="#f59e0b" />
                <Star size={14} fill="#f59e0b" />
                <Star size={14} fill="#f59e0b" />
                <span style={{ color: '#64748b', marginLeft: '4px' }}>4.9 (127 verified reviews)</span>
              </div>

              <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
                Minimalist Slim Leather Cardholder (RFID Safe)
              </h1>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#10b981' }}>$42.00</span>
                <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through' }}>$58.00</span>
                <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>Save 28%</span>
              </div>

              {/* 2. Live Shopper Counter Widget */}
              {config.enableVisitorCounter && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  color: '#991b1b',
                  margin: '4px 0'
                }}>
                  <Flame size={16} style={{ color: '#dc2626' }} />
                  <span><strong>{config.minVisitors || 19} shoppers</strong> are viewing this item right now</span>
                  <span style={{ background: '#dc2626', color: '#fff', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '3px' }}>HIGH DEMAND</span>
                </div>
              )}

              {/* Add to Cart Button */}
              <button 
                onClick={handleAddToCart}
                style={{
                  background: config.accentColor || '#10b981',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  marginTop: '6px'
                }}
              >
                <ShoppingBag size={18} /> Add to Cart — Test Conversion
              </button>

              {/* 3. Urgency Countdown Timer Widget */}
              {config.enableCountdown && (
                <div style={{
                  background: '#fffbeb',
                  border: '1px dashed #fcd34d',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  textAlign: 'center',
                  marginTop: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#b45309' }}>
                    <Clock size={14} /> Flash Offer Ending Soon
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#d97706', letterSpacing: '1px', margin: '2px 0' }}>
                    {formatTime(secondsRemaining)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#78350f' }}>
                    Items reserved in cart for limited time
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={14} color="#10b981" /> 30-Day Guarantee</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={14} color="#3b82f6" /> Fast Global Dispatch</span>
              </div>
            </div>
          </div>

          {/* 4. Social Proof Recent Sales Popup (Simulated Storefront Embed) */}
          {config.enablePopups && showPopup && currentPurchase && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: config.popupPosition?.includes('right') ? 'auto' : '20px',
              right: config.popupPosition?.includes('right') ? '20px' : 'auto',
              background: config.themeMode === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '320px',
              zIndex: 9999,
              animation: 'boosterSlide 0.3s ease-out',
              color: config.themeMode === 'dark' ? '#f8fafc' : '#111827'
            }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                <img src={currentPurchase.img} alt={currentPurchase.product} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '8px',
                  fontWeight: '800',
                  borderRadius: '50%',
                  width: '12px',
                  height: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #fff'
                }}>✓</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', lineHeight: 1.2 }}>
                  {currentPurchase.name} from {currentPurchase.city}
                </div>
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Purchased {currentPurchase.product}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span>{currentPurchase.time}</span>
                  <span style={{ color: '#059669', fontWeight: '600' }}>• Verified Buyer</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
