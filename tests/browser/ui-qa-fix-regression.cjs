const assert = require('node:assert/strict');
const path = require('node:path');

module.exports = async s => {
  const {page,seller,admin,S,A,out} = s;
  const results = [];
  const snap = (p,name) => p.screenshot({path:path.join(out,name+'.png'),animations:'disabled'});
  const field = (p,label) => p.locator('.el-form-item').filter({hasText:label}).locator('input,textarea').first();
  const check = async (name,run,p=page) => {
    try { await run(); results.push({name,status:'PASS'}); }
    catch (error) { await snap(p,'failure-'+results.length); results.push({name,status:'FAIL',error:error.message}); }
    s.fs.writeFileSync(path.join(out,'functional-results.json'),JSON.stringify(results,null,2));
  };
  await page.setViewportSize({width:1440,height:900});
  await check('B01: initial favorites deep link, refresh, normal tab and removal',async()=>{
    await page.goto(S+'/idle/detail/12');
    await page.locator('.info h2').waitFor();
    const favoriteButton=page.locator('.actions').getByRole('button',{name:/收藏/});
    const already=(await favoriteButton.innerText()).includes('已收藏');
    if (!already) {await favoriteButton.click();await favoriteButton.getByText('★ 已收藏',{exact:true}).waitFor();}
    const title=await page.locator('.info h2').innerText();
    for (let i=0;i<2;i++) {
      await page.goto(S+'/profile?tab=favorite');
      await page.getByRole('tabpanel',{name:'我的收藏'}).locator('.el-table__row').filter({hasText:title}).waitFor();
    }
    await snap(page,'B01-favorite-deep-link');
    await page.getByRole('tab',{name:'我的闲置',exact:true}).click();
    await page.getByRole('tab',{name:'我的收藏',exact:true}).click();
    await page.getByRole('tabpanel',{name:'我的收藏'}).locator('.el-table__row').filter({hasText:title}).waitFor();
    if(!already) {await page.goto(S+'/idle/detail/12');await page.locator('.actions').getByRole('button',{name:'★ 已收藏',exact:true}).click();await page.locator('.actions').getByRole('button',{name:'☆ 收藏',exact:true}).waitFor();}
  });
  await check('B02: comment entry opens, posts, persists and folds',async()=>{
    await page.goto(S+'/social?post=13');
    const card=page.locator('.post-card:not(.share-target)').first();
    await card.locator('.post-ops .op').nth(1).click();
    const text='[UIQA-FIX] 评论回归 '+Date.now();
    await card.getByPlaceholder('友善评论，温暖校园').fill(text);
    const response=page.waitForResponse(r=>r.url().endsWith('/api/post/13/comment')&&r.request().method()==='POST');
    await card.getByRole('button',{name:'发表',exact:true}).click();
    assert.equal((await(await response).json()).code,200);
    await card.locator('.c-content').getByText(text,{exact:true}).waitFor();
    await card.locator('.post-ops .op').nth(1).click();
    assert.equal(await card.getByPlaceholder('友善评论，温暖校园').count(),0);
    await page.reload();await page.locator('.post-card:not(.share-target)').first().locator('.post-ops .op').nth(1).click();
    await page.locator('.post-card:not(.share-target)').first().locator('.c-content').getByText(text,{exact:true}).waitFor();
    await snap(page,'B02-comment-persisted');
  });
  await check('B03: detail participant list sends numeric page and existing alternate entry still works',async()=>{
    await seller.goto(S+'/activity/detail/9');
    const response=seller.waitForResponse(r=>r.url().includes('/api/activity/9/members'));
    await seller.getByRole('button',{name:'报名名单管理',exact:true}).click();
    const result=await response;
    assert.equal(new URL(result.url()).searchParams.get('pageNum'),'1');
    assert.equal((await result.json()).code,200);
    await seller.getByRole('dialog',{name:'报名名单',exact:true}).locator('.el-table__row').first().waitFor();
    await snap(seller,'B03-members-detail');
    await seller.keyboard.press('Escape');
    await seller.goto(S+'/activity/my-signup');await seller.getByRole('tab',{name:'我的发布',exact:true}).click();
    const row=seller.locator('.el-table__row').filter({has:seller.locator('a[href="/activity/detail/9"]')});
    await row.getByRole('button',{name:'报名管理',exact:true}).click();
    await seller.getByRole('dialog',{name:'报名管理',exact:true}).locator('.el-table__row').first().waitFor();
    await seller.keyboard.press('Escape');
  },seller);
  await check('B05: Ctrl+K global search, same-route second keyword and manual search',async()=>{
    await admin.goto(A+'/dashboard');
    const input=admin.getByPlaceholder('搜索用户 / 内容 / 工单 ID…（Ctrl + K）');
    for (const no of ['E2E_2201','E2E_2202']) {
      await admin.keyboard.press('Control+k');await input.fill(no);
      const response=admin.waitForResponse(r=>r.url().includes('/api/admin/user/list')&&new URL(r.url()).searchParams.get('keyword')===no);
      await input.press('Enter');assert.equal((await(await response).json()).code,200);
      await admin.getByPlaceholder('学号/昵称').waitFor();assert.equal(await admin.getByPlaceholder('学号/昵称').inputValue(),no);
      const rows=admin.locator('.el-table__row');await rows.first().waitFor();assert.equal(await rows.count(),1);assert((await rows.first().innerText()).includes(no));
    }
    await snap(admin,'B05-global-search');
    await admin.getByPlaceholder('学号/昵称').fill('E2E_2201');await admin.getByRole('button',{name:'搜索',exact:true}).click();
    await admin.locator('.el-table__row').getByText('E2E_2201',{exact:true}).waitFor();
  },admin);
  const username='uiqa_fix_'+Date.now();
  await check('B04: new administrator still requires an initial password',async()=>{
    await admin.goto(A+'/system');await admin.getByRole('button',{name:'＋ 新增子管理员',exact:true}).click();
    const d=admin.getByRole('dialog',{name:'新增子管理员'});
    await field(d,'用户名').fill(username);await field(d,'昵称').fill('[UIQA-FIX] 审核员');
    const response=admin.waitForResponse(r=>r.url().endsWith('/api/admin/system/admin')&&r.request().method()==='POST');
    await d.getByRole('button',{name:'保存',exact:true}).click();assert.notEqual((await(await response).json()).code,200);
    assert(await d.isVisible());
    await field(d,'密码').fill(s.secrets.E2E_TEST_PASSWORD);
    const success=admin.waitForResponse(r=>r.url().endsWith('/api/admin/system/admin')&&r.request().method()==='POST');
    await d.getByRole('button',{name:'保存',exact:true}).click();assert.equal((await(await success).json()).code,200);await d.waitFor({state:'hidden'});
  },admin);
  await check('B04: empty-password nickname edit saves and original password still logs in',async()=>{
    const row=admin.locator('.el-table__row').filter({hasText:username});await row.getByRole('button',{name:'编辑',exact:true}).click();
    const d=admin.getByRole('dialog',{name:'编辑管理员'});assert.equal(await field(d,'新密码').inputValue(),'');
    await field(d,'昵称').fill('[UIQA-FIX] 空密码编辑成功');
    const response=admin.waitForResponse(r=>/\/api\/admin\/system\/admin\/\d+$/.test(new URL(r.url()).pathname)&&r.request().method()==='PUT');
    await d.getByRole('button',{name:'保存',exact:true}).click();assert.equal((await(await response).json()).code,200);await d.waitFor({state:'hidden'});
    await row.getByText('[UIQA-FIX] 空密码编辑成功',{exact:true}).waitFor();await snap(admin,'B04-admin-empty-password');
    const context=await s.browser.newContext({viewport:{width:1440,height:900}});const auditor=await context.newPage();
    try {await s.adminLogin(auditor,username,s.secrets.E2E_TEST_PASSWORD);await auditor.goto(A+'/system');await auditor.waitForURL(A+'/dashboard');await snap(auditor,'B04-reviewer-permissions');}
    finally {await context.close();}
  },admin);
  await check('B06: real AI outline success renders Markdown and can reset',async()=>{
    await seller.goto(S+'/ai/wrong');
    const response=seller.waitForResponse(r=>r.url().endsWith('/api/ai/outline')&&r.request().method()==='POST',{timeout:120000});
    await seller.getByRole('button',{name:'📊 生成薄弱点报告',exact:true}).click();
    const result=await(await response).json();assert.equal(result.code,200);assert.equal(typeof result.data,'string');assert(result.data.length>30);
    const d=seller.getByRole('dialog',{name:'🤖 AI 生成复习提纲'});
    await d.getByText('已生成',{exact:true}).waitFor();assert((await d.locator('.md-body').innerText()).length>30);
    await snap(seller,'B06-real-outline');
    await d.getByRole('button',{name:'重新选择生成方式',exact:true}).click();assert.equal(await d.locator('.mode-btn').count(),3);
    await seller.keyboard.press('Escape');
  },seller);
  await check('B07: pending chat switches to guide, sends successfully, then PDF and chat remain usable',async()=>{
    await seller.goto(S+'/ai/chat');await seller.locator('.ai-input input').waitFor();
    const input=seller.locator('.ai-input input');
    await input.fill('请详细介绍十种算法，每种给出证明和 Python 示例。');
    const request=seller.waitForRequest(r=>r.url().endsWith('/api/ai/chat/stream')&&r.method()==='POST');
    await seller.locator('.send').click();await request;
    await seller.getByRole('tab',{name:'🏫 校园向导',exact:true}).click();
    await input.fill('校园里有哪些服务？简短回答。');await seller.locator('.send:not(:disabled)').waitFor();
    const response=seller.waitForResponse(r=>r.url().endsWith('/api/ai/guide/ask')&&r.request().method()==='POST',{timeout:120000});
    await seller.locator('.send').click();assert.equal((await(await response).json()).code,200);
    await seller.locator('.ai-chat .bubble-row').last().waitFor();
    await seller.waitForFunction(()=>document.querySelector('.ai-chat')?.innerText.includes('校园里有哪些服务？简短回答。')&&document.querySelector('.ai-chat')?.innerText.length>50);
    await snap(seller,'B07-scene-switch-guide');
    await seller.getByRole('tab',{name:'📄 PDF问答',exact:true}).click();await input.fill('检查输入解锁');await seller.locator('.send:not(:disabled)').waitFor();
    await seller.getByRole('tab',{name:'💬 AI答疑',exact:true}).click();await input.fill('检查输入解锁');await seller.locator('.send:not(:disabled)').waitFor();
    await input.fill('');
  },seller);
  return results;
};
