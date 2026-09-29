const assert = require('node:assert/strict');
const path = require('node:path');

// Run inside an authenticated persistent Playwright session. No API writes,
// browser state injection, scrollIntoView or CSS injection are used for signoff.
module.exports = async ({ page, baseURL, outputDir, widths = [[1440,900],[1024,900],[768,900],[390,844],[320,720],[900,600]] }) => {
  const results = [];
  for (const [width,height] of widths) {
    await page.setViewportSize({width,height});
    for (const [route,selector] of [['/ai/chat','.ai-input'],['/chat/2','.composer']]) {
      await page.goto(baseURL + route);
      await page.locator(selector).waitFor();
      await page.locator('.el-loading-mask:visible').first().waitFor({state:'hidden'});
      await page.waitForFunction(() => scrollY === 0);
      const metrics = await page.locator(selector).evaluate(el => {
        const rect = el.getBoundingClientRect();
        const dock = document.querySelector('.tp-dock').getBoundingClientRect();
        const region = document.querySelector('.ai-chat,.room > main').getBoundingClientRect();
        const button = el.querySelector('button:last-child');
        const br = button.getBoundingClientRect();
        const hit = document.elementFromPoint(br.x + br.width / 2, br.y + br.height / 2);
        return { top:rect.top,bottom:rect.bottom,dockTop:dock.top,messageHeight:region.height,
          viewportHeight:innerHeight,scrollY,overflow:document.documentElement.scrollWidth > innerWidth,
          sendHit:!!hit && button.contains(hit) };
      });
      const result = {route,width,height,...metrics};
      results.push(result);
      await page.screenshot({path:path.join(outputDir,`layout-${width}-${height}-${route.replaceAll('/','_')}.png`),animations:'disabled'});
      assert.equal(metrics.scrollY,0,'Layout must work before document scrolling');
      assert(metrics.top >= 0 && metrics.bottom <= metrics.dockTop - 6,JSON.stringify(result));
      assert(metrics.messageHeight >= 60,'Messages need visible space: '+JSON.stringify(result));
      assert.equal(metrics.overflow,false,'No horizontal document overflow');
      assert.equal(metrics.sendHit,true,'Send button must be unobstructed');
    }
  }
  return results;
};
