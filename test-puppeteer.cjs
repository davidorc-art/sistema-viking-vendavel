const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://localhost:3000/booking?p=David', { waitUntil: 'networkidle0' });
  
  // Fill step 1
  await page.type('input[placeholder="Nome Completo"]', 'Test User');
  await page.type('input[placeholder="Telefone (DDD)"]', '11999999999');
  await page.type('input[placeholder="CPF"]', '12345678901');
  await page.type('input[placeholder="DD/MM/AAAA"]', '01/01/2000');
  await page.type('input[placeholder="Cidade"]', 'Sao Paulo');
  await page.type('input[placeholder="@instagram"]', '@test');
  await page.type('input[placeholder="Quem te indicou?"]', 'Nobody');
  await page.type('textarea', 'None');
  
  await page.screenshot({ path: 'screenshot-before.png' });
  
  // Click Próximo
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const nextBtn = buttons.find(b => b.textContent.includes('Próximo'));
    if (nextBtn) nextBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'screenshot-after.png' });
  
  const html = await page.content();
  console.log('HTML AFTER NEXT:', html);
  
  await browser.close();
})();
