import { useState } from "react";
import { Link } from "react-router-dom";

const displayModes = [
  ["bell", "Bell"],
  ["banner", "Banner"],
  ["both", "Bell and banner"]
];

const positions = [
  ["bottom-right", "Bottom right"],
  ["bottom-left", "Bottom left"]
];

function normalizeOrigin(value: string): string {
  try {
    const parsed = new URL(value);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

export function WidgetSetup() {
  const [origin, setOrigin] = useState(import.meta.env.DEV ? "http://localhost:3000" : window.location.origin);
  const [trigger, setTrigger] = useState("bell");
  const [position, setPosition] = useState("bottom-right");
  const [message, setMessage] = useState("");
  const url = normalizeOrigin(origin);
  const snippet = url
    ? `<script\n  src="${url}/widget.js"\n  data-position="${position}"\n  data-color="#3659e3"\n  data-trigger="${trigger}"\n  async\n></script>`
    : "Enter a valid HTTP or HTTPS instance URL to generate your embed code.";

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setMessage("Embed code copied.");
    } catch {
      setMessage("Copy wasn't available. Select the code below and copy it manually.");
    }
  }

  return (
    <section className="setup-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Connect your product</span>
          <h1>One small script. A direct line.</h1>
          <p>Add Ding to your app so your users can discover what changed.</p>
        </div>
      </div>

      <div className="setup-layout">
        <div className="form-panel">
          <div className="panel-heading"><h2>Configure your widget</h2></div>
          <label>
            Ding instance URL
            <input
              type="url"
              value={origin}
              onChange={(event) => { setOrigin(event.target.value); setMessage(""); }}
              aria-invalid={!url}
              aria-describedby="origin-help"
            />
          </label>
          <p id="origin-help" className="setup-help">
            Use the public URL of your Ding server. In local development this is usually http://localhost:3000. Use HTTPS in production.
          </p>

          <div className="field-row">
            <label>
              Display mode
              <select value={trigger} onChange={(event) => setTrigger(event.target.value)}>
                {displayModes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              Position
              <select value={position} onChange={(event) => setPosition(event.target.value)}>
                {positions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>

          <div className="embed-heading">
            <h2>Your embed code</h2>
            <button className="ghost small" disabled={!url} onClick={copy}>Copy code</button>
          </div>
          <p className="setup-help">This creates the snippet in your browser. It does not verify that the widget is installed.</p>
          <pre className="embed-code"><code>{snippet}</code></pre>
          <p className="copy-status" role="status">{message}</p>
        </div>

        <aside className="setup-instructions">
          <span className="eyebrow">Finish connecting</span>
          <ol>
            <li>
              <strong>Paste into your app.</strong>
              <p>Add the script before the closing body tag in your application's shared layout.</p>
            </li>
            <li>
              <strong>Publish your first update.</strong>
              <p>The widget displays published announcements. Drafts stay in your dashboard.</p>
              <Link to="/new">Write an announcement →</Link>
            </li>
            <li>
              <strong>Check it as a reader.</strong>
              <p>Open your app, click the bell, and expand an update. Check the dashboard for activity.</p>
            </li>
          </ol>
          <a href="https://dingwidget.com/docs/embedding/" target="_blank" rel="noreferrer">Read the embedding guide ↗</a>
        </aside>
      </div>
    </section>
  );
}
