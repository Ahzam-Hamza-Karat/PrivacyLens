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
    const { WebSocket } = await import('node:http');
    // Using simple ws or dynamic import ws if available, or Node global WebSocket if Node 22+
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

async function runVerification() {
  console.log('--- PrivacyLens MongoDB & UI Verification ---');

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

    console.log('Connected to Chrome DevTools Protocol.');

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log(`Navigating to ${FRONTEND_URL}...`);
    await cdp.send('Page.navigate', { url: FRONTEND_URL });
    await wait(2500);

    // Helper evaluation function
    async function evaluate(expression) {
      const res = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.value;
    }

    // Helper screenshot function
    async function captureScreenshot(filename) {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const filepath = path.join(SCREENSHOT_DIR, filename);
      fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
      const stats = fs.statSync(filepath);
      console.log(`📸 Captured: ${filename} (${stats.size.toLocaleString()} bytes)`);
    }

    // Check 1: Title and Header
    const title = await evaluate('document.title');
    console.log('Page Title:', title);

    // Check 2: Diagnostic Panel (Verify Card 3 for MongoDB)
    const diagCardsCount = await evaluate('document.querySelectorAll(".diagnostic-card").length');
    console.log('Diagnostic Cards Rendered:', diagCardsCount);

    const dbDiagTitle = await evaluate(
      'document.querySelector(".diagnostic-card:nth-child(3) .diagnostic-title")?.textContent'
    );
    console.log('Card 3 Diagnostic Title:', dbDiagTitle);

    // Scroll to diagnostic panel and screenshot
    await evaluate('document.getElementById("diagnostic")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(800);
    await captureScreenshot('02_diagnostic_panel.png');

    // Check 3: Saved Reports Section
    const savedSectionExists = await evaluate('Boolean(document.getElementById("saved-reports"))');
    console.log('Saved Reports Section Mounted:', savedSectionExists);

    const savedSectionTitle = await evaluate(
      'document.querySelector("#saved-reports .section-title")?.textContent'
    );
    console.log('Saved Reports Title:', savedSectionTitle);

    // Scroll to saved reports section and screenshot
    await evaluate('document.getElementById("saved-reports")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(800);
    await captureScreenshot('15_saved_reports_section.png');

    // Check 4: Load Sample Policy & Run Analysis
    console.log('Loading Sample Policy into Analyzer...');
    await evaluate('document.getElementById("btn-load-sample")?.click()');
    await wait(1000);

    const charCountText = await evaluate('document.getElementById("counter-text")?.textContent');
    console.log('Analyzer Capacity Counter:', charCountText);

    console.log('Triggering Analysis via #btn-analyze-policy...');
    await evaluate('document.getElementById("btn-analyze-policy")?.click()');
    await wait(3000);

    const findingsCount = await evaluate('document.querySelectorAll(".finding-card").length');
    console.log('Findings Rendered on Dashboard:', findingsCount);

    // Scroll to Report Dashboard
    await evaluate('document.getElementById("preview")?.scrollIntoView({ behavior: "instant", block: "start" })');
    await wait(800);

    // Check 5: Save Analysis Button
    const saveBtnExists = await evaluate('Boolean(document.getElementById("btn-save-analysis"))');
    console.log('Save to Database Button Present:', saveBtnExists);

    // Click Save to Database Button
    console.log('Opening Save to Database Modal...');
    await evaluate('document.getElementById("btn-save-analysis")?.click()');
    await wait(800);

    const modalTitle = await evaluate('document.getElementById("save-modal-title")?.textContent');
    console.log('Save Modal Title:', modalTitle);

    const consentCheckboxExists = await evaluate('Boolean(document.getElementById("checkbox-save-consent"))');
    console.log('Consent Checkbox Present:', consentCheckboxExists);

    // Capture Save Modal Screenshot
    await captureScreenshot('16_save_analysis_modal.png');

    // Test consent validation in modal
    const saveConfirmBtnDisabled = await evaluate(
      'document.getElementById("btn-confirm-save-analysis")?.disabled'
    );
    console.log('Save Confirm Button Disabled before consent:', saveConfirmBtnDisabled);

    // Check consent checkbox
    await evaluate('document.getElementById("checkbox-save-consent")?.click()');
    await wait(300);

    const saveConfirmBtnEnabled = await evaluate(
      '!document.getElementById("btn-confirm-save-analysis")?.disabled'
    );
    console.log('Save Confirm Button Enabled after consent:', saveConfirmBtnEnabled);

    // Close modal
    await evaluate('document.querySelector(".save-modal-close")?.click()');
    await wait(500);

    console.log('--- Verification Completed Successfully! ---');
    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
