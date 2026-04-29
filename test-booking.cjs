const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const profId = '663bc647-73d7-4df3-bcbd-7de8e17ddb46';
  await page.goto(`http://localhost:3000/booking?p=${profId}`);
  await new Promise(r => setTimeout(r, 5000));
  const h2 = await page.evaluate(() => {
    const h2s = Array.from(document.querySelectorAll('h2'));
    return h2s.map(h => h.textContent).join(' | ');
  });
  console.log("H2s:", h2);
  
  await browser.close();
})();
