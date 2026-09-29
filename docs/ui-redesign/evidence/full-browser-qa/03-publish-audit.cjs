module.exports=async function(s){
 const {page,admin,buyer,check,assert,S,A,field,pick,snap}=s;
 s.ids ||= {};s.asset='E:/work/毕业设计UI原型/Ai-campus/测试素材/02-机械键盘.png';
 s.capturePublish=async function(p,type,label='提交审核'){
   const response=p.waitForResponse(r=>new URL(r.url()).pathname==='/api/'+type&&r.request().method()==='POST');await p.getByRole('button',{name:label,exact:true}).click();const body=await (await response).json();assert.equal(body.code,200,body.message);return body.data?.id||body.data;
 };
 s.audit=async function(type,name,accept=true){
  await admin.goto(A+'/audit/'+type);await admin.locator('.review-list').waitFor();await admin.getByRole('button',{name:'刷新',exact:true}).click();await admin.locator('.el-loading-mask:visible').first().waitFor({state:'hidden'});
  let card=admin.locator('.review-card').filter({hasText:name});
  if(!await card.count()){for(let n=0;n<8&&!await card.count();n++){const next=admin.locator('.btn-next');if(!await next.count()||await next.isDisabled())break;await next.click();await admin.locator('.el-loading-mask:visible').first().waitFor({state:'hidden'});}}
  assert.equal(await card.count(),1,'New record must be visible in audit');
  if(accept){const pass=card.getByRole('button',{name:'通过',exact:true});if(await pass.count())await pass.click();await card.getByText('已通过',{exact:true}).waitFor();}
  else{await card.getByRole('button',{name:'驳回',exact:true}).click();const d=admin.getByRole('dialog',{name:'驳回原因'});await d.locator('textarea').fill(s.prefix+'明确的驳回理由');await d.getByRole('button',{name:'确认驳回',exact:true}).click();await d.waitFor({state:'hidden'});await card.getByText('已驳回',{exact:true}).waitFor();}
 };
 await check('IDLE / blank title rejected without submission',async()=>{await page.goto(S+'/idle/publish');await page.getByRole('button',{name:'提交审核',exact:true}).click();await page.getByText('请填写标题',{exact:true}).waitFor();});
 await check('UPLOAD / add preview, open image and remove',async()=>{
  await page.locator('.upload-img input[type=file]').setInputFiles(s.asset);await page.locator('.preview-item').waitFor();await page.locator('.preview-img').click();await page.locator('.el-image-viewer__wrapper').waitFor();await page.keyboard.press('Escape');await page.locator('.el-image-viewer__wrapper').waitFor({state:'hidden'});await page.locator('.preview-item .remove').click();assert.equal(await page.locator('.preview-item').count(),0);
 });
 await check('IDLE / publish all fields and actual uploaded photo',async()=>{
  await field(page,'标题').fill(s.prefix+'闲置交换');await pick(page,'分类','数码电子');await field(page,'物品描述').fill('真实浏览器发布的键盘，测试预约与互评');await field(page,'期望换物').fill('数学教材');await page.locator('.upload-img input[type=file]').setInputFiles(s.asset);await page.locator('.preview-item').waitFor();s.ids.idle=await s.capturePublish(page,'idle');await page.waitForURL(S+'/profile');await page.locator('.el-table__row').filter({hasText:s.prefix+'闲置交换'}).waitFor();
 });
 await check('AUDIT / idle reject reason appears in owner profile',async()=>{
  assert(s.ids.idle);await s.audit('idle',s.prefix+'闲置交换',false);await page.reload();await page.locator('.el-table__row').filter({hasText:s.prefix+'闲置交换'}).getByText('已驳回',{exact:true}).waitFor();
 },admin);
 await check('IDLE / edit rejected record and resubmit',async()=>{
  await page.locator('.el-table__row').filter({hasText:s.prefix+'闲置交换'}).getByRole('button',{name:'编辑',exact:true}).click();await page.waitForURL(url=>url.pathname==='/idle/publish'&&Number(url.searchParams.get('id'))===s.ids.idle);await page.waitForFunction(title=>document.querySelector('.publish .el-form input').value===title,s.prefix+'闲置交换');assert.equal(await field(page,'标题').inputValue(),s.prefix+'闲置交换');await field(page,'物品描述').fill('补充了真实信息，重新提交');await page.getByRole('button',{name:'提交审核',exact:true}).click();await page.waitForURL(S+'/profile');
 });
 await check('AUDIT / idle approve and buyer can view image',async()=>{await s.audit('idle',s.prefix+'闲置交换');await buyer.goto(S+'/idle/detail/'+s.ids.idle);await buyer.locator('.info h2').filter({hasText:s.prefix}).waitFor();await buyer.locator('.gallery .el-image').first().click();await buyer.locator('.el-image-viewer__wrapper').waitFor();await snap(buyer,'idle-image-preview');await buyer.keyboard.press('Escape');},admin);
 await check('ACTIVITY / publish dates, capacity and category',async()=>{
  await page.goto(S+'/activity/publish');await field(page,'活动标题').fill(s.prefix+'校园交流');await pick(page,'分类','学习交流');await field(page,'活动描述').fill('讨论数学学习方法');await field(page,'地点').fill('图书馆三楼');
  for(const [label,value] of [['开始时间','2026-10-01 10:00:00'],['结束时间','2026-10-01 12:00:00'],['报名截止','2026-10-01 09:00:00']]){const input=field(page,label);await input.fill(value);await input.press('Tab');}
  await field(page,'人数上限').fill('3');await field(page,'人数上限').press('Tab');s.ids.activity=await s.capturePublish(page,'activity');await page.waitForURL(S+'/activity/my-signup');
 });
 await check('AUDIT / activity approve and visible to participant',async()=>{await s.audit('activity',s.prefix+'校园交流');await buyer.goto(S+'/activity/detail/'+s.ids.activity);await buyer.getByRole('button',{name:'立即报名',exact:true}).waitFor();},admin);
 await check('LOST / publish found item with time/contact/type',async()=>{
  await page.goto(S+'/lostfound/publish');await page.getByText('我捡到东西（招领）',{exact:true}).click();await field(page,'标题').fill(s.prefix+'捡到学生卡');await field(page,'描述').fill('测试卡片，卡号末四位0929');await field(page,'地点').fill('教学楼');await field(page,'发生时间').fill('2026-09-29 10:00:00');await field(page,'发生时间').press('Tab');await field(page,'联系方式').fill('13800000001');s.ids.lostfound=await s.capturePublish(page,'lostfound');await page.waitForURL(S+'/lostfound');
 });
 await check('AUDIT / lostfound approve',async()=>{await s.audit('lostfound',s.prefix+'捡到学生卡');await buyer.goto(S+'/lostfound/detail/'+s.ids.lostfound);await buyer.getByRole('button',{name:'申请认领',exact:true}).waitFor();},admin);
 await check('PARTNER / publish all five input fields',async()=>{
  await page.goto(S+'/partner/publish');await field(page,'科目/领域').fill(s.prefix+'高数搭子');await field(page,'目标').fill('期末复习');await field(page,'可搭时间').fill('周末');await field(page,'自我介绍').fill('真实浏览器搭子测试');await field(page,'联系方式').fill('13800000001');s.ids.partner=await s.capturePublish(page,'partner');await page.waitForURL(S+'/partner');
 });
 await check('AUDIT / partner approve and list includes fields',async()=>{await s.audit('partner',s.prefix+'高数搭子');await buyer.goto(S+'/partner');await buyer.getByText(s.prefix+'高数搭子',{exact:true}).waitFor();},admin);
 await check('QA / publish question and description',async()=>{
  await page.goto(S+'/qa/publish');await pick(page,'分类','课程');await field(page,'标题').fill(s.prefix+'数学问题');await field(page,'详细描述').fill('请说明二次方程如何求根');s.ids.qa=await s.capturePublish(page,'qa','发布问题');await page.waitForURL(S+'/qa');await page.getByText(s.prefix+'数学问题',{exact:true}).waitFor();
 });
 await check('SOCIAL / publish text and photo',async()=>{
  await page.goto(S+'/social');await page.getByPlaceholder('分享校园生活…',{exact:true}).fill(s.prefix+'校园动态 #UIQA');await page.locator('.publish-box input[type=file]').setInputFiles(s.asset);await page.locator('.publish-box .preview-item').waitFor();s.ids.post=await s.capturePublish(page,'post','发布动态');await page.getByText('已提交，待管理员审核后公开',{exact:true}).waitFor();
 });
 await check('AUDIT / post approve and shared target visible',async()=>{await s.audit('post',s.prefix+'校园动态');await buyer.goto(S+'/social?post='+s.ids.post);await buyer.locator('.post-content').filter({hasText:s.prefix}).waitFor();await snap(buyer,'social-shared-target');},admin);
 return {ids:s.ids,checks:s.report.checks.length};
};
