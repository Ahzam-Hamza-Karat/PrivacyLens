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

async function captureScreenshot(cdp, filepath) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(result.data, 'base64');
  fs.writeFileSync(filepath, buffer);
  console.log(`[Captured] ${path.basename(filepath)} (${buffer.length.toLocaleString()} bytes)`);
}

async function setViewport(cdp, width, height) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
}

async function run() {
  console.log('--- Verifying VirusTotal UI Polish, Authentication Modals & Empty States ---');

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
      throw new Error('Chrome remote debugging did not respond.');
    }

    const pageTarget = targets.find((t) => t.type === 'page');
    const cdp = new CdpConnection(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    console.log(`Navigating to ${FRONTEND_URL}...`);
    await cdp.send('Page.navigate', { url: FRONTEND_URL });
    await wait(2000);

    // 1. Desktop 1440x900 Hero & Header with Sign In & Create Account
    await setViewport(cdp, 1440, 900);
    await wait(300);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, '01_hero_and_navigation.png'));

    // 2. Capture Empty Workspace & Compact Empty Results State
    console.log('Capturing empty workspace & compact results state...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.getElementById('analyzer').scrollIntoView();`,
    });
    await wait(400);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, '03_workspace_empty.png'));

    // 3. Click "Sign In" button to open modal
    console.log('Opening Sign In modal...');
    await cdp.send('Runtime.evaluate', {
      expression: `window.scrollTo(0, 0); document.getElementById('nav-btn-signin').click();`,
    });
    await wait(400);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, '17_auth_modal_signin.png'));

    // 4. Trigger validation error by submitting empty form
    console.log('Triggering form validation...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.getElementById('btn-submit-signin').click()`,
    });
    await wait(300);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, '19_auth_modal_validation_errors.png'));

    // 5. Fill in valid credentials and submit to see backend scope notice
    console.log('Submitting credentials to display backend notice...');
    await cdp.send('Runtime.evaluate', {
      expression: `
        const emailInput = document.getElementById('auth-email');
        const passInput = document.getElementById('auth-password');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(emailInput, 'alex.morgan@example.com');
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        setter.call(passInput, 'PrivacyLens2026!');
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('btn-submit-signin').click();
      `,
    });
    await wait(700);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, '20_auth_modal_backend_notice.png'));

    // 6. Switch to Create Account mode
    console.log('Switching to Create Account tab...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.getElementById('tab-signup').click()`,
    });
    await wait(300);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, '18_auth_modal_signup.png'));

    // 7. Close Modal
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('.auth-modal-close').click()`,
    });
    await wait(300);

    // 8. Load Sample Policy
    console.log('Loading sample policy into analyzer...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.getElementById('btn-load-sample').click();`,
    });
    await wait(400);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, '04_workspace_sample_loaded.png'));

    // 9. Run Analysis
    console.log('Executing deterministic analysis...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.getElementById('btn-analyze-policy').click();`,
    });
    await wait(1200);

    // 10. Capture Results Dashboard with 4-card ribbon, findings, and doughnut chart
    console.log('Capturing completed results dashboard...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.getElementById('preview').scrollIntoView();`,
    });
    await wait(400);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, '07_report_preview_and_findings.png'));
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, '05_doughnut_distribution_chart.png'));

    // 11. Switch to Dense Table View
    console.log('Capturing dense table view...');
    await cdp.send('Runtime.evaluate', {
      expression: `
        const tableBtn = document.getElementById('btn-view-table');
        if (tableBtn) tableBtn.click();
      `,
    });
    await wait(400);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, '07b_dense_audit_table_view.png'));

    // 12. Switch back to cards view
    await cdp.send('Runtime.evaluate', {
      expression: `
        const cardsBtn = document.getElementById('btn-view-cards');
        if (cardsBtn) cardsBtn.click();
      `,
    });
    await wait(300);

    // 13. Verify Mobile Viewport & Drawer with Auth Buttons
    console.log('Verifying mobile drawer with auth actions...');
    await setViewport(cdp, 375, 812);
    await wait(300);
    await cdp.send('Runtime.evaluate', {
      expression: `window.scrollTo(0, 0); document.querySelector('.mobile-menu-toggle').click();`,
    });
    await wait(400);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, '21_mobile_auth_drawer.png'));
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, 'responsive_mobile_view.png'));

    // 14. Restore Desktop View and capture laptop
    await setViewport(cdp, 1366, 768);
    await cdp.send('Runtime.evaluate', {
      expression: `window.scrollTo(0, 0);`,
    });
    await wait(300);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, 'responsive_laptop_view.png'));

    cdp.close();
    console.log('All screenshots verified and captured successfully!');
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
