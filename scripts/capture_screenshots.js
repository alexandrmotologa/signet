import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function clickButton(page, text) {
  return await page.evaluate((btnText) => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.textContent && b.textContent.includes(btnText));
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, text);
}

async function captureAll() {
  console.log('Launching headless browser via Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const imagesDir = path.resolve(__dirname, '../docs/images');

  // =========================================================================
  // 1. DESKTOP WORKSPACE SCREENSHOT (Clean view with placed annotations & dock)
  // =========================================================================
  {
    console.log('Capturing 1: Desktop Workspace...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1200));

    // Place Date badge and Checkmark
    await clickButton(page, 'Date');
    await new Promise(r => setTimeout(r, 400));
    await clickButton(page, '✓');
    await new Promise(r => setTimeout(r, 400));

    // Toggle Audit Trail
    await page.evaluate(() => {
      const cb = document.querySelector('input[type="checkbox"]');
      if (cb && !cb.checked) {
        cb.click();
      }
    });
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(imagesDir, 'screenshot_viewer.png'),
      fullPage: false,
    });
    console.log('Saved screenshot_viewer.png');
    await page.close();
  }

  // =========================================================================
  // 2. SIGNATURE PAD MODAL SCREENSHOT (Drawing + Handwriting tabs)
  // =========================================================================
  {
    console.log('Capturing 2: Signature Drawing & Handwriting Modal...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));

    await clickButton(page, 'Sign');
    await new Promise(r => setTimeout(r, 600));

    // Draw elegant signature curve on canvas
    await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      if (canvases.length > 1) {
        const sigCanvas = canvases[canvases.length - 1];
        const ctx = sigCanvas.getContext('2d');
        if (ctx) {
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#1d4ed8';
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(80, 110);
          ctx.bezierCurveTo(110, 40, 150, 40, 160, 100);
          ctx.bezierCurveTo(170, 140, 120, 160, 180, 140);
          ctx.bezierCurveTo(220, 120, 260, 80, 300, 120);
          ctx.bezierCurveTo(340, 150, 380, 100, 420, 110);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(110, 155);
          ctx.quadraticCurveTo(280, 175, 450, 145);
          ctx.stroke();
        }
      }
    });
    await new Promise(r => setTimeout(r, 400));

    await page.screenshot({
      path: path.join(imagesDir, 'screenshot_signature_pad.png'),
      fullPage: false,
    });
    console.log('Saved screenshot_signature_pad.png');
    await page.close();
  }

  // =========================================================================
  // 3. COMPANY STAMP & OFFICIAL SEAL MODAL SCREENSHOT
  // =========================================================================
  {
    console.log('Capturing 3: Company Stamp & Official Seal Modal...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));

    await clickButton(page, 'Seal');
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(imagesDir, 'screenshot_seal.png'),
      fullPage: false,
    });
    console.log('Saved screenshot_seal.png');
    await page.close();
  }

  // =========================================================================
  // 4. MULTI-PAGE THUMBNAILS DRAWER SCREENSHOT
  // =========================================================================
  {
    console.log('Capturing 4: Multi-page Thumbnails Drawer...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));

    await clickButton(page, 'Pages');
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({
      path: path.join(imagesDir, 'screenshot_thumbnails.png'),
      fullPage: false,
    });
    console.log('Saved screenshot_thumbnails.png');
    await page.close();
  }

  // =========================================================================
  // 5. LIVE CRYPTOGRAPHIC NOTARIZATION & VERIFICATION VIEW
  // =========================================================================
  {
    console.log('Capturing 5: Cryptographic Notarization Portal...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });

    const sampleRes = await fetch('http://localhost:8080/api/samples/nda');
    const sampleMeta = await sampleRes.json();

    const signRes = await fetch('http://localhost:8080/api/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        docId: sampleMeta.docId,
        placements: [
          {
            pageIndex: 1,
            normalizedX: 0.55,
            normalizedY: 0.65,
            normalizedWidth: 0.25,
            normalizedHeight: 0.08,
            type: 'signature',
            data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
          },
          {
            pageIndex: 1,
            normalizedX: 0.55,
            normalizedY: 0.78,
            normalizedWidth: 0.2,
            normalizedHeight: 0.04,
            type: 'date',
            text: '2026-09-12'
          }
        ],
        includeAuditCertificate: true,
        signer: {
          name: 'Alexander Motologa',
          username: 'alexandrmotologa'
        }
      })
    });

    const signData = await signRes.json();
    console.log('Notarized document hash:', signData.signedSha256);

    await page.goto(`http://localhost:8080/verify/${signData.signedSha256}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({
      path: path.join(imagesDir, 'screenshot_verification.png'),
      fullPage: false,
    });
    console.log('Saved screenshot_verification.png');
    await page.close();
  }

  // =========================================================================
  // 6. RESPONSIVE MOBILE TELEGRAM MINI APP SCREENSHOT
  // =========================================================================
  {
    console.log('Capturing 6: Mobile Telegram Mini App Mode...');
    const page = await browser.newPage();
    await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1200));

    await clickButton(page, 'Date');
    await new Promise(r => setTimeout(r, 400));
    await clickButton(page, '✓');
    await new Promise(r => setTimeout(r, 400));

    await page.screenshot({
      path: path.join(imagesDir, 'screenshot_mobile.png'),
      fullPage: false,
    });
    console.log('Saved screenshot_mobile.png');
    await page.close();
  }

  await browser.close();
  console.log('All authentic screenshots captured with high precision!');
}

captureAll().catch(err => {
  console.error('Screenshot capture script failed:', err);
  process.exit(1);
});
