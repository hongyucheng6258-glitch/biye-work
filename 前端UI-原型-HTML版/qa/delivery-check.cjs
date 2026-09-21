const {chromium}=require('playwright');
const {pathToFileURL,fileURLToPath}=require('url');
const path=require('path'),fs=require('fs');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const browser=await chromium.launch({headless:true,channel:'msedge',args:['--disable-gpu']});
 const page=await browser.newPage();const errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  await page.goto(pathToFileURL(path.join(root,'交付导航.html')).href);
  const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),links:[...document.querySelectorAll('a[href]')].map(a=>a.href)}));
  const missing=state.links.filter(u=>u.startsWith('file:')&&!fs.existsSync(fileURLToPath(new URL(u))));
  checks.push({width,overflow:state.overflow,brokenImages:state.broken,missingLinks:missing});
 }
 const report={checkedAt:new Date().toISOString(),errors,checks};
 fs.writeFileSync(path.join(__dirname,'v2','delivery-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));await browser.close();
 if(errors.length||checks.some(c=>c.overflow||c.brokenImages.length||c.missingLinks.length))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
