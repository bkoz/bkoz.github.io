const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox']
  });

  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[${type.toUpperCase()}] ${text}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    console.log('[REQUEST FAILED]', request.url(), request.failure().errorText);
  });

  console.log('Loading page...');
  await page.goto('http://localhost:8000/web_player.html', { waitUntil: 'networkidle2' });

  console.log('\nPage loaded. Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\nClicking play button...');
  await page.click('#playBtn');

  console.log('\nWaiting 10 seconds to see if playback starts...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('\nClosing browser...');
  await browser.close();
})();
