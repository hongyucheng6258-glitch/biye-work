const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('E:/work/毕业设计UI原型/.local-browser/node_modules/playwright');
const phase=process.argv[2]||'after';
const output='E:/work/毕业设计UI原型/.local-browser/search-preview';
fs.mkdirSync(output,{recursive:true});
const report={phase,measurements:[],actions:[],errors:[],limits:['Real math search is read-only. Four-module image/error/empty/long cases are browser fixtures.']};
let mode='data';
const realImage='/images/campus-v2.webp';
const records=[{id:42,title:'数学学习与校园分享',content:'数学学习记录',location:'图书馆',nickname:'校园同学',category:'教材书籍',images:JSON.stringify([realImage])},{id:43,title:'数学交流',content:'数学讨论',location:'教学楼',nickname:'校园同学',category:'教材书籍',imageList:[realImage]}];
async function measure(page,kind,width,theme){
  await page.setViewportSize({width,height:1000});
  await page.goto('http://localhost:15173/search?q='+encodeURIComponent('数学'));
  await page.locator('.result-sections').waitFor();
  await page.locator('.el-loading-mask:visible').waitFor({state:'hidden'});
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const result=await page.evaluate(({kind,width,theme})=>{
    const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    return {kind,width,theme,overflow:document.documentElement.scrollWidth>innerWidth,groups:[...document.querySelectorAll('.result-section')].map(section=>({label:section.querySelector('h2').textContent,items:[...section.querySelectorAll('.result-list > button')].map(button=>({box:rect(button),text:button.textContent,cover:button.querySelector('.search-result-cover')&&rect(button.querySelector('.search-result-cover')),title:rect(button.querySelector('strong')),meta:button.querySelector('.result-meta')?.textContent,img:button.querySelector('.search-result-cover img')?.getAttribute('src')}))})),marks:document.querySelectorAll('.result-list mark').length};
  },{kind,width,theme});
  report.measurements.push(result);return result;
}
async function visibleImages(page){
  const covers=page.locator('.search-result-cover');
  for(let i=0;i<await covers.count();i++){
    await covers.nth(i).scrollIntoViewIfNeeded();
    await covers.nth(i).locator('img').evaluateAll(async nodes=>{await Promise.all(nodes.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});})));});
  }
}
function validate(m){
  assert(!m.overflow,m.kind+'/'+m.width+' horizontal overflow');
  for(const group of m.groups)for(const row of group.items){
    assert(row.cover,'Result thumbnail missing');
    assert(row.cover.right<=row.title.x-8,'Thumbnail collides with title');
    assert(row.title.right<=row.box.right+1,'Title exceeds result row');
    if(!m.kind.includes('long')) assert(row.box.height<180,'A short result occupies an oversized row: '+row.box.height);
  }
  if(!m.kind.includes('empty'))assert(m.marks>0,'Keyword highlighting disappeared');
}
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const context=await browser.newContext({reducedMotion:'reduce'});
    const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
    const response=await (await fetch('http://localhost:18080/api/idle/list?keyword='+encodeURIComponent('数学')+'&pageNum=1&pageSize=4')).json();
    assert.equal(response.code,200);
    report.realItems=response.data.list.map(item=>({id:item.id,title:item.title,hasImage:!!(item.imageList?.length||item.images)}));
    if(phase==='before'){
      const m=await measure(page,'real',1440,'light');
      await page.screenshot({path:path.join(output,'before-desktop.png'),fullPage:true});
      assert.equal(await page.locator('.result-list img').count(),report.realItems.filter(i=>i.hasImage).length,'API contains an image but the search page renders none');
      validate(m);
    }else{
      for(const width of [390,780,1440,1920])for(const theme of ['light','dark']){
        const m=await measure(page,'real',width,theme);validate(m);await visibleImages(page);
        const imageStates=await page.locator('.search-result-cover img').evaluateAll(nodes=>nodes.map(n=>({src:n.getAttribute('src'),complete:n.complete,width:n.naturalWidth})));
        assert(imageStates.some(n=>n.src?.startsWith('data:image/')&&n.complete&&n.width>0),'Real image from math result did not load');
        assert(await page.locator('.search-result-cover').getByText('暂无图片',{exact:true}).count(),'No-image result must keep an honest placeholder');
        if([390,1440].includes(width)){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(output,`real-${width}-${theme}.png`),fullPage:true});}
      }
      await context.close();
      const fixtureContext=await browser.newContext({reducedMotion:'reduce'});
      await fixtureContext.route('**/api/**',async route=>{
        const url=new URL(route.request().url());let data={list:[],total:0};
        if(url.pathname==='/api/site/config')data={siteName:'梧桐校园'};
        else if(/\/api\/(activity|idle|lostfound|post)\/list$/.test(url.pathname)){
          let list=mode==='empty'?[]:records.map(item=>({...item}));
          if(mode==='no-image')list=list.map((item,i)=>({...item,imageList:[],images:null,category:i?'未知分类':'教材书籍'}));
          if(mode==='broken')list=list.map((item,i)=>({...item,imageList:['/images/ui-image-does-not-exist.png'],images:null,category:i?'未知分类':'教材书籍'}));
          if(mode==='long')list=list.map(item=>({...item,title:item.title+'长标题数学验收'.repeat(18),content:item.content+'长动态正文数学验收'.repeat(18),location:'教学楼数学讨论'.repeat(20)}));
          data={list,total:list.length};
        }
        await route.fulfill({json:{code:200,data}});
      });
      const fixture=await fixtureContext.newPage();fixture.on('pageerror',e=>report.errors.push(e.message));
      for(mode of ['data','no-image','broken','long','empty'])for(const width of [390,1440])for(const theme of ['light','dark']){
        const m=await measure(fixture,'fixture-'+mode,width,theme);validate(m);await visibleImages(fixture);
        if(mode==='data')assert.equal(await fixture.locator('.search-result-cover img').count(),8,'All four modules must render the existing image fields');
        if(mode==='broken'){
          await fixture.waitForFunction(()=>![...document.querySelectorAll('.search-result-cover img')].some(n=>n.src.includes('ui-image-does-not-exist')));
          assert(await fixture.locator('.search-result-cover').getByText('暂无图片',{exact:true}).count(),'Unknown category must not get a fabricated photo');
          assert(await fixture.locator('.search-result-cover').getByText('示意图',{exact:true}).count(),'Fallback images must be labeled');
        }
        if(mode==='data'&&width===1440&&theme==='light'){await fixture.evaluate(()=>window.scrollTo(0,0));await fixture.screenshot({path:path.join(output,'four-modules.png'),fullPage:true});}
      }
      mode='data';await measure(fixture,'fixture-data',1440,'light');
      for(const label of ['校园活动','闲置物品','失物招领','校园动态']){
        await fixture.locator('.chips .chip').filter({hasText:label}).click();
        assert.equal(await fixture.locator('.result-section').count(),1);assert.equal(await fixture.locator('.result-section h2').textContent(),label);
        report.actions.push('Filter '+label+' retains matching results and previews');
      }
      await fixture.locator('.result-section .result-list > button').first().click();await fixture.waitForURL('**/social?post=42');report.actions.push('Dynamic result retains post query navigation');
      await measure(fixture,'fixture-data',1440,'light');
      await fixture.locator('.result-section').filter({has:fixture.locator('h2').filter({hasText:'闲置物品'})}).getByRole('button',{name:'查看全部',exact:true}).click();
      await fixture.waitForURL('**/idle?q=*');assert.equal(new URL(fixture.url()).searchParams.get('q'),'数学');report.actions.push('View all preserves original search keyword');
      assert.equal(report.errors.length,0,'Browser errors');
      console.log('PASS: '+report.measurements.length+' image/layout measurements; '+report.actions.length+' original navigation/filter checks; no browser errors.');
    }
  }finally{fs.writeFileSync(path.join(output,phase+'.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
