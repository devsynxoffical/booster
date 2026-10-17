import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

const initialCleanData = {
  connection: {
    isConnected: false,
    shopDomain: "",
    accessToken: "",
    apiKey: "",
    apiSecret: "",
    publicAppUrl: "http://localhost:3005",
    storeDetails: {
      name: "Connect Your Shopify Store",
      email: "",
      currency: "USD",
      currencySymbol: "$",
      domain: ""
    }
  },
  settings: {
    storeName: "My Shopify Store",
    storeUrl: "",
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
    themeMode: "light",
    useRealOrdersOnly: true
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
    revenueGenerated: 0.00,
    popupImpressions: 0,
    popupClicks: 0,
    regions: {},
    recentEvents: []
  },
  realProducts: [],
  realOrders: [],
  keywords: [],
  articles: []
};

export function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      // Merge with default schema in case new fields were added
      return {
        ...initialCleanData,
        ...parsed,
        connection: { ...initialCleanData.connection, ...(parsed.connection || {}) },
        settings: { ...initialCleanData.settings, ...(parsed.settings || {}) },
        stats: { ...initialCleanData.stats, ...(parsed.stats || {}) }
      };
    }
  } catch (err) {
    console.error('Error reading data file, using clean defaults:', err);
  }
  saveData(initialCleanData);
  return initialCleanData;
}

export function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data:', err);
  }
}
