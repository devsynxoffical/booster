import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { loadData, saveData, createStoreEntry } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3005;

// Helper to make Shopify Admin REST API requests
function shopifyApiRequest(shop, accessToken, endpoint, method = 'GET', postData = null) {
  return new Promise((resolve, reject) => {
    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const options = {
      hostname: cleanShop,
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
        'User-Agent': 'Growth-Booster-MultiStore/2.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject({ status: res.statusCode, error: parsed.errors || data });
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data });
          } else {
            reject({ status: res.statusCode, error: data });
          }
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

// Exchange OAuth code for permanent access_token
function exchangeOAuthCode(shop, code, clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const postData = JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    });

    const options = {
      hostname: cleanShop,
      port: 443,
      path: '/admin/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.access_token) {
            resolve(parsed.access_token);
          } else {
            reject(new Error(parsed.error_description || parsed.errors || data));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(postData);
    req.end();
  });
}

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Allow embedding inside Shopify Admin iframe
  app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options');
    const shop = req.query.shop;
    if (shop) {
      res.setHeader('Content-Security-Policy', `frame-ancestors https://${shop} https://admin.shopify.com https://*.myshopify.com;`);
    } else {
      res.setHeader('Content-Security-Policy', `frame-ancestors https://admin.shopify.com https://*.myshopify.com 'self';`);
    }
    next();
  });

  // Serve theme extension static assets directly
  app.use('/extensions/assets', express.static(path.join(__dirname, '../extensions/booster-extension/assets')));

  /* -------------------------------------------------------------
   * Helper to Resolve Store by ID, Domain, or Fallback to Active
   * ------------------------------------------------------------- */
  function resolveStore(data, req) {
    const shopQuery = req.query.shop || req.body?.shop;
    const storeIdQuery = req.query.storeId || req.body?.storeId;

    if (storeIdQuery) {
      const match = data.stores.find(s => s.id === storeIdQuery);
      if (match) return match;
    }

    if (shopQuery) {
      const clean = shopQuery.replace(/^https?:\/\//, '').replace(/\/$/, '');
      let match = data.stores.find(s => s.shopDomain === clean || s.shopDomain.includes(clean) || (s.customDomain && clean.includes(s.customDomain)));
      if (!match) {
        const friendlyName = (clean.includes('chandkali') || clean.includes('usabeauty')) 
          ? 'USA BEAUTY STORE' 
          : clean.replace('.myshopify.com', '').replace(/[-_.]/g, ' ').toUpperCase();
        match = createStoreEntry(clean, friendlyName);
        if (clean.includes('chandkali') || clean.includes('usabeauty')) {
          match.customDomain = 'usabeautystore.com';
        }
        data.stores.push(match);
        data.activeStoreId = match.id;
        saveData(data);
      }
      return match;
    }

    // Try extracting from referer / origin header (for storefront scripts)
    const referer = req.headers.referer || req.headers.origin || '';
    if (referer) {
      for (const store of data.stores) {
        if (referer.includes(store.shopDomain) || (store.customDomain && referer.includes(store.customDomain))) {
          return store;
        }
      }
      if (referer.includes('chandkali') || referer.includes('usabeauty')) {
        let match = data.stores.find(s => s.shopDomain === 'chandkali.myshopify.com');
        if (!match) {
          match = createStoreEntry('chandkali.myshopify.com', 'USA BEAUTY STORE');
          match.customDomain = 'usabeautystore.com';
          data.stores.push(match);
          data.activeStoreId = match.id;
          saveData(data);
        }
        return match;
      }
    }

    // Fallback to active store
    if (data.activeStoreId) {
      const active = data.stores.find(s => s.id === data.activeStoreId);
      if (active) return active;
    }

    // Fallback to first store
    return data.stores[0] || null;
  }

  /* -------------------------------------------------------------
   * 1. Shopify OAuth Flow (1-Click Install for Any Store)
   * ------------------------------------------------------------- */

  // Start OAuth install
  app.get('/auth', (req, res) => {
    const shop = req.query.shop;
    const data = loadData();
    const clientId = data.appConfig.clientId;
    const scopes = data.appConfig.scopes;
    const publicUrl = data.appConfig.publicAppUrl || `http://localhost:${PORT}`;

    if (!shop) {
      return res.status(400).send('Missing shop parameter. Example: /auth?shop=your-store.myshopify.com');
    }

    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const redirectUri = `${publicUrl}/auth/callback`;
    const state = crypto.randomBytes(16).toString('hex');

    const authUrl = `https://${cleanShop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    res.redirect(authUrl);
  });

  // OAuth Callback (Shopify redirects here with auth code)
  app.get('/auth/callback', async (req, res) => {
    const { shop, code } = req.query;
    const data = loadData();

    if (!shop || !code) {
      return res.status(400).send('Missing shop or authorization code from Shopify.');
    }

    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
      // Exchange code for access_token
      const accessToken = await exchangeOAuthCode(
        cleanShop,
        code,
        data.appConfig.clientId,
        data.appConfig.clientSecret
      );

      // Query shop info
      const shopRes = await shopifyApiRequest(cleanShop, accessToken, '/admin/api/2026-01/shop.json');
      const shopInfo = shopRes.data.shop;

      // Query products
      let products = [];
      try {
        const prodRes = await shopifyApiRequest(cleanShop, accessToken, '/admin/api/2026-01/products.json?limit=50&fields=id,title,handle,images,variants');
        products = prodRes.data.products || [];
      } catch (e) {}

      // Query orders
      let orders = [];
      try {
        const ordRes = await shopifyApiRequest(cleanShop, accessToken, '/admin/api/2026-01/orders.json?status=any&limit=25');
        orders = ordRes.data.orders || [];
      } catch (e) {}

      // Upsert into multi-store array
      let store = data.stores.find(s => s.shopDomain === cleanShop);
      if (!store) {
        store = createStoreEntry(cleanShop, shopInfo.name);
        data.stores.push(store);
      }

      store.storeName = shopInfo.name;
      store.email = shopInfo.email;
      store.currency = shopInfo.currency;
      store.currencySymbol = shopInfo.money_format?.charAt(0) || '$';
      store.accessToken = accessToken;
      store.realProducts = products;
      store.realOrders = orders;
      store.settings.storeName = shopInfo.name;
      store.settings.storeUrl = `https://${cleanShop}`;
      store.settings.shippingCurrency = store.currencySymbol;

      // Auto-inject ScriptTag into customer storefront (Zero code editing for customer!)
      try {
        const publicUrl = data.appConfig.publicAppUrl || `https://booster-5imz.onrender.com`;
        const scriptUrl = `${publicUrl}/extensions/assets/booster.js`;
        const existingTags = await shopifyApiRequest(cleanShop, accessToken, '/admin/api/2026-01/script_tags.json');
        const alreadyInjected = existingTags.data?.script_tags?.some(st => st.src.includes('booster.js'));

        if (!alreadyInjected) {
          await shopifyApiRequest(cleanShop, accessToken, '/admin/api/2026-01/script_tags.json', 'POST', {
            script_tag: {
              event: 'onload',
              src: scriptUrl
            }
          });
          console.log(`Auto-injected ScriptTag into ${cleanShop}`);
        }
      } catch (stErr) {
        console.warn('ScriptTag auto-injection notice:', stErr);
      }

      if (orders.length > 0) {
        store.stats.totalOrdersBoosted = orders.length;
        store.stats.revenueGenerated = parseFloat(orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0).toFixed(2));
      }

      data.activeStoreId = store.id;
      saveData(data);

      res.redirect(`/?connected=${encodeURIComponent(cleanShop)}&success=true`);
    } catch (err) {
      console.error('OAuth token exchange failed:', err);
      res.status(500).send(`Failed to authenticate with Shopify: ${err.message}`);
    }
  });

  // Super Admin Password Protection Endpoints
  app.post('/api/admin/verify-password', (req, res) => {
    const { password } = req.body;
    const data = loadData();
    const correctPassword = data.appConfig?.adminPassword || process.env.ADMIN_PASSWORD || 'devsynx2026';
    if (password === correctPassword) {
      return res.json({ success: true, token: 'devsynx_admin_authenticated' });
    }
    return res.status(401).json({ success: false, error: 'Incorrect master admin password' });
  });

  app.post('/api/admin/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const data = loadData();
    const correctPassword = data.appConfig?.adminPassword || process.env.ADMIN_PASSWORD || 'devsynx2026';
    if (currentPassword !== correctPassword) {
      return res.status(401).json({ success: false, error: 'Current password incorrect' });
    }
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
    }
    data.appConfig.adminPassword = newPassword;
    saveData(data);
    res.json({ success: true, message: 'Admin password updated successfully!' });
  });

  // Update App Credentials directly from Admin Panel (No .env needed!)
  app.post('/api/stores/app-config', (req, res) => {
    const { clientId, clientSecret, publicAppUrl, adminPassword } = req.body;
    const data = loadData();
    if (clientId) data.appConfig.clientId = clientId.trim();
    if (clientSecret) data.appConfig.clientSecret = clientSecret.trim();
    if (publicAppUrl) data.appConfig.publicAppUrl = publicAppUrl.trim();
    if (adminPassword) data.appConfig.adminPassword = adminPassword.trim();
    saveData(data);
    res.json({ success: true, appConfig: data.appConfig });
  });

  // Get all connected stores list & active store
  app.get('/api/stores', (req, res) => {
    const data = loadData();
    res.json({
      activeStoreId: data.activeStoreId,
      appConfig: {
        clientId: data.appConfig.clientId,
        publicAppUrl: data.appConfig.publicAppUrl
      },
      stores: data.stores.map(s => ({
        id: s.id,
        shopDomain: s.shopDomain,
        storeName: s.storeName,
        email: s.email,
        currency: s.currency,
        currencySymbol: s.currencySymbol,
        connectedAt: s.connectedAt,
        productsCount: s.realProducts?.length || 0,
        ordersCount: s.realOrders?.length || 0,
        totalVisitors: s.stats?.totalVisitors || 0,
        revenueGenerated: s.stats?.revenueGenerated || 0,
        isActive: s.id === data.activeStoreId
      }))
    });
  });

  // Switch active store
  app.post('/api/stores/switch', (req, res) => {
    const { storeId } = req.body;
    const data = loadData();
    const target = data.stores.find(s => s.id === storeId);
    if (!target) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }
    data.activeStoreId = target.id;
    saveData(data);
    res.json({ success: true, activeStore: target });
  });

  // Generate 1-Click Install Link for any store
  app.get('/api/stores/install-link', (req, res) => {
    const shop = req.query.shop;
    const data = loadData();
    if (!shop) return res.status(400).json({ error: 'Shop domain required' });

    const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const publicUrl = data.appConfig.publicAppUrl || `http://localhost:${PORT}`;
    const link = `${publicUrl}/auth?shop=${encodeURIComponent(cleanShop)}`;

    res.json({ installLink: link });
  });

  // Direct manual connect or quick-add for any store
  app.post('/api/stores/connect-manual', async (req, res) => {
    const { shopDomain, storeName, accessToken } = req.body;
    if (!shopDomain) {
      return res.status(400).json({ success: false, error: 'Shop domain is required.' });
    }

    const cleanShop = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const data = loadData();

    // If access token is provided, verify and sync real store data from Shopify
    if (accessToken && accessToken.trim()) {
      try {
        const token = accessToken.trim();
        const shopRes = await shopifyApiRequest(cleanShop, token, '/admin/api/2026-01/shop.json');
        const shopInfo = shopRes.data.shop;

        let products = [];
        try {
          const prodRes = await shopifyApiRequest(cleanShop, token, '/admin/api/2026-01/products.json?limit=50&fields=id,title,handle,images,variants');
          products = prodRes.data.products || [];
        } catch (e) {}

        let orders = [];
        try {
          const ordRes = await shopifyApiRequest(cleanShop, token, '/admin/api/2026-01/orders.json?status=any&limit=25');
          orders = ordRes.data.orders || [];
        } catch (e) {}

        let store = data.stores.find(s => s.shopDomain === cleanShop);
        if (!store) {
          store = createStoreEntry(cleanShop, storeName || shopInfo.name);
          data.stores.push(store);
        }

        store.storeName = storeName || shopInfo.name;
        store.email = shopInfo.email;
        store.currency = shopInfo.currency;
        store.currencySymbol = shopInfo.money_format?.charAt(0) || '$';
        store.accessToken = token;
        store.realProducts = products;
        store.realOrders = orders;
        store.settings.storeName = store.storeName;
        store.settings.storeUrl = `https://${cleanShop}`;
        store.settings.shippingCurrency = store.currencySymbol;

        if (orders.length > 0) {
          store.stats.totalOrdersBoosted = orders.length;
          store.stats.revenueGenerated = parseFloat(orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0).toFixed(2));
        }

        data.activeStoreId = store.id;
        saveData(data);

        return res.json({
          success: true,
          message: `Successfully connected ${store.storeName} with live sync!`,
          store: store
        });
      } catch (err) {
        console.warn('API token verification notice:', err);
        let store = data.stores.find(s => s.shopDomain === cleanShop);
        if (!store) {
          const fallbackName = storeName || cleanShop.replace('.myshopify.com', '').toUpperCase();
          store = createStoreEntry(cleanShop, fallbackName);
          data.stores.push(store);
        }
        store.accessToken = accessToken.trim();
        data.activeStoreId = store.id;
        saveData(data);

        return res.json({
          success: true,
          message: `Store "${store.storeName}" added! Paste the 1-line script tag in their theme to start tracking.`,
          store: store
        });
      }
    } else {
      // Quick-add store without token (Ready for 1-line script tag tracking)
      let store = data.stores.find(s => s.shopDomain === cleanShop);
      if (!store) {
        const fallbackName = storeName || cleanShop.replace('.myshopify.com', '').toUpperCase();
        store = createStoreEntry(cleanShop, fallbackName);
        data.stores.push(store);
      }
      data.activeStoreId = store.id;
      saveData(data);

      return res.json({
        success: true,
        message: `Store "${store.storeName}" added successfully! Paste the 1-line script tag in their theme to start tracking.`,
        store: store
      });
    }
  });

  // Delete / Disconnect store
  app.delete('/api/stores/:id', (req, res) => {
    const storeId = req.params.id;
    const data = loadData();
    data.stores = data.stores.filter(s => s.id !== storeId);
    if (data.activeStoreId === storeId) {
      data.activeStoreId = data.stores[0] ? data.stores[0].id : null;
    }
    saveData(data);
    res.json({ success: true });
  });

  /* -------------------------------------------------------------
   * 3. Active Store Operational Endpoints
   * ------------------------------------------------------------- */

  // Get active store stats
  app.get('/api/stats', (req, res) => {
    const data = loadData();
    const store = resolveStore(data, req);
    if (!store) {
      return res.json({
        totalVisitors: 0,
        pageViews: 0,
        uniqueVisitors: 0,
        organicVisitors: 0,
        organicSharePercent: 0,
        conversionRate: 0,
        totalOrdersBoosted: 0,
        revenueGenerated: 0,
        regions: {},
        recentEvents: []
      });
    }
    res.json(store.stats);
  });

  // Get active store config
  app.get('/api/config', (req, res) => {
    const data = loadData();
    const store = resolveStore(data, req);
    if (!store) {
      return res.json(createStoreEntry('default').settings);
    }
    res.json(store.settings);
  });

  // Save active store config
  app.post('/api/config', (req, res) => {
    const data = loadData();
    const store = resolveStore(data, req);
    if (!store) {
      return res.status(400).json({ success: false, error: 'No active store selected' });
    }
    store.settings = { ...store.settings, ...req.body };
    saveData(data);
    res.json({ success: true, settings: store.settings });
  });

  // Get SEO keywords
  app.get('/api/seo/keywords', (req, res) => {
    const data = loadData();
    const store = resolveStore(data, req);
    res.json(store ? store.keywords : []);
  });

  // Generate SEO keywords for active store
  app.post('/api/seo/generate-keyword', (req, res) => {
    const data = loadData();
    const store = resolveStore(data, req);
    if (!store) return res.status(400).json({ error: 'No active store' });

    const { niche, productCategory } = req.body;
    const baseCategory = productCategory || niche || store.storeName;

    const newKeywords = [
      {
        id: Date.now(),
        keyword: `best affordable ${baseCategory} 2026`,
        volume: 14800,
        difficulty: 19,
        intent: "Commercial",
        status: "Targeted"
      },
      {
        id: Date.now() + 1,
        keyword: `top rated ${baseCategory} online`,
        volume: 9200,
        difficulty: 16,
        intent: "Transactional",
        status: "Targeted"
      }
    ];

    store.keywords = [...newKeywords, ...store.keywords];
    saveData(data);
    res.json({ success: true, keywords: store.keywords });
  });

  // Get SEO articles
  app.get('/api/seo/articles', (req, res) => {
    const data = loadData();
    const store = resolveStore(data, req);
    res.json(store ? store.articles : []);
  });

  // Generate & Publish SEO article to active store
  app.post('/api/seo/generate-article', async (req, res) => {
    const data = loadData();
    const store = resolveStore(data, req);
    if (!store) return res.status(400).json({ error: 'No active store' });

    const { targetKeyword, productFocus } = req.body;
    const keyword = targetKeyword || "beauty essentials";
    const product = productFocus || (store.realProducts[0] ? store.realProducts[0].title : store.storeName);

    const titleWords = keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const articleTitle = `The Definitive Guide to ${titleWords}: Top Recommendations for 2026`;
    const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const generatedArticle = {
      id: `art-${Date.now()}`,
      title: articleTitle,
      slug: slug,
      targetKeyword: keyword,
      publishedAt: new Date().toISOString().split('T')[0],
      status: "Published to Store",
      estimatedMonthlyTraffic: 1800,
      readingTime: "5 min read",
      summary: `Programmatic SEO guide targeting "${keyword}" with rich schema and internal product recommendations for "${product}".`,
      content: `
# ${articleTitle}

Looking for verified quality in ${keyword}? In 2026, buyers prioritize verified formulations, dermatologist testing, and reliable results.

## Why ${keyword} Is Trending
Shoppers are looking for products that combine gentle ingredients with proven results.

### Key Buyer Checklist:
1. Certified formulations and ingredient transparency
2. Verified reviews from authentic buyers
3. Free express delivery and transparent return guarantees

## Top Pick: ${product}
Available at ${store.storeName}. Handcrafted with premium ingredients and 5-star customer feedback.
      `
    };

    store.articles.unshift(generatedArticle);

    // If store has accessToken, publish directly to Shopify Blog
    if (store.accessToken && store.shopDomain) {
      try {
        const blogsRes = await shopifyApiRequest(store.shopDomain, store.accessToken, '/admin/api/2026-01/blogs.json');
        if (blogsRes.data.blogs && blogsRes.data.blogs.length > 0) {
          const blogId = blogsRes.data.blogs[0].id;
          await shopifyApiRequest(
            store.shopDomain,
            store.accessToken,
            `/admin/api/2026-01/blogs/${blogId}/articles.json`,
            'POST',
            {
              article: {
                title: articleTitle,
                author: store.storeName,
                body_html: generatedArticle.content.replace(/\n/g, '<br/>'),
                tags: `${keyword}, guide`,
                published: true
              }
            }
          );
          generatedArticle.status = `Published Live to Shopify Blog (/blogs/${blogsRes.data.blogs[0].handle})`;
        }
      } catch (err) {
        console.warn('Could not auto-publish to Shopify blog:', err);
      }
    }

    saveData(data);
    res.json({ success: true, article: generatedArticle });
  });

  /* -------------------------------------------------------------
   * 4. Multi-Tenant Public Storefront APIs (for booster.js)
   * ------------------------------------------------------------- */

  // Storefront recent purchases (automatically isolates by store domain)
  app.get('/api/public/recent-orders', (req, res) => {
    const data = loadData();
    const store = resolveStore(data, req);

    if (store) {
      if (store.realOrders && store.realOrders.length > 0) {
        const formatted = store.realOrders.slice(0, 8).map(o => ({
          name: o.name || 'Verified Customer',
          city: o.city || 'Verified Buyer',
          product: o.product || (o.line_items && o.line_items[0] ? o.line_items[0].title : 'Store Product'),
          time: 'Recently purchased',
          img: o.img || (store.realProducts[0]?.images[0]?.src || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150&auto=format&fit=crop&q=80')
        }));
        return res.json(formatted);
      }

      if (store.realProducts && store.realProducts.length > 0) {
        const formatted = store.realProducts.slice(0, 8).map(p => ({
          name: 'Verified Customer',
          city: 'Trending Now',
          product: p.title,
          time: 'Popular item',
          img: p.images && p.images[0] ? p.images[0].src : 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150&auto=format&fit=crop&q=80'
        }));
        return res.json(formatted);
      }
    }

    res.json([]);
  });

  // Storefront live visit & click tracking (multi-tenant)
  app.post('/api/public/record-event', (req, res) => {
    const { type, referrer, url } = req.body;
    const data = loadData();
    const store = resolveStore(data, req);

    if (store) {
      store.stats.totalVisitors += 1;
      store.stats.pageViews += 1;

      const rawCountry = req.headers['cf-ipcountry'] || req.headers['x-country-code'] || req.headers['x-vercel-ip-country'] || req.body?.country || 'US';
      const country = String(rawCountry).trim().toUpperCase();
      store.stats.regions[country] = (store.stats.regions[country] || 0) + 1;

      const isOrganic = referrer && (
        referrer.includes('google.') ||
        referrer.includes('bing.') ||
        referrer.includes('pinterest.') ||
        referrer.includes('tiktok.') ||
        referrer.includes('instagram.') ||
        referrer.includes('duckduckgo.')
      );

      if (isOrganic || type === 'organic_visit') {
        store.stats.organicVisitors += 1;
        let sourceName = 'Google Organic';
        if (referrer.includes('bing.')) sourceName = 'Bing Search';
        if (referrer.includes('pinterest.')) sourceName = 'Pinterest Rich Pin';
        if (referrer.includes('tiktok.')) sourceName = 'TikTok Feed';
        if (referrer.includes('instagram.')) sourceName = 'Instagram Referral';

        store.stats.recentEvents.unshift({
          id: Date.now(),
          type: 'organic_visit',
          source: sourceName,
          keyword: url ? new URL(url).pathname : 'Product Landing',
          time: 'Just now'
        });
        if (store.stats.recentEvents.length > 20) store.stats.recentEvents.pop();
      }

      if (type === 'popup_click') store.stats.popupClicks += 1;
      if (type === 'popup_impression') store.stats.popupImpressions += 1;

      if (store.stats.totalVisitors > 0) {
        store.stats.organicSharePercent = parseFloat(((store.stats.organicVisitors / store.stats.totalVisitors) * 100).toFixed(1));
      }

      saveData(data);
    }

    res.json({ ok: true });
  });

  // Webhook Receiver for live store order creation (multi-tenant)
  app.post('/api/webhooks/orders/create', (req, res) => {
    const order = req.body;
    const shopHeader = req.headers['x-shopify-shop-domain'] || '';
    const data = loadData();

    let store = data.stores.find(s => s.shopDomain === shopHeader);
    if (!store && data.stores.length > 0) store = data.stores[0];

    if (store && order && order.id) {
      const buyerName = order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name ? order.customer.last_name[0] + '.' : ''}` : 'Verified Customer';
      const city = order.shipping_address?.city || order.billing_address?.city || 'Online Buyer';
      const country = order.shipping_address?.country || 'USA';
      const firstItem = order.line_items && order.line_items[0] ? order.line_items[0].title : 'Product';
      const price = parseFloat(order.total_price || 0);

      store.realOrders.unshift({
        id: order.id,
        name: buyerName.trim() || 'Verified Customer',
        city: `${city}, ${country}`,
        product: firstItem,
        revenue: price,
        time: 'Just now',
        created_at: new Date().toISOString()
      });

      store.stats.totalOrdersBoosted += 1;
      store.stats.revenueGenerated = parseFloat((store.stats.revenueGenerated + price).toFixed(2));

      store.stats.recentEvents.unshift({
        id: Date.now(),
        type: 'popup_conversion',
        product: firstItem,
        revenue: price,
        buyer: `${buyerName} (${city})`,
        time: 'Just now'
      });
      if (store.stats.recentEvents.length > 20) store.stats.recentEvents.pop();

      saveData(data);
    }

    res.status(200).send('Webhook processed');
  });

  /* -------------------------------------------------------------
   * Frontend Serving
   * ------------------------------------------------------------- */
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.join(__dirname, '../client')
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 Multi-Store Shopify Growth Booster running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
