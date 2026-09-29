const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('E:/work/毕业设计UI原型/.local-browser/node_modules/playwright');
const phase = process.argv[2] || 'after';
const output = 'E:/work/毕业设计UI原型/.local-browser/compact-dock';
fs.mkdirSync(output, { recursive: true });
const report = { phase, measurements: [], actions: [], errors: [] };
const expected = ['发现', '活动', '学习', '生活', '我的', '全部'];
async function measure(page, width, theme, pathname = '/search?q='+encodeURIComponent('数学')) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('http://localhost:15173'+pathname);
  await page.locator('.tp-dock').waitFor();
  await page.locator('.el-loading-mask:visible').waitFor({state:'hidden'});
  await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const result = await page.evaluate(({width,theme,pathname})=>{
    const dock=document.querySelector('.tp-dock');
    const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    return {width,theme,pathname,dock:rect(dock),bottomGap:innerHeight-dock.getBoundingClientRect().bottom,shadow:getComputedStyle(dock).boxShadow,overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...dock.children].map(node=>({text:node.textContent,box:rect(node),href:node.getAttribute('href')}))};
  },{width,theme,pathname});
  report.measurements.push(result);
  return result;
}
function validate(m) {
  assert(!m.overflow,'Dock causes horizontal overflow');
  assert(m.dock.height<=56,`Navigation is too tall: ${m.dock.height}px`);
  assert(m.dock.width<=434,'Desktop dock is wider than needed');
  assert(m.bottomGap<=10,'Excessive bottom gap blocks extra reading space');
  assert.deepEqual(m.buttons.map(b=>b.text),expected,'All six original entries must remain');
  for(const b of m.buttons){ assert(b.box.height>=44,'Touch target too short'); assert(b.box.width>=44,'Touch target too narrow'); assert(b.box.x>=m.dock.x&&b.box.right<=m.dock.right,'Entry exceeds dock'); }
}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
   const context=await browser.newContext({reducedMotion:'reduce'});
   const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
   if(phase==='before') {
     const m=await measure(page,1440,'light');
     await page.screenshot({path:path.join(output,'before-desktop.png')});
     validate(m);
   }else{
     for(const width of [320,390,780,1440,1920])for(const theme of ['light','dark']){
       const m=await measure(page,width,theme);validate(m);
       if([390,1440].includes(width))await page.screenshot({path:path.join(output,`after-${width}-${theme}.png`)});
       await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
       const footer=await page.evaluate(()=>{
         const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};};
         return {dock:rect(document.querySelector('.tp-dock')),links:[...document.querySelectorAll('.footer-links > *')].map(rect)};
       });
       for(const link of footer.links)assert(link.bottom<=footer.dock.y,'Footer function is obscured at end of scroll');
       report.actions.push(`Footer readable ${width}/${theme}`);
       await page.locator('.tp-dock-all').click();
       const dialog=page.getByRole('dialog',{name:'全部校园功能'});await dialog.waitFor();
       assert.deepEqual(await dialog.locator('.nav-link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))),['/','/campus-3d','/activity','/idle','/lostfound','/partner','/qa','/social','/draw-guess','/notice','/message','/chat','/ai/chat','/ai/code','/ai/wrong'],'Full service menu lost entries');
       await dialog.getByRole('button',{name:'收起导航',exact:true}).click();await dialog.waitFor({state:'hidden'});
       report.actions.push(`Full service menu opens/closes ${width}/${theme}`);
     }
     for(const [label,target] of [['发现','/'],['活动','/activity'],['生活','/idle']]) {
       await page.locator('.tp-dock').getByRole('link',{name:label,exact:true}).click();
       await page.waitForURL(url=>url.pathname===target);
       await page.waitForFunction(()=>window.scrollY===0);
       assert.equal(await page.locator('.tp-dock > a.active').textContent(),label);
       report.actions.push(`Original navigation ${label}`);
     }
     await page.goto('http://localhost:15173/search?q='+encodeURIComponent('数学'));
     await page.locator('.tp-dock').getByRole('link',{name:'学习',exact:true}).click();
     await page.waitForURL(url=>url.pathname==='/login');
     assert.equal(new URL(page.url()).searchParams.get('redirect'),'/ai/chat');report.actions.push('Learning keeps login redirect');
     await page.goto('http://localhost:15173/search?q='+encodeURIComponent('数学'));
     await page.locator('.tp-dock').getByRole('link',{name:'我的',exact:true}).click();
     await page.waitForURL(url=>url.pathname==='/login');
     assert.equal(new URL(page.url()).searchParams.get('redirect'),'/profile');report.actions.push('Profile keeps login redirect');
     assert.deepEqual(report.errors,[],'Browser runtime errors');
     console.log(`PASS: ${report.measurements.length} layout measurements and ${report.actions.length} footer/menu/navigation checks; six original entries, >=44px targets, no browser errors.`);
   }
 }finally{fs.writeFileSync(path.join(output,phase+'.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});