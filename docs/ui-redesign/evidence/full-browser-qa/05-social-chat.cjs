module.exports=async function(s){
 const {page,buyer,check,assert,S,snap}=s;const ids=s.ids;
 const post=p=>p.locator('.post-card').filter({has:p.locator('.post-content').filter({hasText:s.prefix+'校园动态'})});
 await check('FAVORITE / normal tab switch loads idle favorite and removes it',async()=>{
  await buyer.goto(S+'/profile');await buyer.getByRole('tab',{name:'我的收藏',exact:true}).click();const row=buyer.locator('.el-table__row').filter({hasText:s.prefix+'闲置交换'});await row.waitFor();await row.getByRole('button',{name:'取消收藏',exact:true}).click();await row.waitFor({state:'hidden'});await buyer.goto(S+'/idle/detail/'+ids.idle);await buyer.getByRole('button',{name:'☆ 收藏',exact:true}).waitFor();
 },buyer);
 await check('REPORT / idle report submits, profile displays pending record',async()=>{
  await buyer.goto(S+'/idle/detail/'+ids.idle);await buyer.getByRole('button',{name:'举报',exact:true}).click();const d=buyer.getByRole('dialog',{name:'举报该内容'});await s.field(d,'补充说明').fill(s.prefix+'界面举报测试');await d.getByRole('button',{name:'提交举报',exact:true}).click();await d.waitFor({state:'hidden'});await buyer.goto(S+'/profile?tab=report');await buyer.locator('.el-table__row').filter({hasText:s.prefix+'界面举报测试'}).getByText('待处理',{exact:true}).waitFor();
 },buyer);
 await check('SOCIAL / like and unlike persist visibly',async()=>{
  await buyer.goto(S+'/social?post='+ids.post);const card=post(buyer);await card.waitFor();const like=card.locator('.post-ops .op').nth(0);const initial=await like.textContent();await like.click();await like.locator('..').locator('.op.liked').first().waitFor();await like.click();await buyer.waitForFunction(text=>[...document.querySelectorAll('.post-content')].find(n=>n.textContent.includes(text))?.parentElement.querySelector('.post-ops .op').classList.contains('liked')===false,s.prefix+'校园动态');assert.equal((await like.textContent()).trim(),initial.trim());
 },buyer);
 await check('SOCIAL / comment submit and reload persists text/count',async()=>{
  const card=post(buyer);await card.locator('.post-ops .op').nth(1).click();await card.getByPlaceholder('友善评论，温暖校园').fill(s.prefix+'评论测试');await card.getByRole('button',{name:'发表',exact:true}).click();await card.locator('.c-content').filter({hasText:s.prefix+'评论测试'}).waitFor();await buyer.reload();await post(buyer).locator('.post-ops .op').nth(1).click();await post(buyer).locator('.c-content').filter({hasText:s.prefix+'评论测试'}).waitFor();
 },buyer);
 await check('SOCIAL / favorite and unfavorite UI cycle',async()=>{
  const op=post(buyer).locator('.post-ops .op').nth(2);await op.click();await op.filter({hasText:'★'}).waitFor();await op.click();await op.filter({hasText:'☆'}).waitFor();
 },buyer);
 await check('SOCIAL / share produces matching deep link and returns to list',async()=>{
  await s.buyerContext.grantPermissions(['clipboard-read','clipboard-write']);await post(buyer).locator('.post-ops .op').nth(3).click();const link=await buyer.evaluate(()=>navigator.clipboard.readText());assert.equal(new URL(link).searchParams.get('post'),String(ids.post));await buyer.getByRole('button',{name:'返回动态列表',exact:true}).click();await buyer.waitForURL(url=>url.pathname==='/social'&&!url.searchParams.has('post'));
 },buyer);
 await check('USER / author home and all four content tabs',async()=>{
  await buyer.goto(S+'/social?post='+ids.post);await post(buyer).locator('.nick').click();await buyer.waitForURL('**/user/*');for(const label of ['TA 的闲置','TA 的动态','TA 的评价','更多发布']){await buyer.getByRole('tab',{name:label,exact:true}).click();assert.equal(await buyer.getByRole('tab',{name:label,exact:true}).getAttribute('aria-selected'),'true');}await snap(buyer,'user-home');
 },buyer);
 await check('CHAT / contact item owner and context opens correct detail',async()=>{
  await buyer.goto(S+'/idle/detail/'+ids.idle);await buyer.getByRole('button',{name:'私信卖家',exact:true}).click();await buyer.waitForURL(url=>/^\/chat\/\d+$/.test(url.pathname));s.chatId=Number(new URL(buyer.url()).pathname.split('/').pop());await buyer.locator('.room').waitFor();await buyer.locator('.context').click();await buyer.waitForURL(S+'/idle/detail/'+ids.idle);await buyer.getByRole('button',{name:'私信卖家',exact:true}).click();await buyer.waitForURL(S+'/chat/'+s.chatId);
 },buyer);
 await check('CHAT / two users exchange text live without refreshing',async()=>{
  await page.goto(S+'/chat/'+s.chatId);await page.locator('.composer textarea').waitFor();await buyer.locator('.composer textarea').fill(s.prefix+'实时私信');await buyer.locator('.composer textarea').press('Enter');await page.locator('.bubble.text').filter({hasText:s.prefix+'实时私信'}).waitFor({timeout:15000});
  await page.locator('.composer textarea').fill(s.prefix+'卖家实时回复');await page.getByRole('button',{name:'发送',exact:true}).click();await buyer.locator('.bubble.text').filter({hasText:s.prefix+'卖家实时回复'}).waitFor({timeout:15000});await snap(buyer,'chat-live');
 },buyer);
 await check('CHAT / sender sees read receipt after peer opens conversation',async()=>{
  const row=buyer.locator('.row.mine').filter({hasText:s.prefix+'实时私信'});await row.getByText('已读',{exact:true}).waitFor({timeout:15000});
 },buyer);
 await check('CHAT / image upload delivery and preview',async()=>{
  const old=await page.locator('.bubble.image').count();await buyer.locator('.composer input[type=file]').setInputFiles(s.asset);await page.waitForFunction(count=>document.querySelectorAll('.bubble.image').length>count,old,{timeout:15000});await page.locator('.bubble.image .el-image').last().click();await page.locator('.el-image-viewer__wrapper').waitFor();await snap(page,'chat-image');await page.keyboard.press('Escape');
 },buyer);
 await check('CHAT / history survives reload and earlier-history control terminates',async()=>{
  await buyer.reload();await buyer.locator('.bubble.text').filter({hasText:s.prefix+'实时私信'}).waitFor();let attempts=0;while(await buyer.getByRole('button',{name:'加载更早消息',exact:true}).count()&&attempts++<8){await buyer.getByRole('button',{name:'加载更早消息',exact:true}).click();await buyer.locator('.el-loading-mask:visible').first().waitFor({state:'hidden'});}await buyer.getByText('没有更早的消息了',{exact:true}).waitFor();
 },buyer);
 await check('CHAT / network loss shows failure and retry delivers once',async()=>{
  await s.buyerContext.setOffline(true);await buyer.locator('.composer textarea').fill(s.prefix+'离线重试');await buyer.getByRole('button',{name:'发送',exact:true}).click();await buyer.getByRole('button',{name:'发送失败，点击重试',exact:true}).last().waitFor({timeout:18000});await s.buyerContext.setOffline(false);await buyer.getByRole('button',{name:'发送失败，点击重试',exact:true}).last().click();await page.locator('.bubble.text').filter({hasText:s.prefix+'离线重试'}).waitFor({timeout:18000});assert.equal(await page.locator('.bubble.text').filter({hasText:s.prefix+'离线重试'}).count(),1);
 },buyer);
 await s.buyerContext.setOffline(false);
 await check('CHAT / cancel block confirmation preserves ability to chat',async()=>{
  await buyer.locator('.room .more button').click();await buyer.getByText('拉黑用户',{exact:true}).click();await buyer.locator('.el-message-box:visible').getByRole('button',{name:'取消',exact:true}).click();await buyer.locator('.composer textarea').fill(s.prefix+'取消拉黑仍可发送');await buyer.getByRole('button',{name:'发送',exact:true}).click();await page.locator('.bubble.text').filter({hasText:s.prefix+'取消拉黑仍可发送'}).waitFor({timeout:15000});
 },buyer);
 await check('CHAT / hide conversation removes entry from list',async()=>{
  await buyer.locator('.room .more button').click();await buyer.getByText('隐藏会话',{exact:true}).click();await buyer.waitForURL(S+'/chat');assert.equal(await buyer.locator('.conversation').filter({hasText:s.prefix+'取消拉黑仍可发送'}).count(),0);
 },buyer);
 return {checks:s.report.checks.length,chatId:s.chatId};
};
