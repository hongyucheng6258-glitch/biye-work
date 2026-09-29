module.exports=async function(s){
 const {page,buyer,admin,check,assert,S,A,field,confirm,snap}=s;
 const id=s.ids;
 await check('FAVORITE / idle add, profile visibility, removal',async()=>{
  assert(id.idle);await buyer.goto(S+'/idle/detail/'+id.idle);await buyer.getByRole('button',{name:'☆ 收藏',exact:true}).click();await buyer.getByRole('button',{name:'★ 已收藏',exact:true}).waitFor();
  await buyer.goto(S+'/profile?tab=favorite');await buyer.getByRole('tab',{name:'我的收藏',exact:true}).click();const row=buyer.locator('.el-table__row').filter({hasText:s.prefix+'闲置交换'});await row.waitFor();await row.getByRole('button',{name:'取消收藏',exact:true}).click();await row.waitFor({state:'hidden'});
  await buyer.goto(S+'/idle/detail/'+id.idle);await buyer.getByRole('button',{name:'☆ 收藏',exact:true}).waitFor();
 },buyer);
 await check('REPORT / idle report submits, profile displays pending record',async()=>{
  await buyer.getByRole('button',{name:'举报',exact:true}).click();const d=buyer.getByRole('dialog',{name:'举报该内容'});await field(d,'补充说明').fill(s.prefix+'界面举报测试');await d.getByRole('button',{name:'提交举报',exact:true}).click();await d.waitFor({state:'hidden'});
  await buyer.goto(S+'/profile?tab=report');await buyer.getByRole('tab',{name:'我的举报',exact:true}).click();await buyer.locator('.el-table__row').filter({hasText:s.prefix+'界面举报测试'}).getByText('待处理',{exact:true}).waitFor();
 },buyer);
 await check('IDLE / appointment cancel preserves unbooked state',async()=>{
  await buyer.goto(S+'/idle/detail/'+id.idle);await buyer.getByRole('button',{name:'发起预约互换',exact:true}).click();const d=buyer.getByRole('dialog',{name:'发起预约',exact:true});await d.locator('textarea').fill('取消时不应提交');await d.getByRole('button',{name:'取消',exact:true}).click();await d.waitFor({state:'hidden'});await buyer.getByRole('button',{name:'发起预约互换',exact:true}).waitFor();
 },buyer);
 await check('IDLE / buyer books and seller receives pending appointment',async()=>{
  await buyer.getByRole('button',{name:'发起预约互换',exact:true}).click();const d=buyer.getByRole('dialog',{name:'发起预约',exact:true});await d.locator('textarea').fill(s.prefix+'周末图书馆互换');await d.getByRole('button',{name:'确认预约',exact:true}).click();await d.waitFor({state:'hidden'});await buyer.getByRole('button',{name:'已预约，等待卖家处理',exact:true}).waitFor();
  await page.goto(S+'/idle/appointments?role=seller');await page.locator('.el-table__row').filter({hasText:s.prefix+'闲置交换'}).getByText('待确认',{exact:true}).waitFor();
 },buyer);
 await check('IDLE / seller accepts and buyer sees accepted',async()=>{
  const row=page.locator('.el-table__row').filter({hasText:s.prefix+'闲置交换'});await row.getByRole('button',{name:'接受',exact:true}).click();await row.getByText('已接受',{exact:true}).waitFor();await buyer.goto(S+'/idle/appointments');await buyer.locator('.el-table__row').filter({hasText:s.prefix+'闲置交换'}).getByText('已接受',{exact:true}).waitFor();
 });
 await check('IDLE / confirm finished produces review actions for both users',async()=>{
  const row=page.locator('.el-table__row').filter({hasText:s.prefix+'闲置交换'});await row.getByRole('button',{name:'确认完成',exact:true}).click();await row.getByText('已完成',{exact:true}).waitFor();await buyer.reload();await buyer.locator('.el-table__row').filter({hasText:s.prefix+'闲置交换'}).getByRole('button',{name:'评价',exact:true}).waitFor();
 });
 for(const [p,name] of [[buyer,'buyer'],[page,'seller']])await check('IDLE / '+name+' rates trade and result persists',async()=>{
  const row=p.locator('.el-table__row').filter({hasText:s.prefix+'闲置交换'});await row.getByRole('button',{name:'评价',exact:true}).click();const d=p.getByRole('dialog',{name:'交易互评'});await d.locator('.el-rate__item').last().click();await d.locator('textarea').fill(s.prefix+'真实界面交易满意');await d.getByRole('button',{name:'提交评价',exact:true}).click();await d.waitFor({state:'hidden'});await row.getByText('已评价',{exact:true}).waitFor();await p.reload();await row.getByText('已评价',{exact:true}).waitFor();
 },p);
 await check('ACTIVITY / signup cancel and confirmation',async()=>{
  assert(id.activity);await buyer.goto(S+'/activity/detail/'+id.activity);await buyer.getByRole('button',{name:'立即报名',exact:true}).click();let d=buyer.getByRole('dialog',{name:'报名活动'});await d.getByRole('button',{name:'取消',exact:true}).click();await buyer.getByRole('button',{name:'立即报名',exact:true}).click();d=buyer.getByRole('dialog',{name:'报名活动'});await d.locator('textarea').fill(s.prefix+'报名说明');await d.getByRole('button',{name:'确认报名',exact:true}).click();await d.waitFor({state:'hidden'});await buyer.getByText('报名待审批',{exact:true}).waitFor();
 },buyer);
 await check('ACTIVITY / owner member table approves participant',async()=>{
  await page.goto(S+'/activity/detail/'+id.activity);await page.getByRole('button',{name:'报名名单管理',exact:true}).click();const d=page.getByRole('dialog',{name:'报名名单',exact:true});await d.locator('.el-table__row').filter({hasText:s.prefix+'报名说明'}).getByRole('button',{name:'通过',exact:true}).click();await d.getByText('已通过',{exact:true}).waitFor();await snap(page,'activity-members');await page.keyboard.press('Escape');await buyer.reload();await buyer.getByText(/已通过报名/).waitFor();
 });
 await check('ACTIVITY / owner QR image loads and actual sign-in content visible',async()=>{
  await page.getByRole('button',{name:'签到二维码',exact:true}).click();const d=page.getByRole('dialog',{name:'活动签到'});await d.locator('.qr-code').waitFor();assert(await d.locator('.qr-content').textContent());assert(await d.locator('.qr-code').evaluate(n=>n.complete&&n.naturalWidth>0));await snap(page,'activity-qrcode');await page.keyboard.press('Escape');
 });
 await check('ACTIVITY / participant cancels approved booking and status clears',async()=>{
  await buyer.getByRole('button',{name:'取消报名',exact:true}).click();await confirm(buyer);await buyer.getByRole('button',{name:'立即报名',exact:true}).waitFor();
 },buyer);
 await check('ACTIVITY / My activities two tabs retain new published record',async()=>{
  await page.goto(S+'/activity/my-signup');await page.getByRole('tab',{name:'我发布的',exact:true}).click();await page.locator('.el-table__row').filter({hasText:s.prefix+'校园交流'}).waitFor();await page.getByRole('tab',{name:'我的报名',exact:true}).click();
 });
 await check('LOST / participant submits claim with proof and contact',async()=>{
  assert(id.lostfound);await buyer.goto(S+'/lostfound/detail/'+id.lostfound);await buyer.getByRole('button',{name:'申请认领',exact:true}).click();const d=buyer.getByRole('dialog',{name:'申请认领',exact:true});await d.getByPlaceholder('物品特征/证明信息…').fill(s.prefix+'卡号0929');await d.getByPlaceholder('联系方式（手机/微信/QQ）').fill('13800000002');await d.getByRole('button',{name:'提交申请',exact:true}).click();await d.waitFor({state:'hidden'});await buyer.getByText(/待审核|待处理|待确认/).first().waitFor();
 },buyer);
 await check('LOST / owner agrees to claim, participant confirms return',async()=>{
  await page.goto(S+'/lostfound/detail/'+id.lostfound);await page.getByRole('button',{name:/认领申请/}).click();const d=page.getByRole('dialog',{name:'认领申请管理'});await d.locator('.el-table__row').filter({hasText:s.prefix+'卡号0929'}).getByRole('button',{name:'同意',exact:true}).click();await d.getByText('等待失主确认',{exact:true}).waitFor();await page.keyboard.press('Escape');await buyer.reload();await buyer.getByRole('button',{name:'确认已找回',exact:true}).click();await confirm(buyer);await buyer.getByText('✅ 已完成',{exact:true}).waitFor();await snap(buyer,'lost-completed');
 });
 await check('QA / other student answers through UI',async()=>{
  assert(id.qa);await buyer.goto(S+'/qa/detail/'+id.qa);await buyer.getByPlaceholder('写下你的回答，帮同学解决问题…').fill(s.prefix+'使用求根公式');await buyer.getByRole('button',{name:'提交回答',exact:true}).click();await buyer.locator('.answer__content').filter({hasText:s.prefix}).waitFor();
 },buyer);
 await check('QA / owner accepts best answer and solved state persists',async()=>{
  await page.goto(S+'/qa/detail/'+id.qa);await page.getByRole('button',{name:'采纳为最佳回答',exact:true}).click();await page.getByText('✅ 已采纳',{exact:true}).waitFor();await page.getByText('已解决',{exact:true}).waitFor();await page.reload();await page.getByText('已解决',{exact:true}).waitFor();await snap(page,'qa-solved');
 });
 await check('QA / My questions includes solved owned question',async()=>{
  await page.goto(S+'/qa/my');await page.getByText(s.prefix+'数学问题',{exact:true}).waitFor();
 });
 await check('MESSAGE / all category filters, mark all read and private shortcut',async()=>{
  await page.goto(S+'/message');for(const label of ['系统通知','互动消息','审核结果','全部']){await page.locator('.msg-sidebar').getByRole('button',{name:label,exact:true}).click();await page.locator('.msg-list').waitFor();}await page.getByRole('button',{name:'全部已读',exact:true}).click();await page.locator('.msg-item.unread').waitFor({state:'hidden'});await snap(page,'message-center');await page.locator('.msg-sidebar').getByRole('button',{name:'私信会话',exact:true}).click();await page.waitForURL(S+'/chat');
 });
 return {checks:s.report.checks.length,ids:s.ids};
};
