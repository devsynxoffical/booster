# DEVSYNX Growth Booster — Multi-Store SaaS Documentation

> **Official Operating Guide & Architecture Reference**  
> **Platform Version:** 2.0.0 (Adminator Light Edition)  
> **Cloud Production URL:** [https://booster-5imz.onrender.com](https://booster-5imz.onrender.com)  

---

## 1. System Architecture Overview

The **DEVSYNX Growth Booster** operates under a dual-surface multi-tenant architecture designed to strictly separate the **SaaS Master Agency Panel** from the **Client Merchant Experience**:

```
                              ┌────────────────────────────────────────┐
                              │     DEVSYNX Master Admin Panel         │
                              │  (booster-5imz.onrender.com)           │
                              │     * Password Protected *             │
                              └──────────────────┬─────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
     ┌───────────────────────────┐                               ┌───────────────────────────┐
     │  Client Store 1 (Shopify) │                               │  Client Store 2 (Shopify) │
     │  USA BEAUTY STORE         │                               │  (Future Client Brand)    │
     │  chandkali.myshopify.com  │                               │  brand.myshopify.com      │
     │                           │                               │                           │
     │  • Storefront Embed       │                               │  • Storefront Embed       │
     │  • Live Visitor Telemetry │                               │  • Live Visitor Telemetry │
     │  • Verified Sales Popups  │                               │  • Verified Sales Popups  │
     │  • In-Shopify Dashboard   │                               │  • In-Shopify Dashboard   │
     └───────────────────────────┘                               └───────────────────────────┘
```

1. **Client Mode (Inside Shopify Admin):**
   * Automatically activated when loaded inside Shopify Admin or with store query parameter `?shop=...`.
   * Displays the store's white-labeled dashboard: Live Visitors, Pageviews, Organic Traffic (Google, Bing, TikTok, Instagram, Pinterest), and Boosted Orders.
   * Gives the merchant control over **CRO Widgets** (popup delays, countdown timer, free shipping threshold).
   * **Zero Admin Junk:** All multi-store management buttons, API keys, and connection banners are completely hidden from the merchant.

2. **Master Admin Mode (Devsynx Agency Portal):**
   * Accessed by visiting `https://booster-5imz.onrender.com` directly.
   * **Password Protected:** Requires master admin authentication.
   * Full control to switch stores, onboard new stores, update API credentials, and review global platform analytics.

---

## 2. Master Admin Access & Password Security

### Default Master Password
```text
devsynx2026
```

* **To Unlock:** Open [https://booster-5imz.onrender.com](https://booster-5imz.onrender.com), enter the password, and click **Unlock Admin Panel**.
* **To Lock:** Click the **Lock** button in the top right navbar to lock the session immediately.
* **To Change the Password:** Send a POST request to `/api/admin/change-password` or edit `adminPassword` in `server/data.json` / Render Environment Variables (`ADMIN_PASSWORD`).

---

## 3. How to Connect Any Client Store (In 60 Seconds)

You can onboard unlimited client Shopify stores with **zero fees** and **zero Shopify review delays**.

### Method A: The 1-Line Snippet (Fastest & 100% Reliable)

1. Open your client's Shopify Admin:
   * Go to **Online Store** ➔ **Themes**.
   * Click **`...`** (three dots) on the active theme ➔ **Edit code**.
   * Open `layout/theme.liquid`.
2. Scroll to the `<head>` section and paste this single line right before `</head>`:
   ```html
   <script src="https://booster-5imz.onrender.com/extensions/assets/booster.js" defer></script>
   ```
3. Click **Save**.

**That is all!** The storefront immediately starts recording live visits, organic traffic sources, and displaying conversion booster widgets.

---

### Method B: Connect Real Orders & Products via Token

To sync real product images and verified purchase orders into the client's social proof popups:

1. In the client's Shopify Admin:
   * Go to **Settings** ➔ **Apps and sales channels** ➔ **Develop apps** (or *App development*).
   * Click **Create an app** ➔ Name it `Growth Booster`.
   * Under **Configure Admin API scopes**, check:
     * `read_products`
     * `read_orders`
     * `read_content`
   * Click **Save** ➔ **Install app**.
   * Copy the **Admin API access token** (`shpat_...`).
2. In your Devsynx Master Dashboard:
   * Open [https://booster-5imz.onrender.com](https://booster-5imz.onrender.com).
   * Click **+ Add / Switch Store** ➔ Click **Store Access Token** tab.
   * Enter the store domain (e.g., `chandkali.myshopify.com`) and paste the `shpat_...` token.
   * Click **Add Store**.

---

## 4. Conversion Booster Widgets (CRO)

All widgets are dynamically managed and require zero code edits from the client:

| Widget | Purpose | Customization Options |
| :--- | :--- | :--- |
| **Recent Sales Popups** | Verified social proof notifications showing real customer purchases. | Delay (seconds), Duration, Position (Bottom-Left / Bottom-Right), Theme (Light / Dark). |
| **Live Shopper Scarcity** | Real-time active shopper counter displayed on product pages. | Min/Max visitors, Accent color. |
| **Free Shipping Bar** | Dynamic progress bar motivating customers to reach the free shipping goal. | Target threshold (e.g. $50), Currency symbol, Live cart refresh. |
| **Urgency Countdown Timer** | High-converting countdown timer creating scarcity on checkout/cart. | Minutes duration, Urgency text. |
| **Organic Traffic Tracker** | Zero-latency attribution capturing Google, Bing, TikTok, Instagram, and Pinterest referrers. | Automatic detection on pageview. |

---

## 5. Live Store Case: USA BEAUTY STORE (`chandkali.myshopify.com`)

* **Store Handle:** `chandkali.myshopify.com`
* **Custom Domain:** `usabeautystore.com`
* **Currency:** USD (`$`)
* **Status:** Verified Active & Live
* **Storefront Embed:** `<script src="https://booster-5imz.onrender.com/extensions/assets/booster.js" defer></script>`
* **Merchant App View:** `admin.shopify.com/store/chandkali/apps/growth-booster-sales-cro-1`

---

## 6. Server Endpoints Reference

* `GET /api/stats?shop={shop}` — Fetches real-time store metrics (visitors, pageviews, organic share, orders).
* `GET /api/config?shop={shop}` — Returns store configuration for CRO widgets.
* `POST /api/config?shop={shop}` — Updates widget thresholds, colors, and timings.
* `POST /api/public/record-event` — Storefront telemetry hook recording visits, clicks, and impressions.
* `GET /api/public/recent-orders?shop={shop}` — Returns real verified store purchases for social proof popups.
* `POST /api/admin/verify-password` — Validates the master admin password for Devsynx agency management.
