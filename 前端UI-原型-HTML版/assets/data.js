/* 演示数据。全部为虚构示例，不读取原项目数据库。 */
window.CAMPUS = {
  activity: [
    {id:1,title:'落日之后，一起听见青春',category:'文艺',image:'06-音乐节海报.png',subtitle:'2026 秋日草坪音乐节',location:'南区大草坪',time:'09.25 周五 · 18:30',count:86,total:120,host:'校园音乐社',status:'报名中',description:'把耳机里的旋律，变成草坪上的相遇。校园乐队、自由舞台和落日集市，等你一起来。请提前 20 分钟到场，带上你的学生证和好心情。'},
    {id:2,title:'三对三篮球赛，等你来组队',category:'运动',image:'07-篮球赛海报.png',location:'东区篮球场',time:'10.08 周四 · 14:00',count:24,total:36,host:'校篮球协会',status:'报名中',description:'不限院系，热爱就可以上场。自由组队或现场匹配队友，享受运动与合作的快乐。'},
    {id:3,title:'把温暖送到身边：周末志愿行',category:'公益',image:'08-敬老院海报.png',location:'南门集合',time:'09.27 周日 · 09:00',count:18,total:30,host:'青年志愿者协会',status:'报名中',description:'走进社区敬老院，用陪伴传递温暖。活动提供志愿服务时长记录，集合后统一出发。'},
    {id:4,title:'在图书馆，开启一周共读',category:'学习',image:'11-图书馆.png',location:'图书馆三楼',time:'09.28 周一 · 19:00',count:12,total:20,host:'梧桐读书会',status:'报名中',description:'分享最近读到的好书，认识同样喜欢阅读的朋友。无需准备长篇演讲，带一本书即可。'},
    {id:5,title:'晚风夜跑计划 · 第 12 期',category:'运动',image:'12-夜跑操场.png',location:'北区田径场',time:'09.29 周二 · 20:00',count:30,total:50,host:'校园跑团',status:'报名中',description:'一起慢跑三公里，给忙碌的一天一个轻松的结尾。适合初学者，现场安排热身。'},
    {id:6,title:'创意碰撞：校园灵感工作坊',category:'学习',image:'01-活动海报.png',location:'创新中心 201',time:'09.30 周三 · 14:00',count:40,total:40,host:'创新实践中心',status:'已满员',description:'围绕校园生活提出新点子，在跨专业交流中完成一个小小的创意方案。'}
  ],
  idle:[
    {id:1,title:'九成新机械键盘 · 茶轴',category:'数码',image:'02-机械键盘.png',location:'北区宿舍',time:'20 分钟前',host:'陈同学',status:'可预约',exchange:'想换一副羽毛球拍',description:'87 键有线机械键盘，按键功能正常。毕业整理闲置，希望换一副羽毛球拍，也欢迎私信商量。'},
    {id:2,title:'陪我骑过校园的山地自行车',category:'出行',image:'03-山地自行车.png',location:'西门车棚',time:'1 小时前',host:'周同学',status:'可预约',exchange:'想换学习资料或运动装备',description:'刹车和变速正常，日常上课代步很方便。支持校内当面查看，互换意向请先私信。'},
    {id:3,title:'羽毛球拍一对，给热爱运动的你',category:'运动',image:'09-羽毛球拍.png',location:'东区体育馆',time:'2 小时前',host:'林同学',status:'可预约',exchange:'想换一本好书',description:'含拍套，适合日常练习。希望物品继续被使用，也希望交到爱运动的朋友。'}
  ],
  lostfound:[
    {id:1,title:'在图书馆捡到一枚银色 U 盘',category:'拾到物品',image:'04-银色U盘.png',location:'图书馆二楼靠窗座位',time:'09.17 · 10:30',host:'许同学',status:'待认领',description:'一枚银色金属 U 盘，已交至图书馆服务台。认领时请描述容量、外观细节或内部文件特征。'},
    {id:2,title:'寻找一张遗落的学生卡',category:'寻找失物',image:'10-学生卡.png',location:'一食堂至教学楼沿线',time:'09.16 · 18:00',host:'吴同学',status:'寻找中',description:'昨天下课后遗失学生卡，卡套为浅绿色。若有拾到的同学，请通过站内私信联系。'}
  ],
  social:[
    {id:1,title:'今天的校园晚霞，值得暂停五分钟',category:'校园日常',image:'05-校园晚霞.png',location:'梧桐大道',host:'小林同学',time:'18 分钟前',likes:128,description:'从图书馆出来刚好赶上日落。原来最好的放松，就是在熟悉的校园里慢慢走一走。你今天也看到这片晚霞了吗？'},
    {id:2,title:'寻找一起备考的自习搭子',category:'学习交流',image:'11-图书馆.png',location:'图书馆',host:'阿远',time:'1 小时前',likes:42,description:'每周一三五晚上在图书馆复习高数，有没有同学一起互相监督？各自努力，也一起进步。'}
  ],
  notices:[{id:1,title:'关于 2026 年秋季学期校园活动报名的通知',type:'校园通知',date:'2026-09-17',body:'秋季学期校园活动报名通道现已开放。同学们可通过校园活动页面查看详情、提交报名，并在审核通过后按时参加。请关注活动地点与签到要求。'}, {id:2,title:'图书馆国庆假期开放时间安排',type:'服务公告',date:'2026-09-16',body:'假期期间图书馆开放时间为 08:00—22:00。部分阅览区进行设备维护，请以现场公告为准，合理安排学习时间。'}, {id:3,title:'文明互换倡议：让闲置遇见新的主人',type:'社区倡议',date:'2026-09-15',body:'请如实描述物品状态，提前沟通互换要求，优先在校内公共区域见面。完成互换后，欢迎留下真实、友善的评价。'}],
  wrong:[{id:1,title:'求函数 f(x) = x · eˣ 的导数',subject:'高等数学',point:'乘积求导法则',answer:'f′(x) = eˣ + x·eˣ = (1+x)eˣ',status:'待复习'}, {id:2,title:'二叉树前序遍历的递归实现',subject:'数据结构',point:'递归边界与遍历顺序',answer:'先访问根节点，再递归遍历左子树与右子树；空节点直接返回。',status:'待复习'}, {id:3,title:'区分 affect 与 effect 的用法',subject:'大学英语',point:'词性与语境辨析',answer:'affect 通常作动词，表示影响；effect 通常作名词，表示结果或效果。',status:'已掌握'}]
};
