import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { createServer as createViteServer } from 'vite';
import { loadData, saveData } from './storage.js';

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
        'User-Agent': 'Shopify-Growth-Booster-App/1.0'
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

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Serve theme extension static assets directly so merchants can test them locally
  app.use('/extensions/assets', express.static(path.join(__dirname, '../extensions/booster-extension/assets')));

  /* -------------------------------------------------------------
   * Shopify Live Connection APIs
   * ------------------------------------------------------------- */

  // 1. Get current connection and store status
  app.get('/api/shopify/status', (req, res) => {
    const data = loadData();
    res.json({
      isConnected: data.connection.isConnected,
      shopDomain: data.connection.shopDomain,
      publicAppUrl: data.connection.publicAppUrl || `http://localhost:${PORT}`,
      storeDetails: data.connection.storeDetails,
      realProductCount: data.realProducts?.length || 0,
      realOrderCount: data.realOrders?.length || 0
    });
  });

  // 2. Connect Live Shopify Store using Admin API Access Token
  app.post('/api/shopify/connect', async (req, res) => {
    const { shopDomain, accessToken, publicAppUrl } = req.body;

    if (!shopDomain || !accessToken) {
      return res.status(400).json({ success: false, error: "Shop domain and Admin Access Token are required." });
    }

    const cleanShop = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
      // 1. Verify credentials by querying /admin/api/2026-01/shop.json
      const shopRes = await shopifyApiRequest(cleanShop, accessToken, '/admin/api/2026-01/shop.json');
      const shopInfo = shopRes.data.shop;

      // 2. Fetch real products from store
      let products = [];
      try {
        const prodRes = await shopifyApiRequest(cleanShop, accessToken, '/admin/api/2026-01/products.json?limit=50&fields=id,title,handle,images,variants,vendor');
        products = prodRes.data.products || [];
      } catch (err) {
        console.warn('Could not fetch products, continuing:', err);
      }

      // 3. Fetch real recent orders from store
      let orders = [];
      try {
        const ordRes = await shopifyApiRequest(cleanShop, accessToken, '/admin/api/2026-01/orders.json?status=any&limit=25&fields=id,name,total_price,customer,line_items,created_at');
        orders = ordRes.data.orders || [];
      } catch (err) {
        console.warn('Could not fetch orders, continuing:', err);
      }

      const data = loadData();
      data.connection = {
        isConnected: true,
        shopDomain: cleanShop,
        accessToken: accessToken,
        publicAppUrl: publicAppUrl || data.connection.publicAppUrl || `http://localhost:${PORT}`,
        storeDetails: {
          name: shopInfo.name,
          email: shopInfo.email,
          currency: shopInfo.currency,
          currencySymbol: shopInfo.money_format?.charAt(0) || '$',
          domain: shopInfo.domain || cleanShop,
          myshopify_domain: shopInfo.myshopify_domain
        }
      };

      data.settings.storeName = shopInfo.name;
      data.settings.storeUrl = `https://${cleanShop}`;
      data.settings.shippingCurrency = shopInfo.money_format?.charAt(0) || '$';
      data.realProducts = products;
      data.realOrders = orders;

      // Calculate initial real stats if orders exist
      if (orders.length > 0) {
        data.stats.totalOrdersBoosted = orders.length;
        const totalRev = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
        data.stats.revenueGenerated = parseFloat(totalRev.toFixed(2));
      }

      saveData(data);

      res.json({
        success: true,
        message: `Successfully connected to ${shopInfo.name}!`,
        store: shopInfo,
        productsCount: products.length,
        ordersCount: orders.length
      });
    } catch (err) {
      console.error('Shopify Connection Failed:', err);
      res.status(401).json({
        success: false,
        error: "Failed to connect to Shopify. Please verify your shop domain and Admin API Access Token."
      });
    }
  });

  // 3. Disconnect store
  app.post('/api/shopify/disconnect', (req, res) => {
    const data = loadData();
    data.connection = {
      isConnected: false,
      shopDomain: "",
      accessToken: "",
      publicAppUrl: data.connection.publicAppUrl,
      storeDetails: { name: "Disconnected", email: "", currency: "USD", domain: "" }
    };
    data.realProducts = [];
    data.realOrders = [];
    saveData(data);
    res.json({ success: true });
  });

  // 4. Reset stats to 0 (Fresh clean live start)
  app.post('/api/shopify/reset-stats', (req, res) => {
    const data = loadData();
    data.stats = {
      totalVisitors: 0,
      pageViews: 0,
      uniqueVisitors: 0,
      bounceRate: 0,
      organicVisitors: 0,
      organicSharePercent: 0,
      conversionRate: 0,
      conversionUpliftPercent: 0,
      totalOrdersBoosted: data.realOrders?.length || 0,
      revenueGenerated: data.realOrders?.reduce((s, o) => s + parseFloat(o.total_price || 0), 0) || 0,
      popupImpressions: 0,
      popupClicks: 0,
      regions: {},
      recentEvents: []
    };
    saveData(data);
    res.json({ success: true, stats: data.stats });
  });

  // 5. Get Real Store Products
  app.get('/api/shopify/products', (req, res) => {
    const data = loadData();
    res.json(data.realProducts || []);
  });

  // 6. Webhook Receiver for Live Shopify Orders (Real-time order creation)
  app.post('/api/webhooks/orders/create', (req, res) => {
    const order = req.body;
    const data = loadData();

    if (order && order.id) {
      const buyerName = order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name ? order.customer.last_name[0] + '.' : ''}` : 'Verified Customer';
      const city = order.shipping_address?.city || order.billing_address?.city || 'Online Shopper';
      const country = order.shipping_address?.country || 'USA';
      const firstItem = order.line_items && order.line_items[0] ? order.line_items[0].title : 'Store Item';
      const price = parseFloat(order.total_price || 0);

      const newOrderRecord = {
        id: order.id,
        name: buyerName.trim() || 'Verified Customer',
        city: `${city}, ${country}`,
        product: firstItem,
        revenue: price,
        time: 'Just now',
        created_at: new Date().toISOString()
      };

      data.realOrders.unshift(newOrderRecord);
      data.stats.totalOrdersBoosted += 1;
      data.stats.revenueGenerated += price;

      data.stats.recentEvents.unshift({
        id: Date.now(),
        type: 'popup_conversion',
        product: firstItem,
        revenue: price,
        buyer: `${buyerName} (${city})`,
        time: 'Just now'
      });

      // Keep recent events capped at 20
      if (data.stats.recentEvents.length > 20) data.stats.recentEvents.pop();

      saveData(data);
    }

    res.status(200).send('Webhook processed');
  });

  /* -------------------------------------------------------------
   * Public Storefront APIs (for booster.js on live store)
   * ------------------------------------------------------------- */

  // 7. Get Recent Purchases for Storefront Popups (uses real orders or real products)
  app.get('/api/public/recent-orders', (req, res) => {
    const data = loadData();
    
    // If real orders exist from the store, return them
    if (data.realOrders && data.realOrders.length > 0) {
      const formatted = data.realOrders.slice(0, 10).map(o => ({
        name: o.name || 'Verified Buyer',
        city: o.city || 'Verified Order',
        product: o.product || (o.line_items && o.line_items[0] ? o.line_items[0].title : 'Product'),
        time: 'Recently purchased',
        img: o.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80'
      }));
      return res.json(formatted);
    }

    // If no orders yet, fall back to the merchant's real store products
    if (data.realProducts && data.realProducts.length > 0) {
      const formatted = data.realProducts.slice(0, 8).map(p => ({
        name: "Verified Customer",
        city: "Trending Item",
        product: p.title,
        time: "Popular Today",
        img: p.images && p.images[0] ? p.images[0].src : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80'
      }));
      return res.json(formatted);
    }

    res.json([]);
  });

  // 8. Public live event tracking
  app.post('/api/public/record-event', (req, res) => {
    const { type, referrer, url } = req.body;
    const data = loadData();

    data.stats.totalVisitors += 1;
    data.stats.pageViews += 1;

    // Detect visitor country from Cloudflare / proxy headers or default
    const country = req.headers['cf-ipcountry'] || req.headers['x-country-code'] || 'United States';
    data.stats.regions[country] = (data.stats.regions[country] || 0) + 1;

    // Detect organic traffic
    const isOrganic = referrer && (
      referrer.includes('google.') ||
      referrer.includes('bing.') ||
      referrer.includes('pinterest.') ||
      referrer.includes('tiktok.') ||
      referrer.includes('instagram.') ||
      referrer.includes('duckduckgo.')
    );

    if (isOrganic || type === 'organic_visit') {
      data.stats.organicVisitors += 1;
      
      let sourceName = 'Google Organic';
      if (referrer.includes('bing.')) sourceName = 'Bing Search';
      if (referrer.includes('pinterest.')) sourceName = 'Pinterest Rich Pin';
      if (referrer.includes('tiktok.')) sourceName = 'TikTok Feed';
      if (referrer.includes('instagram.')) sourceName = 'Instagram Referral';

      data.stats.recentEvents.unshift({
        id: Date.now(),
        type: 'organic_visit',
        source: sourceName,
        keyword: url ? new URL(url).pathname : 'Product Landing',
        time: 'Just now'
      });
      if (data.stats.recentEvents.length > 20) data.stats.recentEvents.pop();
    }

    if (type === 'popup_click') {
      data.stats.popupClicks += 1;
    }

    if (type === 'popup_impression') {
      data.stats.popupImpressions += 1;
    }

    // Recalculate organic percentage
    if (data.stats.totalVisitors > 0) {
      data.stats.organicSharePercent = parseFloat(((data.stats.organicVisitors / data.stats.totalVisitors) * 100).toFixed(1));
    }

    saveData(data);
    res.json({ ok: true });
  });

  /* -------------------------------------------------------------
   * Booster Core APIs
   * ------------------------------------------------------------- */

  app.get('/api/config', (req, res) => {
    const data = loadData();
    res.json(data.settings);
  });

  app.post('/api/config', (req, res) => {
    const data = loadData();
    data.settings = { ...data.settings, ...req.body };
    saveData(data);
    res.json({ success: true, settings: data.settings });
  });

  app.get('/api/stats', (req, res) => {
    const data = loadData();
    res.json(data.stats);
  });

  app.get('/api/seo/keywords', (req, res) => {
    const data = loadData();
    res.json(data.keywords);
  });

  app.post('/api/seo/generate-keyword', (req, res) => {
    const { niche, productCategory } = req.body;
    const baseCategory = productCategory || niche || "store catalog";
    
    const newKeywords = [
      {
        id: Date.now(),
        keyword: `best ${baseCategory} 2026 reviews`,
        volume: 14200,
        difficulty: 18,
        intent: "Commercial",
        status: "Targeted"
      },
      {
        id: Date.now() + 1,
        keyword: `buy ${baseCategory} online free shipping`,
        volume: 9800,
        difficulty: 15,
        intent: "Transactional",
        status: "Targeted"
      }
    ];

    const data = loadData();
    data.keywords = [...newKeywords, ...data.keywords];
    saveData(data);

    res.json({ success: true, keywords: data.keywords });
  });

  app.get('/api/seo/articles', (req, res) => {
    const data = loadData();
    res.json(data.articles);
  });

  app.post('/api/seo/generate-article', async (req, res) => {
    const { targetKeyword, productFocus } = req.body;
    const keyword = targetKeyword || "trending lifestyle essentials";
    const product = productFocus || "Store Product";

    const titleWords = keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const articleTitle = `The Ultimate Guide to ${titleWords}: 2026 Buyer Recommendations`;
    const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const generatedArticle = {
      id: `art-${Date.now()}`,
      title: articleTitle,
      slug: slug,
      targetKeyword: keyword,
      publishedAt: new Date().toISOString().split('T')[0],
      status: "Ready to Publish to Shopify",
      estimatedMonthlyTraffic: 1650,
      readingTime: "5 min read",
      summary: `SEO buyer-guide targeting "${keyword}". Features rich schema and product recommendations for "${product}".`,
      content: `
# ${articleTitle}

Looking to upgrade your daily carry with high-quality ${keyword}? In 2026, buyers demand verified performance and durable craftsmanship.

## Why ${keyword} Is Essential
Shoppers searching for ${keyword} look for proven durability and high satisfaction ratings.

### Key Buyer Considerations:
1. Material durability & certified quality
2. Ergonomic comfort for long-term use
3. Fast shipping and verified warranty protection

## Top Recommendation: ${product}
Our editors highlight ${product} for its unrivaled balance of premium construction, 5-star customer reviews, and fast dispatch.
      `
    };

    const data = loadData();
    data.articles.unshift(generatedArticle);

    // If Shopify store is live-connected, optionally publish directly to Shopify Blog
    if (data.connection.isConnected && data.connection.accessToken) {
      try {
        const blogsRes = await shopifyApiRequest(data.connection.shopDomain, data.connection.accessToken, '/admin/api/2026-01/blogs.json');
        if (blogsRes.data.blogs && blogsRes.data.blogs.length > 0) {
          const blogId = blogsRes.data.blogs[0].id;
          await shopifyApiRequest(
            data.connection.shopDomain,
            data.connection.accessToken,
            `/admin/api/2026-01/blogs/${blogId}/articles.json`,
            'POST',
            {
              article: {
                title: articleTitle,
                author: data.connection.storeDetails.name || 'Store Editor',
                body_html: generatedArticle.content.replace(/\n/g, '<br/>'),
                tags: `${keyword}, recommendations, guide`,
                published: true
              }
            }
          );
          generatedArticle.status = `Published live to Shopify Blog (/blogs/${blogsRes.data.blogs[0].handle})`;
        }
      } catch (err) {
        console.warn('Could not auto-publish to Shopify blog:', err);
      }
    }

    saveData(data);
    res.json({ success: true, article: generatedArticle });
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
    console.log(`🚀 Shopify Growth & Organic Sales Booster running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
