module.exports = async function(s) {
  const {page,buyer,admin,check,assert,secrets,S,A,snap} = s;
  page.setDefaultTimeout(8000); buyer.setDefaultTimeout(8000); admin.setDefaultTimeout(8000);
  s.prefix = '[UIQA0929-'+Date.now().toString().slice(-6)+']';
  s.field = (p,label) => p.locator('.el-form-item').filter({has:p.getByText(label,{exact:true})}).locator('input,textarea').first();
  s.pick = async (p,label,value) => {
    await p.locator('.el-form-item').filter({has:p.getByText(label,{exact:true})}).locator('.el-select').click();
    await p.locator('.el-select-dropdown:visible').getByText(value,{exact:true}).click();
  };
  s.confirm = async p => {const box=p.locator('.el-message-box:visible'); await box.waitFor();await box.getByRole('button',{name:/确定|确认/}).click();};
  s.login = async (p,number) => {
    await p.goto(S+'/login');await p.locator('.captcha-math,.captcha-img').waitFor();
    await p.getByPlaceholder('请输入学号',{exact:true}).fill(number);
    await p.getByPlaceholder('请输入密码',{exact:true}).fill(secrets.E2E_TEST_PASSWORD);
    await p.locator('.captcha-row input').fill('1');
    const response=p.waitForResponse(r=>r.url().endsWith('/api/auth/login')&&r.request().method()==='POST');
    await p.getByRole('button',{name:'登 录',exact:true}).click();
    const body=await (await response).json();assert.equal(body.code,200);await p.waitForURL(S+'/');
    return body.data;
  };
  await check('AUTH / anonymous protected link preserves redirect',async()=>{
    await page.goto(S+'/idle/publish');assert.equal(new URL(page.url()).pathname,'/login');assert.equal(new URL(page.url()).searchParams.get('redirect'),'/idle/publish');
  });
  await check('AUTH / blank login fields show validation',async()=>{
    await page.getByRole('button',{name:'登 录',exact:true}).click();
    await page.getByText('请输入验证码',{exact:true}).waitFor();assert.equal(await page.locator('.el-form-item__error').count(),3);
  });
  await check('AUTH / captcha refresh and password show/hide',async()=>{
    const response=page.waitForResponse(r=>r.url().includes('/api/auth/captcha'));
    await page.locator('.captcha-math,.captcha-img').click();assert.equal((await response).status(),200);
    await page.getByPlaceholder('请输入密码',{exact:true}).fill('negative-test-only');
    await page.locator('.el-input__password').click();assert.equal(await page.getByPlaceholder('请输入密码',{exact:true}).getAttribute('type'),'text');
    await page.locator('.el-input__password').click();assert.equal(await page.getByPlaceholder('请输入密码',{exact:true}).getAttribute('type'),'password');
  });
  await check('AUTH / wrong password gives feedback and keeps login',async()=>{
    await page.getByPlaceholder('请输入学号',{exact:true}).fill('E2E_2201');await page.locator('.captcha-row input').fill('1');
    const response=page.waitForResponse(r=>r.url().endsWith('/api/auth/login')&&r.request().method()==='POST');
    await page.getByRole('button',{name:'登 录',exact:true}).click();assert.notEqual((await (await response).json()).code,200);
    await page.locator('.el-message--error').waitFor();assert.equal(new URL(page.url()).pathname,'/login');
  });
  await check('AUTH / seller logs in through real UI',async()=>{s.sellerAuth=await s.login(page,'E2E_2201');});
  await check('AUTH / buyer logs in through real UI',async()=>{s.buyerAuth=await s.login(buyer,'E2E_2202');},buyer);
  await check('AUTH / administrator validation, remember and login',async()=>{
    await admin.goto(A+'/login');await admin.getByRole('button',{name:'登 录',exact:true}).click();await admin.getByText('请输入账号、密码和验证码',{exact:true}).waitFor();
    await admin.getByPlaceholder('管理员账号',{exact:true}).fill('admin');await admin.getByPlaceholder('密码',{exact:true}).fill('admin123');
    await admin.getByText('记住此设备',{exact:true}).click();await admin.locator('.captcha-row input').fill('1');
    await admin.getByRole('button',{name:'登 录',exact:true}).click();await admin.waitForURL(A+'/dashboard');
    assert.equal(await admin.evaluate(()=>localStorage.getItem('admin_remember_username')),'admin');await snap(admin,'admin-dashboard');
  },admin);
  await check('AUTH / registration validates malformed number and password mismatch',async()=>{
    s.newContext=await s.browser.newContext({viewport:{width:1440,height:1000}});s.registerPage=await s.newContext.newPage();const p=s.registerPage;
    await p.goto(S+'/register');await p.getByPlaceholder('学号（6-20位数字）').fill('ABC');await p.getByPlaceholder('昵称',{exact:true}).fill('UIQA新同学');
    await p.getByPlaceholder('密码（6-32位）',{exact:true}).fill(secrets.E2E_TEST_PASSWORD);await p.getByPlaceholder('确认密码',{exact:true}).fill('different-password');await p.locator('.captcha-row input').fill('1');
    await p.getByRole('button',{name:'注 册',exact:true}).click();await p.getByText('学号为6-20位数字',{exact:true}).waitFor();await p.getByText('两次输入的密码不一致',{exact:true}).waitFor();
  });
  await check('AUTH / UI registration persists account and auto logs in',async()=>{
    const p=s.registerPage;s.newStudentNo='29'+Date.now().toString();await p.getByPlaceholder('学号（6-20位数字）').fill(s.newStudentNo);await p.getByPlaceholder('确认密码',{exact:true}).fill(secrets.E2E_TEST_PASSWORD);
    const response=p.waitForResponse(r=>r.url().endsWith('/api/auth/register')&&r.request().method()==='POST');
    await p.getByRole('button',{name:'注 册',exact:true}).click();assert.equal((await (await response).json()).code,200);await p.waitForURL(S+'/');assert(await p.locator('.header-avatar').isVisible());
  });
  await check('SHELL / theme cycles and persists on refresh',async()=>{
    const initial=await page.locator('html').getAttribute('data-theme');await page.getByRole('button',{name:/切换.*模式/}).click();
    const changed=await page.locator('html').getAttribute('data-theme');assert.notEqual(changed,initial);await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),changed);
    await page.getByRole('button',{name:/切换.*模式/}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),initial);
  });
  return {prefix:s.prefix,checks:s.report.checks.length};
};
