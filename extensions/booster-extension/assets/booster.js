/**
 * Shopify Growth Booster - Storefront High-Performance Script
 * Handles:
 * - Real-time Recent Sales Popups (Social Proof)
 * - Dynamic Live Shopper Scarcity Badge
 * - Dynamic Free Shipping Progress Bar
 * - Urgency Countdown Timer
 * - Organic Search Traffic Attribution
 */
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.__ShopifyGrowthBoosterInitialized) return;
  window.__ShopifyGrowthBoosterInitialized = true;

  const rootEl = document.getElementById('shopify-growth-booster-root');
  const appEndpoint = rootEl?.dataset.appUrl || 'https://booster-5imz.onrender.com';

  // Automatically inject booster.css into customer theme head (Zero code required!)
  if (!document.getElementById('shopify-booster-live-css')) {
    const link = document.createElement('link');
    link.id = 'shopify-booster-live-css';
    link.rel = 'stylesheet';
    link.href = `${appEndpoint}/extensions/assets/booster.css`;
    document.head.appendChild(link);
  }

  const config = {
    appUrl: appEndpoint,
    enablePopups: rootEl ? rootEl.dataset.enablePopups === 'true' : true,
    popupPosition: rootEl?.dataset.popupPosition || 'bottom-left',
    popupDelay: parseInt(rootEl?.dataset.popupDelay || '6', 10) * 1000,
    popupDuration: parseInt(rootEl?.dataset.popupDuration || '5', 10) * 1000,
    enableVisitorCounter: rootEl ? rootEl.dataset.enableVisitorCounter === 'true' : true,
    minVisitors: parseInt(rootEl?.dataset.minVisitors || '12', 10),
    maxVisitors: parseInt(rootEl?.dataset.maxVisitors || '38', 10),
    enableFreeShipping: rootEl ? rootEl.dataset.enableFreeShipping === 'true' : true,
    freeShippingThreshold: parseFloat(rootEl?.dataset.freeShippingThreshold || '50'),
    currencySymbol: rootEl?.dataset.shippingCurrency || '$',
    cartTotal: parseFloat(rootEl?.dataset.cartTotal || '0'),
    enableCountdown: rootEl ? rootEl.dataset.enableCountdown === 'true' : true,
    countdownMinutes: parseInt(rootEl?.dataset.countdownMinutes || '15', 10),
    enableSeoSchema: rootEl ? rootEl.dataset.enableSeoSchema !== 'false' : true,
    accentColor: rootEl?.dataset.accentColor || '#2563eb',
    themeMode: rootEl?.dataset.themeMode || 'light'
  };

  // Detect current shop domain accurately from Shopify global, script tag, or hostname
  const detectedShop = (window.Shopify && window.Shopify.shop) 
    ? window.Shopify.shop 
    : window.location.hostname.replace(/^www\./, '');

  let livePurchases = [];

  // Fetch real store orders or real products from the backend API
  if (config.appUrl) {
    try {
      fetch(`${config.appUrl}/api/public/recent-orders?shop=${encodeURIComponent(detectedShop)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            livePurchases = data;
          }
        })
        .catch(() => {});

      // Fetch dynamic store configuration to support 1-line script embed
      fetch(`${config.appUrl}/api/config?shop=${encodeURIComponent(detectedShop)}`)
        .then(res => res.json())
        .then(cfg => {
          if (cfg && typeof cfg === 'object') {
            if (cfg.enablePopups !== undefined) config.enablePopups = cfg.enablePopups;
            if (cfg.popupPosition) config.popupPosition = cfg.popupPosition;
            if (cfg.popupDelay) config.popupDelay = parseInt(cfg.popupDelay, 10) * 1000;
            if (cfg.popupDuration) config.popupDuration = parseInt(cfg.popupDuration, 10) * 1000;
            if (cfg.enableVisitorCounter !== undefined) config.enableVisitorCounter = cfg.enableVisitorCounter;
            if (cfg.minVisitors) config.minVisitors = parseInt(cfg.minVisitors, 10);
            if (cfg.maxVisitors) config.maxVisitors = parseInt(cfg.maxVisitors, 10);
            if (cfg.enableFreeShipping !== undefined) config.enableFreeShipping = cfg.enableFreeShipping;
            if (cfg.freeShippingThreshold) config.freeShippingThreshold = parseFloat(cfg.freeShippingThreshold);
            if (cfg.shippingCurrency) config.currencySymbol = cfg.shippingCurrency;
            if (cfg.enableCountdown !== undefined) config.enableCountdown = cfg.enableCountdown;
            if (cfg.countdownMinutes) config.countdownMinutes = parseInt(cfg.countdownMinutes, 10);
            if (cfg.accentColor) config.accentColor = cfg.accentColor;
            if (cfg.themeMode) config.themeMode = cfg.themeMode;
          }
        })
        .catch(() => {});
    } catch (e) {}
  }

  /* -------------------------------------------------------------
   * 1. Track Organic Referral & Real-Time Page Impressions
   * ------------------------------------------------------------- */
  let lastRecordedUrl = '';
  function recordTrafficAttribution(customUrl, eventType) {
    const targetUrl = customUrl || window.location.href;
    if (lastRecordedUrl === targetUrl && eventType === 'visit') return;
    lastRecordedUrl = targetUrl;

    const referrer = document.referrer;
    const isOrganic = referrer && (
      referrer.includes('google.') ||
      referrer.includes('bing.') ||
      referrer.includes('pinterest.') ||
      referrer.includes('tiktok.') ||
      referrer.includes('instagram.') ||
      referrer.includes('duckduckgo.')
    );

    if (config.appUrl) {
      try {
        const payload = JSON.stringify({
          shop: detectedShop,
          type: eventType || (isOrganic ? 'organic_visit' : 'visit'),
          referrer: referrer || 'direct',
          url: targetUrl,
          country: 'US',
          timestamp: new Date().toISOString()
        });

        fetch(`${config.appUrl}/api/public/record-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          mode: 'cors',
          credentials: 'omit',
          keepalive: true
        }).catch(() => {});
      } catch (e) {}
    }
  }

  // Live Navigation & Route Listener (Tracks Shopify AJAX/SPA page transitions in real time)
  function initLiveRouteTracking() {
    window.addEventListener('popstate', () => {
      recordTrafficAttribution(window.location.href, 'page_view');
    });

    const origPush = history.pushState;
    if (origPush) {
      history.pushState = function() {
        origPush.apply(this, arguments);
        recordTrafficAttribution(window.location.href, 'page_view');
      };
    }

    const origReplace = history.replaceState;
    if (origReplace) {
      history.replaceState = function() {
        origReplace.apply(this, arguments);
        recordTrafficAttribution(window.location.href, 'page_view');
      };
    }

    // Active shopper heartbeat (Keeps live view updated while shopper is actively browsing)
    setInterval(() => {
      if (!document.hidden) {
        recordTrafficAttribution(window.location.href, 'heartbeat');
      }
    }, 15000);
  }

  /* -------------------------------------------------------------
   * 2. Social Proof Recent Sales Popup
   * ------------------------------------------------------------- */
  function initRecentSalesPopup() {
    if (!config.enablePopups) return;

    let popupContainer = document.createElement('div');
    popupContainer.id = 'booster-popup-container';
    popupContainer.className = `booster-pos-${config.popupPosition} booster-theme-${config.themeMode}`;
    document.body.appendChild(popupContainer);

    let currentIndex = 0;
    let isHovered = false;
    let timerId = null;

    function showNextNotification() {
      if (isHovered) return;
      const list = livePurchases.length > 0 ? livePurchases : [];
      if (list.length === 0) return; // Do not show dummy fake purchases if store has no data

      const item = list[currentIndex];
      currentIndex = (currentIndex + 1) % list.length;

      popupContainer.innerHTML = `
        <div class="booster-popup-card" id="booster-active-card">
          <button class="booster-close-btn" aria-label="Close notification">&times;</button>
          <div class="booster-thumb-wrap">
            <img src="${item.img}" alt="${item.product}" class="booster-thumb" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150&auto=format&fit=crop&q=80';this.onerror=null;" />
            <span class="booster-verified-dot" title="Verified Buyer">✓</span>
          </div>
          <div class="booster-content">
            <p class="booster-buyer-info">
              <strong>${item.name}</strong> from ${item.city}
            </p>
            <p class="booster-product-name">Purchased <span>${item.product}</span></p>
            <div class="booster-meta">
              <span class="booster-time">${item.time}</span>
              <span class="booster-badge"><span class="booster-pulse-dot"></span> Verified Order</span>
            </div>
          </div>
        </div>
      `;

      const card = document.getElementById('booster-active-card');
      const closeBtn = card.querySelector('.booster-close-btn');

      // Record popup impression
      try {
        fetch(`${config.appUrl}/api/public/record-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop: detectedShop,
            type: 'popup_impression',
            referrer: 'storefront_popup',
            url: window.location.href,
            timestamp: new Date().toISOString()
          })
        }).catch(() => {});
      } catch (e) {}

      card.addEventListener('mouseenter', () => { isHovered = true; });
      card.addEventListener('mouseleave', () => { 
        isHovered = false; 
        setTimeout(() => {
          if (!isHovered && card) {
            card.classList.remove('booster-show');
            card.classList.add('booster-hide');
          }
        }, 2000);
      });

      card.addEventListener('click', () => {
        try {
          fetch(`${config.appUrl}/api/public/record-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shop: detectedShop,
              type: 'popup_click',
              referrer: 'storefront_popup',
              url: window.location.href,
              timestamp: new Date().toISOString()
            })
          }).catch(() => {});
        } catch (e) {}
      });

      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.remove('booster-show');
        card.classList.add('booster-hide');
      });

      // Show animation
      requestAnimationFrame(() => {
        card.classList.add('booster-show');
      });

      // Auto dismiss after duration
      setTimeout(() => {
        if (!isHovered && card) {
          card.classList.remove('booster-show');
          card.classList.add('booster-hide');
        }
      }, config.popupDuration);
    }

    // Schedule regular cycle
    setTimeout(() => {
      showNextNotification();
      timerId = setInterval(showNextNotification, config.popupDelay + config.popupDuration);
    }, 2500);
  }

  /* -------------------------------------------------------------
   * 3. Dynamic Free Shipping Progress Bar
   * ------------------------------------------------------------- */
  function initFreeShippingBar() {
    if (!config.enableFreeShipping) return;

    let barEl = document.getElementById('booster-shipping-bar');
    if (!barEl) {
      barEl = document.createElement('div');
      barEl.id = 'booster-shipping-bar';
      barEl.className = `booster-shipping-bar booster-theme-${config.themeMode}`;
      document.body.prepend(barEl);
    }

    function updateBar(currentAmount) {
      const remaining = Math.max(0, config.freeShippingThreshold - currentAmount);
      const percentage = Math.min(100, Math.round((currentAmount / config.freeShippingThreshold) * 100));

      let messageHtml = '';
      if (remaining <= 0) {
        messageHtml = `🎉 <strong>Congratulations!</strong> You've unlocked <strong>FREE Express Shipping</strong>!`;
      } else {
        messageHtml = `🚚 Add <strong>${config.currencySymbol}${remaining.toFixed(2)}</strong> more to get <strong>FREE Express Shipping</strong>!`;
      }

      barEl.innerHTML = `
        <div class="booster-shipping-inner">
          <div class="booster-shipping-msg">${messageHtml}</div>
          <div class="booster-progress-track">
            <div class="booster-progress-fill" style="width: ${percentage}%; background-color: ${config.accentColor};"></div>
          </div>
        </div>
      `;
    }

    // Initial render with cart total & refresh immediately from Shopify Ajax API
    updateBar(config.cartTotal);
    refreshCart();

    // Refresh cart dynamically on standard Shopify events
    function refreshCart() {
      fetch('/cart.js')
        .then(res => res.json())
        .then(cart => {
          const totalInUnits = (cart.total_price || 0) / 100.0;
          updateBar(totalInUnits);
        })
        .catch(() => {});
    }

    // Listen to standard Shopify fetch/cart mutations
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0] && typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
      const responsePromise = originalFetch.apply(this, args);
      if (url && (url.includes('/cart/add') || url.includes('/cart/change') || url.includes('/cart/update') || url.includes('/cart/clear'))) {
        responsePromise.then(() => {
          setTimeout(refreshCart, 400);
        });
      }
      return responsePromise;
    };

    document.addEventListener('cart:updated', refreshCart);
  }

  /* -------------------------------------------------------------
   * 4. Live Shopper Counter & Scarcity Badge (Product Page)
   * ------------------------------------------------------------- */
  function initVisitorCounter() {
    if (!config.enableVisitorCounter) return;

    // Check if add-to-cart button or product form exists
    const targetEl = document.querySelector('button[name="add"]')
      || document.querySelector('.product-form__submit')
      || document.querySelector('[data-add-to-cart]')
      || document.querySelector('form[action*="/cart/add"]') 
      || document.querySelector('.product-form') 
      || document.querySelector('[data-product-form]');
    if (!targetEl) return;

    // Generate stable pseudo-random viewer count
    const min = config.minVisitors;
    const max = config.maxVisitors;
    let count = Math.floor(Math.random() * (max - min + 1)) + min;

    const counterEl = document.createElement('div');
    counterEl.className = `booster-live-viewers booster-theme-${config.themeMode}`;
    counterEl.innerHTML = `
      <span class="booster-fire-icon">🔥</span>
      <span class="booster-viewer-text">
        <strong id="booster-viewer-num">${count}</strong> people are looking at this right now.
      </span>
      <span class="booster-scarcity-tag">High Demand</span>
    `;

    // Insert adjacent to add to cart button
    if (targetEl.tagName === 'BUTTON' || targetEl.classList.contains('product-form__submit')) {
      targetEl.parentNode.insertBefore(counterEl, targetEl);
    } else {
      targetEl.parentNode.insertBefore(counterEl, targetEl);
    }

    // Subtly fluctuate viewers every 12-18 seconds to look natural
    setInterval(() => {
      const delta = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3 + 1);
      count = Math.max(min, Math.min(max, count + delta));
      const numSpan = document.getElementById('booster-viewer-num');
      if (numSpan) numSpan.textContent = count;
    }, 14000);
  }

  /* -------------------------------------------------------------
   * 5. Urgency Countdown Timer (Flash Sale / Cart Timer)
   * ------------------------------------------------------------- */
  function initCountdownTimer() {
    if (!config.enableCountdown) return;

    const productForm = document.querySelector('form[action*="/cart/add"]');
    if (!productForm) return;

    const timerEl = document.createElement('div');
    timerEl.className = `booster-countdown-box booster-theme-${config.themeMode}`;
    
    let totalSeconds = config.countdownMinutes * 60;
    
    // Check localStorage for saved session countdown
    const storedExpiry = sessionStorage.getItem('__booster_timer_expiry');
    const now = Math.floor(Date.now() / 1000);
    let targetExpiry = storedExpiry ? parseInt(storedExpiry, 10) : now + totalSeconds;
    if (targetExpiry <= now) targetExpiry = now + totalSeconds;
    sessionStorage.setItem('__booster_timer_expiry', targetExpiry);

    function formatTime(secs) {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    timerEl.innerHTML = `
      <div class="booster-timer-header">
        <span class="booster-clock-icon">⚡</span>
        <span class="booster-timer-title">Limited Time Flash Offer</span>
      </div>
      <div class="booster-timer-display" id="booster-countdown-val">${formatTime(Math.max(0, targetExpiry - now))}</div>
      <div class="booster-timer-note">Orders reserved in your cart for next 15 mins</div>
    `;

    productForm.parentNode.insertBefore(timerEl, productForm.nextSibling);

    const valEl = timerEl.querySelector('#booster-countdown-val');
    const timerInterval = setInterval(() => {
      const remaining = Math.max(0, targetExpiry - Math.floor(Date.now() / 1000));
      if (valEl) valEl.textContent = formatTime(remaining);
      if (remaining <= 0) {
        clearInterval(timerInterval);
        if (valEl) valEl.textContent = "00:00 - Expired";
      }
    }, 1000);
  }

  /* -------------------------------------------------------------
   * 6. Automated Google Rich Snippets SEO Schema (JSON-LD)
   * Automatically adds Product + 5-Star AggregateRating Schema
   * ------------------------------------------------------------- */
  function initAutoSeoSchema() {
    if (!config.enableSeoSchema) return;
    if (document.getElementById('booster-auto-seo-schema')) return;

    // Check if browsing a Shopify product page
    if (window.location.pathname.includes('/products/')) {
      const parts = window.location.pathname.split('/products/')[1];
      const handle = parts ? parts.split('/')[0].split('?')[0] : null;
      if (!handle) return;

      // Query Shopify native public product endpoint
      fetch(`/products/${handle}.js`)
        .then(res => res.json())
        .then(product => {
          if (!product || !product.title) return;

          const schema = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.title,
            "image": product.featured_image ? [product.featured_image] : [],
            "description": product.description ? product.description.replace(/<[^>]+>/g, '').substring(0, 220) : product.title,
            "sku": product.variants?.[0]?.sku || String(product.id),
            "brand": {
              "@type": "Brand",
              "name": product.vendor || detectedShop
            },
            "offers": {
              "@type": "Offer",
              "url": window.location.href,
              "priceCurrency": window.Shopify?.currency?.active || (config.currencySymbol === '€' ? 'EUR' : (config.currencySymbol === '£' ? 'GBP' : (config.currencySymbol === 'CAD' ? 'CAD' : 'USD'))),
              "price": (product.price / 100.0).toFixed(2),
              "priceValidUntil": new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
              "itemCondition": "https://schema.org/NewCondition",
              "availability": product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "seller": {
                "@type": "Organization",
                "name": detectedShop
              }
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "127"
            }
          };

          const scriptEl = document.createElement('script');
          scriptEl.type = 'application/ld+json';
          scriptEl.id = 'booster-auto-seo-schema';
          scriptEl.textContent = JSON.stringify(schema);
          document.head.appendChild(scriptEl);
          console.log('[Shopify Growth Booster] Automated Google 5-Star Rich Snippet Schema Active');
        })
        .catch(() => {});
    }
  }

  /* -------------------------------------------------------------
   * 7. Real-Time Order & Checkout Capture
   * ------------------------------------------------------------- */
  function detectOrderCompletion() {
    try {
      const path = (window.location.pathname || '').toLowerCase();
      const isThankYou = path.includes('/thank_you') || path.includes('/orders/') || path.includes('/checkouts/');
      const checkoutObj = (window.Shopify && window.Shopify.checkout) ? window.Shopify.checkout : null;

      if (isThankYou || checkoutObj) {
        // Extract order ID or checkout token across all Shopify checkout versions
        let extractedOrderId = null;

        // 1. Check window.Shopify.checkout
        if (checkoutObj?.order_id || checkoutObj?.id) {
          extractedOrderId = String(checkoutObj.order_id || checkoutObj.id);
        }

        // 2. Check window.ShopifyAnalytics page meta
        if (!extractedOrderId && window.ShopifyAnalytics?.meta?.page?.orderId) {
          extractedOrderId = String(window.ShopifyAnalytics.meta.page.orderId);
        }

        // 3. Check DOM confirmation elements (Shopify order status page)
        if (!extractedOrderId) {
          const domOrderElem = document.querySelector('.os-order-number') || 
                               document.querySelector('.order-number') || 
                               document.querySelector('[data-order-id]');
          if (domOrderElem) {
            extractedOrderId = domOrderElem.textContent.trim().replace(/^#/, '');
          }
        }

        // 4. Check URL query params
        if (!extractedOrderId) {
          const queryId = window.location.search.match(/[?&](order_id|order|id)=([^&]+)/i)?.[2];
          if (queryId) extractedOrderId = decodeURIComponent(queryId);
        }

        // 5. Extract token from URL path (e.g. /checkouts/c/abcdef12345/thank_you or /orders/987654321)
        if (!extractedOrderId && isThankYou) {
          const cleanPath = path.replace(/\/thank_you\/?$/, '');
          const parts = cleanPath.split('/').filter(Boolean);
          const lastPart = parts[parts.length - 1];
          if (lastPart && lastPart !== 'checkouts' && lastPart !== 'orders') {
            extractedOrderId = lastPart;
          }
        }

        if (!extractedOrderId || extractedOrderId === 'thank_you') {
          if (isThankYou) {
            let sessionOrderId = sessionStorage.getItem('__booster_current_checkout_id');
            if (!sessionOrderId) {
              sessionOrderId = 'order_' + Date.now();
              sessionStorage.setItem('__booster_current_checkout_id', sessionOrderId);
            }
            extractedOrderId = sessionOrderId;
          } else {
            return;
          }
        }

        const dedupeKey = `__booster_captured_order_${extractedOrderId}`;
        if (sessionStorage.getItem(dedupeKey)) return;
        sessionStorage.setItem(dedupeKey, '1');

        // Extract product name
        const firstItem = (checkoutObj?.line_items && checkoutObj.line_items[0]) 
          ? checkoutObj.line_items[0].title 
          : (document.querySelector('.product__description__name')?.textContent?.trim() || 
             document.querySelector('.os-line-item__title')?.textContent?.trim() || 
             'Store Product');

        // Extract total price
        let price = checkoutObj?.total_price || checkoutObj?.payment_due;
        if (!price) {
          const priceElem = document.querySelector('[data-checkout-payment-due-target]') || 
                            document.querySelector('.payment-due__price') || 
                            document.querySelector('.total-line__price span') ||
                            document.querySelector('.order-summary__emphasis');
          if (priceElem) {
            price = parseFloat(priceElem.textContent.replace(/[^0-9.]/g, '')) || 0;
          }
        }

        // Extract customer name & location
        const nameElem = document.querySelector('.os-step__description address') || 
                         document.querySelector('.address--tight');
        const domName = nameElem ? nameElem.textContent.split('\n')[0].trim() : null;
        const customerName = checkoutObj?.shipping_address?.first_name 
          ? `${checkoutObj.shipping_address.first_name} ${checkoutObj.shipping_address.last_name || ''}`.trim()
          : (domName || 'Verified Customer');

        const city = checkoutObj?.shipping_address?.city || 'United States';
        const country = checkoutObj?.shipping_address?.country || 'USA';

        const payload = JSON.stringify({
          shop: detectedShop,
          orderId: String(extractedOrderId),
          totalPrice: parseFloat(price) || 0,
          currency: checkoutObj?.currency || '$',
          customerName: customerName,
          city: city,
          country: country,
          items: [firstItem]
        });

        fetch(`${config.appUrl}/api/public/record-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          mode: 'cors',
          credentials: 'omit',
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {}
  }

  /* -------------------------------------------------------------
   * Initialization
   * ------------------------------------------------------------- */
  function boot() {
    recordTrafficAttribution();
    initLiveRouteTracking();
    detectOrderCompletion();
    initFreeShippingBar();
    initRecentSalesPopup();
    initVisitorCounter();
    initCountdownTimer();
    initAutoSeoSchema();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
