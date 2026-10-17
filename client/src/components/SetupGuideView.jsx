import React from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  Search, 
  Sparkles,
  ArrowRight,
  Store,
  Globe,
  Radio,
  Server,
  Cloud
} from 'lucide-react';

export default function SetupGuideView({ onNavigate, onOpenConnect }) {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
          How to Make Your Booster 100% Live on Shopify
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Follow these practical steps to connect your real store, host the app 24/7 on the cloud, and activate the theme extension.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Phase 1: Connect Real Store */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800' }}>
                1
              </div>
              Connect Your Real Shopify Store (2 Minutes)
            </div>
            <button className="btn btn-blue" onClick={onOpenConnect} style={{ fontSize: '12px' }}>
              <Store size={14} /> Open Connect Form
            </button>
          </div>

          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
            To fetch your real store products and orders without any dummy data:
          </p>

          <ol style={{ paddingLeft: '22px', fontSize: '13px', color: '#334155', lineHeight: '1.9' }}>
            <li>Go to your <strong>Shopify Admin</strong> &gt; <strong>Settings</strong> &gt; <strong>Apps and sales channels</strong>.</li>
            <li>Click <strong>Develop apps</strong> &gt; <strong>Create an app</strong> (Name it <em>"Shopify Booster"</em>).</li>
            <li>Click <strong>Configure Admin API scopes</strong> and check:
              <br />
              <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#2563eb' }}>
                read_products, write_products, read_content, write_content, read_orders
              </code>
            </li>
            <li>Click <strong>Install app</strong> and copy your <strong>Admin API access token</strong> (starts with <code>shpat_...</code>).</li>
            <li>Click <strong>"Connect Live Store"</strong> in Booster, paste your store domain and token, and click Save!</li>
          </ol>
        </div>

        {/* Phase 2: Host 24/7 on Cloud */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800' }}>
                2
              </div>
              Host the Booster Server 24/7 on the Cloud (Free)
            </div>
            <span className="badge badge-green">Production Cloud URL</span>
          </div>

          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
            Your Shopify store needs a public HTTPS endpoint so shoppers can load the widgets anytime from anywhere in the world:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                <Cloud size={18} color="#2563eb" /> Option A: Deploy on Render or Railway
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.6 }}>
                1. Push your project to GitHub (<code>git push origin main</code>).<br />
                2. On Render.com or Railway.app, create a <strong>Web Service</strong> from your GitHub repo.<br />
                3. Build command: <code>npm run build</code>.<br />
                4. Start command: <code>node server/index.js</code>.<br />
                5. You get a free HTTPS link like <code>https://booster-app.onrender.com</code>.
              </p>
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                <Radio size={18} color="#10b981" /> Option B: Instant Tunnel for Local Dev
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.6 }}>
                To connect your live store to your machine right now without deploying:
              </p>
              <pre style={{ background: '#0f172a', color: '#34d399', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', marginTop: '6px' }}>
npx ngrok http 3005
              </pre>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Copy the generated HTTPS URL and set it as your Public App URL.
              </p>
            </div>
          </div>
        </div>

        {/* Phase 3: Enable Theme App Embed */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#8b5cf6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800' }}>
                3
              </div>
              Activate the App Embed in Your Live Shopify Theme
            </div>
            <span className="badge badge-purple">1-Click Toggle</span>
          </div>

          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
            The Booster uses official Shopify Online Store 2.0 App Embeds:
          </p>

          <ol style={{ paddingLeft: '22px', fontSize: '13px', color: '#334155', lineHeight: '1.9' }}>
            <li>In your Shopify Admin, go to <strong>Online Store</strong> &gt; <strong>Themes</strong>.</li>
            <li>Click <strong>Customize</strong> on your active theme (Dawn, Impulse, Prestige, etc.).</li>
            <li>Click the <strong>App Embeds</strong> tab on the left sidebar (puzzle icon).</li>
            <li>Find <strong>"Shopify Growth Booster"</strong> and toggle it <strong>ON</strong>.</li>
            <li>Under settings, set <strong>Growth Platform Backend URL</strong> to your live host URL.</li>
            <li>Click <strong>Save</strong> at the top right of the Shopify editor.</li>
          </ol>
        </div>

        {/* Phase 4: Live Order Webhook Setup */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800' }}>
                4
              </div>
              Real-Time Order Webhook (Automatic Social Proof)
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
            To show real-time purchase notifications automatically whenever a real shopper orders:
          </p>

          <ol style={{ paddingLeft: '22px', fontSize: '13px', color: '#334155', lineHeight: '1.9' }}>
            <li>Go to Shopify Admin &gt; <strong>Settings</strong> &gt; <strong>Notifications</strong>.</li>
            <li>Scroll down to <strong>Webhooks</strong> &gt; <strong>Create webhook</strong>.</li>
            <li>Event: <strong>Order creation</strong>.</li>
            <li>Format: <strong>JSON</strong>.</li>
            <li>URL: <code>https://YOUR-PUBLIC-URL/api/webhooks/orders/create</code>.</li>
            <li>Click <strong>Save</strong>. Every customer checkout will instantly trigger verified buyer popups!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
