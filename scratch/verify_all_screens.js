import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve('docs/screenshots');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CdpConnection {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const WsClass = globalThis.WebSocket;
    if (!WsClass) {
      throw new Error('WebSocket not available on globalThis');
    }
    this.ws = new WsClass(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function runScreenshots() {
  console.log('--- Capturing All 21 Verifiable Screenshots via CDP ---');

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    '--hide-scrollbars',
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 20; i++) {
      try {
        targets = await getJson(`http://localhost:${PORT}/json`);
        if (targets && targets.length > 0) break;
      } catch {
        await wait(250);
      }
    }

    if (!targets || targets.length === 0) {
      throw new Error('Failed to connect to Chrome debugging endpoint');
    }

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    const cdp = new CdpConnection(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    async function evaluate(expression) {
      const res = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.value;
    }

    async function setViewport(width, height) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });
      await wait(300);
    }

    async function capture(filename) {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const filepath = path.join(SCREENSHOT_DIR, filename);
      fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
      const stats = fs.statSync(filepath);
      console.log(`📸 [${filename}] (${stats.size.toLocaleString()} bytes)`);
    }

    // 1. Initial Desktop Load (1440x900)
    await setViewport(1440, 900);
    console.log(`Navigating to ${FRONTEND_URL}...`);
    await cdp.send('Page.navigate', { url: FRONTEND_URL });
    await wait(2500);

    // Screen 1: Hero & Navigation
    await evaluate('window.scrollTo(0, 0)');
    await wait(500);
    await capture('01_hero_and_navigation.png');

    // Screen 1b: Clause Showcase Selection
    await evaluate('document.querySelectorAll(".switcher-pill")[1]?.click()');
    await wait(600);
    await capture('01b_clause_showcase_selection.png');

    // Screen 3: Workspace Empty
    await evaluate('document.getElementById("analyzer")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(600);
    await capture('03_workspace_empty.png');

    // Screen 4: Workspace with Sample Policy Loaded
    await evaluate('document.getElementById("btn-load-sample")?.click()');
    await wait(800);
    await capture('04_workspace_sample_loaded.png');

    // Trigger Analysis
    console.log('Triggering policy analysis...');
    await evaluate('document.getElementById("btn-analyze-policy")?.click()');
    await wait(3000);

    // Screen 5: Doughnut Distribution Chart & Executive Metrics
    await evaluate('document.getElementById("preview")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(800);
    await capture('05_doughnut_distribution_chart.png');

    // Screen 6: Findings Search & Filter Controls
    await evaluate('const inp = document.querySelector(".search-input"); if (inp) { inp.value = "cookie"; inp.dispatchEvent(new Event("input", { bubbles: true })); }');
    await wait(600);
    await capture('06_findings_search_and_filters.png');

    // Reset search filter
    await evaluate('document.querySelector(".btn-clear-search")?.click()');
    await wait(400);

    // Screen 7: Report Preview & Findings (Cards View)
    await evaluate('document.querySelector(".category-card")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(600);
    await capture('07_report_preview_and_findings.png');

    // Screen 7b: Dense Audit Table View
    await evaluate('document.getElementById("btn-view-table")?.click()');
    await wait(600);
    await capture('07b_dense_audit_table_view.png');

    // Switch back to Cards view
    await evaluate('document.getElementById("btn-view-cards")?.click()');
    await wait(400);

    // Screen 8: Verbatim Evidence & Technical Citation Details
    await evaluate('document.querySelector(".finding-actions-row button")?.click()');
    await wait(600);
    await capture('08_verbatim_evidence_citation.png');

    // Screen 15: My Saved Reports Section
    await evaluate('document.getElementById("saved-reports")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(600);
    await capture('15_saved_reports_section.png');

    // Screen 16: Save Analysis Modal
    await evaluate('document.getElementById("preview")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(400);
    await evaluate('document.getElementById("btn-save-analysis")?.click()');
    await wait(800);
    await capture('16_save_analysis_modal.png');
    // Close modal
    await evaluate('document.querySelector(".save-modal-close")?.click()');
    await wait(400);

    // Screen 9: Cookie Center Assistant
    await evaluate('document.getElementById("cookie-center")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(600);
    await capture('09_cookie_center_assistant.png');

    // Screen 10: Cookie Simulator
    await evaluate('const tabs = document.querySelectorAll(".cookie-nav-tab"); if (tabs.length > 1) tabs[1].click();');
    await wait(600);
    await capture('10_cookie_center_simulator.png');

    // Screen 11: Cookie Preference Matrix Table
    await evaluate('document.querySelector(".sim-preference-table")?.scrollIntoView({ behavior: "instant", block: "center" })');
    await wait(600);
    await capture('11_cookie_preference_matrix.png');

    // Screen 12: Policy Version Comparison Diff
    await evaluate('document.getElementById("version-diff")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(600);
    await capture('12_policy_comparison_diff.png');

    // Screen 13: Policy Chatbot Fallback
    await evaluate('document.getElementById("chatbot")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(600);
    await capture('13_policy_chatbot_fallback.png');

    // Screen 2: Diagnostic Panel (Technical Specs & System Health)
    await evaluate('document.getElementById("diagnostic")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(600);
    await capture('02_diagnostic_panel.png');

    // Screen 14: Print Preview Layout
    console.log('Emulating print media...');
    await cdp.send('Emulation.setEmulatedMedia', { media: 'print' });
    await wait(600);
    await capture('14_print_preview_layout.png');
    await cdp.send('Emulation.setEmulatedMedia', { media: '' });
    await wait(400);

    // Responsive Views
    // 19. Laptop Viewport (1366x768)
    await setViewport(1366, 768);
    await evaluate('window.scrollTo(0, 0)');
    await wait(600);
    await capture('responsive_laptop_view.png');

    // 20. Tablet Viewport (768x1024)
    await setViewport(768, 1024);
    await evaluate('window.scrollTo(0, 0)');
    await wait(600);
    await capture('responsive_tablet_view.png');

    // 21. Mobile Viewport (375x812)
    await setViewport(375, 812);
    await evaluate('window.scrollTo(0, 0)');
    await wait(600);
    await capture('responsive_mobile_view.png');

    console.log('--- All 21 Screenshots Successfully Captured! ---');
    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

runScreenshots().catch((err) => {
  console.error('Screenshot run failed:', err);
  process.exit(1);
});

