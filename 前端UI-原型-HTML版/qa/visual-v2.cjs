// V2 visual acceptance: screenshots, responsive layouts, and external resource audit.
const {chromium}=require('playwright');
const {pathToFileURL}=require('url');
const path=require('path'),fs=require('fs');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'v2');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge',args:['--disable-gpu']});
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const page=await context.newPage();
 const errors=[],external=[],overflow=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
 const scenes=[['index','home','首页'],['index','ai/chat','AI学习'],['index','activity','活动列表'],['index','activity/detail/1','活动详情'],['index','idle','闲置互换'],['index','social','校园动态'],['index','ai/wrong','错题本'],['index','login','登录'],['index','profile','个人中心'],['admin','dashboard','管理总览'],['admin','audit/activity','内容审核']];
 for(const width of [1440,1024,820,768,390,360]){
   await page.setViewportSize({width,height:width>760?1000:844});
   for(const [file,route,name] of scenes){
     await page.goto(pathToFileURL(path.join(root,file+'.html')).href+'#/'+route);
     await page.waitForTimeout(60);
     const bad=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,broken:[...document.images].filter(x=>!x.hidden&&x.getAttribute('src')&&x.complete&&!x.naturalWidth).map(x=>x.src)}));
     if(bad.overflow)overflow.push({width,route:file+'/'+route});
     errors.push(...bad.broken.map(x=>'Image failed '+x));
     if(width===1440||width===390)await page.screenshot({path:path.join(out,name+(width===390?'-手机':'-桌面')+'.png'),fullPage:true});
   }
 }
 await page.setViewportSize({width:1440,height:1000});
 for(const route of ['home','ai/chat','activity/detail/1']){
   await page.goto(pathToFileURL(path.join(root,'index.html')).href+'#/'+route);
   await page.evaluate(()=>{state.theme='dark';save();render();});
   await page.screenshot({path:path.join(out,route.replaceAll('/','-')+'-深色.png'),fullPage:true});
 }
 const result={version:'V2',checkedAt:new Date().toISOString(),viewportWidths:[1440,1024,820,768,390,360],visualRoutes:scenes.length,layoutChecks:scenes.length*6,errors,overflow,externalRequests:[...new Set(external)]};
 fs.writeFileSync(path.join(out,'visual-report.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 await browser.close();
 if(errors.length||overflow.length||external.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
