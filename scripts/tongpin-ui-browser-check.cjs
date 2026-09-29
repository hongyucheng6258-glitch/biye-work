/* UI-only browser acceptance. Fixtures exist only inside Playwright routing and
 * never replace production APIs. No live backend is contacted or mutated. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const output = path.resolve(process.env.CAMPUS_TEST_OUTPUT || '.superpowers/tongpin-implementation/after');
const studentUrl = process.env.UI_STUDENT_URL || 'http://127.0.0.1:5173';
const adminUrl = process.env.UI_ADMIN_URL || 'http://127.0.0.1:5174/admin';
const image = '/images/campus-v2.webp';
const time = '2027-10-01 10:00:00';
const user = { id:9, nickname:'UI验收同学', studentNo:'UI_TEST_009', gender:0, phone:'13800000000', bio:'长文本验收：学习、活动与校园生活。'.repeat(4), avatar:'', createTime:time, idleCount:2, postCount:2, activityCount:2, lostfoundCount:2, averageScore:4.5, reviewCount:2 };
const item = { id:42, title:'UI验收 · 校园摄影与学习交流活动', subject:'高等数学', goal:'结伴学习，交流思路', schedule:'周三下午', intro:'一起整理知识点。', contact:'校内私信', content:'UI验收动态 #校园 #学习 '.repeat(12), description:'UI验收长描述，检查换行与完整功能。'.repeat(10), category:'文艺娱乐', location:'图书馆与校园广场', startTime:time, endTime:'2027-10-01 20:00:00', signupDeadline:time, createTime:time, publishTime:time, userId:2, publisherNickname:'UI验收发布者', nickname:'UI验收同学', avatar:'', images:[image], imageList:[image], status:0, auditStatus:1, auditSource:'manual', aiRiskLevel:1, aiAuditReason:'UI验收审核说明与风险描述。'.repeat(6), memberCount:8, maxMembers:30, canSignup:true, isOwner:false, mySignupStatus:null, displayStatusText:'报名中', type:'found', expectItem:'学习用品', viewCount:21, likeCount:8, commentCount:2, answerCount:2, phone:'13800000000', role:'audit', username:'ui_test_auditor', reporterId:9, targetType:'user', targetId:2, reasonType:'其他', reason:'UI验收举报原因', handleResult:'待处理', studentNo:'UI_TEST_009', lastLoginTime:time, model:'ui-test', scene:'chat', promptTokens:20, completionTokens:30, costMs:2400, errorMsg:'UI验收故障信息', isRead:0, isSolved:false };
const wrong = { id:42, subject:'高等数学', question:'UI验收：求函数 f(x)=x² 的导数，并说明计算步骤。', myAnswer:'x', correctAnswer:'2x', analysis:'使用幂函数求导法则。', status:0, source:'manual', questionType:'计算题', chapter:'导数', difficulty:'基础', errorReason:'公式理解', tag:'期中复习', knowledgePoints:'幂函数求导', note:'复习时完整写出过程', wrongCount:2, consecutiveCorrectCount:0, analyzeStatus:2, nextReviewTime:time };
const conversation = { id:8, peerUserId:2, peerNickname:'UI验收同学', peerAvatar:'', lastMessage:'UI验收聊天消息', lastMessageTime:time, unreadCount:2, contextType:'activity', contextId:42, contextTitle:item.title };
const room = { id:42, roomCode:'123456', title:'UI验收画室', status:'PLAYING', isOwner:true, isDrawer:true, currentTurn:1, totalTurns:6, currentRoundId:1, remainingSeconds:60, answerLength:2, drawerUserId:9, playerCount:2, maxPlayers:8, onlineCount:2, players:[{userId:9,nickname:'UI验收画手',owner:true,online:true,score:10},{userId:2,nickname:'UI验收猜词同学',online:true,score:8}], messages:[{id:1,userId:2,nickname:'UI验收同学',content:'准备开始！',createdAt:time}], strokes:[], pendingArtworks:[] };
let mode = 'data', owner = false, captcha = 'math';
const writes=[];
function fixture(url, method) {
 const p=url.pathname.replace(/^\/api\/(?:admin\/)?/,'/');
 if(p==='/site/config')return {siteName:'梧桐校园'};
 if(p==='/auth/captcha')return {captchaId:'ui-test',mode:captcha,expression:'3 + 5 = ?',imageBase64:'data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="44"><text x="12" y="30" font-size="22">ABCD</text></svg>').toString('base64')};
 if(p.includes('unread-count'))return {count:2};
 if(p.includes('ws-ticket'))return {ticket:'ui-test-only'};
 if(p==='/user/info')return user;
 if(p.match(/^\/user\/profile\/\d+/))return {...user,id:2,nickname:'UI验收同学主页'};
 if(p.match(/^\/user\/\d+\/(idles|posts|activities|lostfounds|reviews)$/))return mode==='empty'?[]:[{...item,type:p.includes('idles')?'idle':'activity',image,extra:'UI验收内容',score:5}];
 if(p==='/home/aggregate')return {activities:mode==='empty'?[]:[item],idleItems:mode==='empty'?[]:[item],lostFounds:mode==='empty'?[]:[item]};
 if(p==='/stats/overview')return {totalUsers:200,todayActiveUsers:24,todayAiCalls:18,pendingAudits:6};
 if(p==='/stats/trend')return {dates:['09-27','09-28','09-29'],userGrowth:[150,180,200],aiCalls:[12,16,18]};
 if(p==='/stats/module')return [{name:'活动',value:20},{name:'闲置',value:12}];
 if(p==='/stats/pie')return {lostStatus:[{name:'已找回',value:12},{name:'寻找中',value:8}]};
 if(p==='/stats/pending-counts')return {activity:2,idle:1,lostfound:1,post:1,partner:1,report:1,ai:2};
 if(p==='/ai/config')return Object.entries({base_url:'https://example.invalid',api_key:'',model_name:'ui-test',temperature:'0.7',max_tokens:'2048',timeout_ms:'60000',retry_times:'1',rate_limit_per_day:'100'}).map(([configKey,configValue])=>({configKey,configValue}));
 if(p==='/ai/prompt')return [{id:1,scene:'chat',name:'UI验收模板',content:'请回答 {question}',enabled:1}];
 if(p==='/system/config')return ['basic','site','audit','chat','upload','security'].flatMap((category,i)=>[
   {configKey:`ui_test_${category}_bool`,description:'UI验收开关设置',configValue:'true',valueType:'bool',category,sort:1},
   {configKey:`ui_test_${category}_int`,description:'UI验收数量设置',configValue:'10',valueType:'int',category,sort:2},
   {configKey:`ui_test_${category}_string`,description:'UI验收长说明设置',configValue:'UI验收内容'.repeat(8),valueType:'string',category,sort:3}
 ]);
 if(p==='/wrong-question/subjects')return ['高等数学','英语'];
 if(p==='/wrong-question/stats')return {total:2,pending:2,todayPending:2,mastered:0,weekReviewCount:1};
 if(p==='/wrong-question/weak-points')return {knowledgePoints:[{name:'幂函数求导',wrongCount:2,pendingCount:2}],errorReasons:[{reason:'公式理解',count:2}]};
 if(p==='/wrong-question/today')return [wrong];
 if(p.match(/^\/wrong-question\/\d+\/practice$/))return {id:21,question:'UI验收：f(x)=x³ 的导数是？',questionType:'单选题',options:['A. 3x²','B. x²'],answer:'A',analysis:'按照幂函数求导法则，指数乘系数，指数减一。'};
 if(p.includes('review-plan')||p.includes('explain')||p==='/ai/outline')return '## UI验收复习计划\n\n1. 理解公式\n2. 独立作答\n\n```js\nconst derivative = 2 * x;\n```';
 if(p.match(/^\/wrong-question\/\d+$/))return wrong;
 if(p==='/wrong-question/list')return {list:mode==='empty'?[]:[wrong,{...wrong,id:43}],total:mode==='empty'?0:22};
 if(p==='/chat/conversations')return mode==='empty'?[]:[conversation];
 if(p==='/chat/conversations/8')return conversation;
 if(p.includes('/chat/conversations/8/messages'))return method==='GET'?[]:{id:99,senderId:9,content:'UI验收消息',messageType:'text',createTime:time};
 if(p==='/ai/sessions')return mode==='empty'?[]:[{id:1,title:'UI验收 · 课程讨论',scene:'chat'},{id:2,title:'UI验收 · 论文思路',scene:'chat'}];
 if(p.match(/^\/ai\/session\/\d+\/messages$/))return [];
 if(p==='/ai/session')return {id:3,title:'新会话',scene:'chat'};
 if(p==='/draw-guess/rooms/recent'||p==='/draw-guess/records')return [];
 if(p==='/draw-guess/rooms')return {list:mode==='empty'?[]:[room],total:mode==='empty'?0:1};
 if(p==='/draw-guess/rooms/42')return room;
 if(p.includes('signin-report'))return {activityId:42,joinedCount:8,signinCount:6,signinRate:75,members:[{nickname:'UI验收同学',memberStatus:1,signed:true,signTime:time}]};
 if(p.includes('signin-qrcode'))return 'UI_TEST_SIGNIN_42';
 if(p==='/qa/42')return {question:item,answers:{list:[{...item,id:11,isAccepted:false}],total:1}};
 if(p.match(/^\/(activity|idle|lostfound|notice|post)\/42$/))return {...item,isOwner:owner,content:p.includes('notice')?'# UI验收公告\n\n这是公告正文。\n\n```js\nconsole.log("UI QA");\n```':item.content};
 if(p.includes('my-claim'))return null;
 if(p.includes('favorite/status'))return false;
 if(p.includes('answers'))return {list:[{...item,id:11,answer:item.content,adopted:false}],total:1};
 if(p.includes('members')||p.includes('claims'))return {list:[{...item,nickname:'UI验收报名同学',remark:'UI验收报名说明',memberStatus:0,signedIn:false}],total:1};
 if(p.includes('recommend'))return [item];
 if(method!=='GET')return null;
 return {list:mode==='empty'?[]:[item],total:mode==='empty'?0:24};
}
const students=[
 ['/', '.portal'], ['/search?q=校园','.result-sections'], ['/activity','.activity-page'], ['/activity/detail/42','.event-page'], ['/activity/publish','.publish'], ['/activity/publish?id=42','.publish'], ['/activity/my-signup','.my-signup'],
 ['/idle','.idle-list'], ['/idle/detail/42','.detail'], ['/idle/publish','.publish'], ['/idle/publish?id=42','.publish'], ['/idle/appointments','.my-appointments'],
 ['/lostfound','.lf-list'], ['/lostfound/detail/42','.detail'], ['/lostfound/publish','.publish'], ['/lostfound/publish?id=42','.publish'],
 ['/partner','.partner-list'], ['/partner/publish','.publish'], ['/qa','.qa-list'], ['/qa/my','.qa-list'], ['/qa/detail/42','.detail'], ['/qa/publish','.publish'],
 ['/social','.square'], ['/social?post=42','.square'], ['/notice','.notice-list'], ['/notice/detail/42','.notice-detail'], ['/message','.message-center'], ['/chat','.inbox'], ['/chat/8','.room'], ['/profile','.profile'], ['/user/2','.user-home'],
 ['/ai/chat','.ai-layout'], ['/ai/code','.codefix'], ['/ai/wrong','.wrongbook'], ['/campus-3d','.campus3d-page'], ['/draw-guess','.draw-guess-page'], ['/draw-guess/room/42','.draw-room-page'], ['/login','.login-card'], ['/register','.register-card'], ['/maintenance','.maintenance-card']
];
const admins=[['/dashboard','.dashboard'],['/audit/activity','.review-list'],['/audit/idle','.review-list'],['/audit/lostfound','.review-list'],['/audit/post','.review-list'],['/audit/partner','.review-list'],['/ai/audit','.kpi-grid'],['/content','.content-manage'],['/user','.toolbar'],['/report','.toolbar'],['/notice','.head'],['/notice/edit','.editor-row'],['/notice/edit/42','.editor-row'],['/ai/config','.head'],['/ai/logs','.toolbar'],['/system/config','.config-card'],['/system','.head'],['/login','.login-card']];
const report={kind:'Playwright API-isolated UI acceptance',liveBackend:false,measurements:[],actions:[],errors:[],limits:['Fixtures validate rendered UI and bound request shapes; real API, AI, OCR and multi-user WebSocket success require isolated real E2E.']};
function label(side,route){return side+'-'+(route.replace(/[^a-zA-Z0-9]+/g,'-')||'home')}
async function checkViewport(page,side,route,width,theme){
 await page.setViewportSize({width,height:900});
 await page.evaluate(theme=>{document.documentElement.dataset.theme=theme},theme);
 await page.waitForTimeout(30);
 const measurement=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,background:getComputedStyle(document.body).backgroundColor,overflow:[...document.querySelectorAll('main, .content, .tp-page-panel, .el-dialog')].filter(n=>n.getBoundingClientRect().width>innerWidth+1).map(n=>n.className)}));
 const record={side,route,width,theme,...measurement,pass:measurement.scroll<=width+1};
 report.measurements.push(record);
 if(!record.pass)console.log('OVERFLOW',JSON.stringify(record));
 if((width===390&&theme==='light')||(width===1440&&theme==='light'&&['/','/dashboard','/ai/chat','/ai/wrong','/draw-guess/room/42','/login','/audit/activity'].includes(route)))await page.screenshot({path:path.join(output,label(side,route)+`-${width}-${theme}.png`),fullPage:true});
}
async function action(name,fn){try{await fn();report.actions.push({name,pass:true});console.log('ACTION PASS',name);}catch(e){report.actions.push({name,pass:false,error:e.message});console.log('ACTION FAIL',name,e.message.slice(0,200));}}
async function closeLayer(page){const layer=page.locator('.el-dialog:visible,.el-drawer:visible').last();const button=layer.locator('.el-dialog__headerbtn,.el-drawer__close-btn').first();if(await button.count())await button.click();else await page.keyboard.press('Escape');await page.waitForTimeout(250);}
async function assertLayer(page,name){const layer=page.locator('.el-dialog:visible,.el-drawer:visible').last();await layer.waitFor();await page.waitForTimeout(350);const box=await layer.boundingBox();assert(box.x>=-1&&box.x+box.width<=391,'Layer must fit 390px viewport');assert(box.y>=-1&&box.y+box.height<=902,'Layer must fit viewport height');await page.screenshot({path:path.join(output,'dialog-'+name+'.png')});return layer;}
function contrast(a,b){const l=c=>{const channels=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722};const x=l(a),y=l(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await context.addInitScript(({user})=>{if(localStorage.getItem('ui-test-seeded'))return;localStorage.setItem('ui-test-seeded','true');localStorage.setItem('token','ui-test-only');localStorage.setItem('userInfo',JSON.stringify(user));localStorage.setItem('admin_token','ui-test-only');localStorage.setItem('admin_info',JSON.stringify({id:1,role:'super',nickname:'UI验收管理员'}));},{user});
 await context.route('**/api/**',async r=>{const url=new URL(r.request().url());if(!url.pathname.startsWith('/api/'))return r.continue();if(r.request().method()!=='GET')writes.push({path:url.pathname,method:r.request().method()});await r.fulfill({json:{code:200,data:fixture(url,r.request().method())}})});
 await context.routeWebSocket(/\/ws\//,ws=>ws.onMessage(()=>{}));
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push({url:page.url(),message:e.message}));
 page.setDefaultTimeout(8000);
 try{
  for(const [side,base,routes]of [['student',studentUrl,students],['admin',adminUrl,admins]])for(const [route,selector]of routes){
   await page.goto(base+route);await page.locator(selector).first().waitFor();await page.waitForTimeout(200);
   for(const width of [360,390,768,1024,1440,1920])await checkViewport(page,side,route,width,'light');
   for(const width of [390,1440])await checkViewport(page,side,route,width,'dark');
   console.log('PAGE',side,route);
  }
  await page.setViewportSize({width:390,height:900});await page.goto(studentUrl+'/');
  await action('学生完整功能面板：15 原导航叶子可见、关闭与键盘',async()=>{await page.locator('.tp-dock-all').click();const layer=await assertLayer(page,'student-services');assert.equal(await layer.locator('.nav-link:visible').count(),15);await page.keyboard.press('Escape');await layer.waitFor({state:'hidden'});});
  await action('学生搜索范围、关键词、提交在360px可见且传递q',async()=>{await page.setViewportSize({width:360,height:900});await page.locator('#campus-search-type').selectOption('activity');await page.locator('.header-search input').fill('校园');await page.locator('.search-submit').click();await page.waitForURL('**/activity?q=*');assert(await page.locator('.header-search').isVisible());});
  await page.setViewportSize({width:390,height:900});
  await action('活动报名对话框完整显示、提交保持原请求',async()=>{owner=false;await page.goto(studentUrl+'/activity/detail/42');await page.getByRole('button',{name:'立即报名',exact:true}).click();const layer=await assertLayer(page,'signup');await layer.locator('textarea').fill('UI验收报名说明');await layer.getByRole('button',{name:'确认报名'}).click();assert(writes.some(x=>x.path==='/api/activity/42/signup'&&x.method==='POST'));});
  await action('个人中心5个Tab与资料/密码弹窗',async()=>{await page.goto(studentUrl+'/profile');await page.locator('.profile-management .el-tabs__item').first().waitFor();assert.equal(await page.locator('.profile-management .el-tabs__item').count(),5);await page.getByRole('button',{name:'编辑资料',exact:true}).click();await assertLayer(page,'profile');await closeLayer(page);await page.getByRole('button',{name:'修改密码',exact:true}).click();await assertLayer(page,'password');await closeLayer(page);});
  await action('错题快速收录完整字段及高级信息展开',async()=>{await page.goto(studentUrl+'/ai/wrong');await page.getByRole('button',{name:/快速收录/}).click();const layer=await assertLayer(page,'wrong-quick-add');await layer.getByText('补充信息（可选）',{exact:true}).click();assert(await layer.getByText('我的答案',{exact:true}).isVisible());await closeLayer(page);});
  await action('错题复习抽屉：居中、原题、掌握等级和底部提交',async()=>{await page.getByRole('button',{name:'开始复习',exact:true}).first().click();await assertLayer(page,'wrong-review');assert(await page.locator('.el-drawer:visible .levels').isVisible());await closeLayer(page);});
  await action('错题练习抽屉：单选、提交、解析和显式保存',async()=>{await page.getByRole('button',{name:'AI 同类题',exact:true}).first().click();const layer=await assertLayer(page,'wrong-quiz');await layer.locator('input[type=radio]').first().check();await layer.getByRole('button',{name:/提交/}).click();assert(await layer.getByRole('button',{name:/保存/}).isVisible());await closeLayer(page);});
  await action('复习计划与薄弱报告原有生成弹窗',async()=>{await page.getByRole('button',{name:/AI 生成复习计划/}).click();await assertLayer(page,'wrong-plan');await closeLayer(page);await page.getByRole('button',{name:/生成薄弱点报告/}).click();await assertLayer(page,'wrong-outline');await closeLayer(page);});
  await action('AI历史处于上方、PDF入口和上传控件可达',async()=>{await page.goto(studentUrl+'/ai/chat');await page.locator('.ai-side').waitFor();const side=await page.locator('.ai-side').boundingBox(),main=await page.locator('.ai-main').boundingBox();assert(side.y+side.height<=main.y+1);await page.getByRole('tab',{name:/PDF/}).click();assert(await page.locator('button').filter({hasText:'上传PDF课件'}).isVisible());assert.equal(await page.locator('input[type=file][accept=".pdf"]').count(),1);});
  await action('后台完整15个导航叶子通过5组展开可见',async()=>{await page.goto(adminUrl+'/dashboard');const groups=page.locator('.nav-group-toggle');let total=0;for(let i=0;i<5;i++){if(await groups.nth(i).getAttribute('aria-expanded')!=='true')await groups.nth(i).click();total+=await page.locator('.nav-group-items:not(.is-collapsed) .nav-item:visible').count();}assert.equal(total,15);});
  const dialogs=[['/audit/activity','驳回','audit-reject'],['/ai/audit','维持拦截','ai-block'],['/content','签到报表','signin-report'],['/report','处置','report-handle'],['/ai/config','新建模板','prompt-edit'],['/system','新增子管理员','admin-edit']];
  for(const [route,button,name]of dialogs)await action('后台弹窗 '+name,async()=>{await page.goto(adminUrl+route);await page.getByRole('button',{name:new RegExp(button)}).first().click();await assertLayer(page,name);await closeLayer(page);});
  await action('后台普通审核员只保留原13个授权导航叶子',async()=>{await page.evaluate(()=>localStorage.setItem('admin_info',JSON.stringify({id:2,role:'audit',nickname:'UI验收审核员'})));await page.goto(adminUrl+'/dashboard');let total=0;const groups=page.locator('.nav-group-toggle');for(let i=0;i<5;i++){if(await groups.nth(i).getAttribute('aria-expanded')!=='true')await groups.nth(i).click();total+=await page.locator('.nav-group-items:not(.is-collapsed) .nav-item:visible').count();}assert.equal(total,13);await page.goto(adminUrl+'/system/config');await page.waitForURL('**/dashboard');});
  await action('3D校园手机顶部导览/全屏按钮未被场景遮挡',async()=>{await page.goto(studentUrl+'/campus-3d');await page.locator('.campus3d-header').waitFor();const result=await page.locator('.campus3d-header-actions button').evaluateAll(buttons=>buttons.map(button=>{const b=button.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return button.contains(hit)}));assert(result.length===2&&result.every(Boolean));await page.getByRole('button',{name:'校园导览'}).click();await page.locator('.map-dialog').waitFor();await page.keyboard.press('Escape');});
  await action('明暗主题实心主/成功/危险按钮文字对比度≥4.5',async()=>{await page.goto(studentUrl+'/ai/wrong');await page.locator('.wq-ops').first().waitFor();for(const theme of ['light','dark']){for(const type of ['primary','success','danger']){if(type==='danger'){await page.goto(adminUrl+'/audit/activity');await page.locator('.review-list').waitFor();await page.getByRole('button',{name:'驳回',exact:true}).first().click();await page.getByRole('button',{name:'确认驳回',exact:true}).waitFor()}else{await page.goto(studentUrl+'/ai/wrong');await page.locator('.wq-ops').first().waitFor()}await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.waitForTimeout(50);const button=page.locator(`.el-button--${type}:not(.is-plain):not(.is-disabled)`).first();for(const hover of [false,true]){if(hover)await button.hover();else await page.mouse.move(0,0);const colors=await button.evaluate(n=>{const rgb=value=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return 'rgb('+[...ctx.getImageData(0,0,1,1).data].slice(0,3).join(',')+')'};return {fg:rgb(getComputedStyle(n).color),bg:rgb(getComputedStyle(n).backgroundColor)}});assert(contrast(colors.fg,colors.bg)>=4.5,`${theme}/${type}/${hover?'hover':'normal'} contrast: ${JSON.stringify(colors)}`)}}}});
  await action('两端地图资源已实际加载、AI历史横向流动',async()=>{await page.goto(studentUrl+'/');await page.locator('.tp-hero-map').waitFor();assert(await page.locator('.tp-hero-map').evaluate(n=>n.complete&&n.naturalWidth>0));await page.goto(adminUrl+'/login');await page.setViewportSize({width:1440,height:900});assert(await page.locator('.tp-admin-login-art img').evaluate(n=>n.complete&&n.naturalWidth>0));await page.goto(studentUrl+'/ai/chat');await page.locator('.session-list').waitFor();assert.equal(await page.locator('.session-list').evaluate(n=>getComputedStyle(n).flexDirection),'row');await page.setViewportSize({width:390,height:900});});
  await action('个人资料/错题/游戏名片明暗文字可读及登录壳层不重叠',async()=>{for(const [route,container,text]of [['/profile','.profile-banner','.banner-info h3'],['/user/2','.home-banner','.banner-info h3'],['/ai/wrong','.wrong-banner','.banner-left h1'],['/draw-guess','.play-hero','.hero-copy h1']]){await page.goto(studentUrl+route);await page.locator(text).waitFor();for(const theme of ['light','dark']){await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.waitForTimeout(50);const fg=await page.locator(text).evaluate(n=>getComputedStyle(n).color);const bg=await page.locator(container).evaluate(n=>getComputedStyle(n).backgroundColor);assert(contrast(fg,bg)>=4.5,route+' '+theme);}}await page.goto(studentUrl+'/login');for(const width of [390,768]){await page.setViewportSize({width,height:900});const art=await page.locator('.auth-visual').boundingBox(),form=await page.locator('.auth-form-panel').boundingBox();assert(art.y>=0&&art.y+art.height<=form.y,'Login story and form overlap at '+width)}await page.setViewportSize({width:390,height:900});});
  await action('游客受限路由保持登录redirect',async()=>{await page.goto(studentUrl+'/');await page.locator('.portal').waitFor();await page.evaluate(()=>{localStorage.removeItem('token');localStorage.removeItem('userInfo')});await page.goto(studentUrl+'/ai/wrong');await page.waitForURL(url=>url.pathname==='/login'&&url.searchParams.get('redirect')==='/ai/wrong');});
  await action('图片和算术验证码两端保持可点击刷新',async()=>{for(const base of [studentUrl,adminUrl])for(const kind of ['math','image']){captcha=kind;await page.goto(base+'/login');await page.locator(kind==='math'?'.captcha-math':'.captcha-img').click();assert(await page.locator(kind==='math'?'.captcha-math':'.captcha-img').isVisible());}});
  await action('登录页200%缩放等效720px/缩小动态效果',async()=>{await page.setViewportSize({width:720,height:450});await page.goto(studentUrl+'/login');const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert(!overflow);await page.screenshot({path:path.join(output,'student-login-zoom200.png'),fullPage:true});});
 }catch(e){report.actions.push({name:'Route sweep execution',pass:false,error:e.stack});console.log('SWEEP ERROR',e.message);}
 finally{report.writes=writes;report.counts={measurements:report.measurements.length,overflowFailures:report.measurements.filter(x=>!x.pass).length,actions:report.actions.length,actionFailures:report.actions.filter(x=>!x.pass).length,pageErrors:report.errors.length};fs.writeFileSync(path.join(output,'ui-browser-report.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report.counts));if(report.counts.overflowFailures||report.counts.actionFailures||report.counts.pageErrors)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1});
