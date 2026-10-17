import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

const CLIENT_ID = process.env.SHOPIFY_API_KEY || "4d64bd85effdc3825141e559a7c7b890";
const CLIENT_SECRET = process.env.SHOPIFY_API_SECRET || "";
const PUBLIC_URL = process.env.PUBLIC_APP_URL || "https://booster-5imz.onrender.com";

const defaultStoreTemplate = (shopDomain, storeName = '') => ({
  id: shopDomain.replace(/\.myshopify\.com$/, '').replace(/[^a-zA-Z0-9_-]/g, '_'),
  shopDomain: shopDomain,
  storeName: storeName || shopDomain,
  email: '',
  currency: 'USD',
  currencySymbol: '$',
  accessToken: '',
  connectedAt: new Date().toISOString(),
  isActive: true,
  settings: {
    enableBooster: true,
    enablePopups: true,
    popupPosition: "bottom-left",
    popupDelay: 6,
    popupDuration: 5,
    enableVisitorCounter: true,
    minVisitors: 12,
    maxVisitors: 36,
    enableFreeShipping: true,
    freeShippingThreshold: 50,
    shippingCurrency: "$",
    enableCountdown: true,
    countdownMinutes: 15,
    enableSeoSchema: true,
    enableAutoIndexing: true,
    accentColor: "#2563eb",
    themeMode: "light"
  },
  stats: {
    totalVisitors: 0,
    pageViews: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    organicVisitors: 0,
    organicSharePercent: 0,
    conversionRate: 0,
    conversionUpliftPercent: 0,
    totalOrdersBoosted: 0,
    revenueGenerated: 0,
    popupImpressions: 0,
    popupClicks: 0,
    regions: {},
    recentEvents: []
  },
  realProducts: [],
  realOrders: [],
  keywords: [],
  articles: []
});

const initialMultiStoreData = {
  appConfig: {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    scopes: "read_products,write_products,read_content,write_content,read_orders,read_script_tags,write_script_tags",
    publicAppUrl: PUBLIC_URL
  },
  activeStoreId: "chandkali",
  stores: [
    defaultStoreTemplate("chandkali.myshopify.com", "USA BEAUTY STORE")
  ]
};

export function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Upgrade single-store data to multi-store if needed
      if (Array.isArray(parsed.stores)) {
        return {
          ...initialMultiStoreData,
          ...parsed,
          appConfig: {
            ...initialMultiStoreData.appConfig,
            ...(parsed.appConfig || {})
          }
        };
      } else if (parsed.connection && parsed.connection.shopDomain) {
        // Migrate legacy single-store record
        const migratedStore = {
          ...defaultStoreTemplate(parsed.connection.shopDomain, parsed.connection.storeDetails?.name),
          accessToken: parsed.connection.accessToken || '',
          settings: parsed.settings || defaultStoreTemplate('').settings,
          stats: parsed.stats || defaultStoreTemplate('').stats,
          realProducts: parsed.realProducts || [],
          realOrders: parsed.realOrders || [],
          keywords: parsed.keywords || [],
          articles: parsed.articles || []
        };
        const migratedData = {
          appConfig: initialMultiStoreData.appConfig,
          activeStoreId: migratedStore.id,
          stores: [migratedStore]
        };
        saveData(migratedData);
        return migratedData;
      }
    }
  } catch (err) {
    console.error('Error reading multi-store data, resetting:', err);
  }

  saveData(initialMultiStoreData);
  return initialMultiStoreData;
}

export function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

export function createStoreEntry(shopDomain, storeName = '') {
  return defaultStoreTemplate(shopDomain, storeName);
}
