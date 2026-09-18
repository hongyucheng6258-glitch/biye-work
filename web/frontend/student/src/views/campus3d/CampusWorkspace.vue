<template>
  <div class="workspace-layer" role="presentation" @click.self="close">
    <section ref="dialog" class="workspace-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId" @keydown.escape.prevent="close">
      <header class="workspace-header">
        <div class="workspace-heading">
          <span class="workspace-symbol" :style="{ color: item.color, background: `${item.color}16` }">{{ iconGlyph }}</span>
          <div>
            <span class="workspace-breadcrumb">{{ groupName }} · {{ item.room }}</span>
            <h2 :id="titleId">{{ item.name }}</h2>
          </div>
          <span class="workspace-live"><i></i>学生端实时数据</span>
        </div>
        <button ref="closeButton" class="workspace-close" type="button" @click="close">
          <span aria-hidden="true">←</span>返回房间 <kbd>Esc</kbd>
        </button>
      </header>

      <div class="workspace-body">
        <div v-if="authRequired" class="workspace-auth">
          <strong>登录后即可使用此项服务</strong>
          <span>内容仍然来自学生端，登录后会保留当前房间。</span>
          <button type="button" class="workspace-primary" @click="goLogin">前往登录</button>
        </div>

        <div v-else-if="loading" class="workspace-state"><span class="loader-ring"></span><strong>正在同步学生端数据</strong><span>请稍候，马上就好</span></div>
        <div v-else-if="error" class="workspace-state workspace-error"><strong>内容暂时无法加载</strong><p>{{ error }}</p><button type="button" class="workspace-primary" @click="load">重新加载</button></div>

        <template v-else>
          <section v-if="serviceId === 'portal'" class="portal-board">
            <div class="portal-welcome">
              <div><span class="workspace-kicker">学生端数据 · 综合门户</span><h1>校园生活，从这里开始。</h1><p>活动、公告和你的校园进度，都从学生端实时同步。</p></div>
              <div class="portal-orb" aria-hidden="true">◆</div>
            </div>
            <div class="portal-stats">
              <div><span>近期活动</span><strong>{{ portalData.activities.length }}</strong><small>条</small></div>
              <div><span>闲置物品</span><strong>{{ portalData.idleItems.length }}</strong><small>件</small></div>
              <div><span>失物信息</span><strong>{{ portalData.lostFounds.length }}</strong><small>条</small></div>
              <div><span>公告提醒</span><strong>{{ portalNotices.length }}</strong><small>条</small></div>
            </div>
            <div class="portal-columns">
              <section><div class="workspace-section-title"><h3>校园正在发生</h3><span>实时接口</span></div><button v-for="notice in portalNotices" :key="notice.id" class="portal-row" type="button" @click="openNotice(notice)"><span>{{ formatDate(notice.publishTime || notice.createTime || notice.date) }}</span><strong>{{ notice.title }}</strong><b>→</b></button><p v-if="!portalNotices.length" class="workspace-empty">暂无公告</p></section>
              <section><div class="workspace-section-title"><h3>下一场活动</h3><span>学生端活动</span></div><button v-for="activity in portalData.activities.slice(0, 3)" :key="activity.id" class="portal-row portal-event" type="button" @click="openDetail(activity)"><span>{{ formatDate(activity.startTime) }}</span><strong>{{ activity.title }}</strong><b>{{ activity.location || '地点待定' }}</b></button><p v-if="!portalData.activities.length" class="workspace-empty">暂无活动</p></section>
            </div>
          </section>

          <section v-else-if="serviceId === 'aichat'" class="ai-board">
            <aside class="ai-prompts"><span class="ai-mark">✦</span><h3>学习路上，多一种思考方式</h3><p>选择一个问题，体验学生端 AI 答疑。</p><button v-for="prompt in quickPrompts" :key="prompt" type="button" @click="question = prompt; sendAi()">{{ prompt }}</button></aside>
            <div class="ai-chat"><div class="ai-chat-head"><strong>学习助手</strong><span>学生端会话</span></div><div ref="aiHistory" class="ai-history"><div v-if="!messages.length" class="workspace-empty">还没有会话，写下你的问题吧。</div><div v-for="(message, index) in messages" :key="index" class="ai-bubble" :class="{ mine: message.role === 'user' }">{{ message.content }}</div></div><form class="ai-input" @submit.prevent="sendAi"><input v-model="question" maxlength="1000" placeholder="输入学习问题…"><button class="workspace-primary" type="submit" :disabled="asking">{{ asking ? '生成中…' : '发送' }}</button></form></div>
          </section>

          <section v-else-if="serviceId === 'code'" class="code-board">
            <div class="code-controls"><label>语言<select v-model="codeLanguage"><option v-for="language in languages" :key="language" :value="language">{{ language }}</option></select></label><button class="workspace-primary" type="button" :disabled="fixing" @click="runCodeFix">{{ fixing ? '分析中…' : '演示代码修复' }}</button></div>
            <div class="code-grid"><label class="code-panel"><span><b>待检查的代码</b><small>{{ codeLanguage }}</small></span><textarea v-model="codeInput" spellcheck="false"></textarea></label><section class="code-panel"><span><b>修复结果</b><small>学生端 AI</small></span><pre v-if="codeResult">{{ codeResult }}</pre><div v-else class="workspace-empty">输入代码后点击“演示代码修复”</div></section></div>
          </section>

          <section v-else-if="serviceId === 'wrong'" class="list-board">
            <div class="workspace-toolbar"><div><span class="workspace-kicker">AI 学习 · C103</span><h1>让每一次出错，都有收获</h1><p>错题数据直接来自学生端错题本。</p></div><input v-model="keyword" placeholder="搜索错题" @keyup.enter="resetAndLoad"></div>
            <div class="workspace-list"><article v-for="row in records" :key="row.id" class="workspace-card"><div class="card-top"><span class="card-tag">{{ row.subject || '错题' }}</span><small>{{ row.chapter || row.knowledgePoints || '待复习' }}</small></div><h3>{{ row.title || row.question }}</h3><p>{{ row.question }}</p><div class="card-actions"><button class="workspace-secondary" type="button" @click="toggleDetail(row)">{{ detailId === row.id ? '收起解析' : '查看解析' }}</button><button class="workspace-primary small" type="button" @click="reviewWrong(row)">开始复习</button></div><div v-if="detailId === row.id" class="card-detail"><strong>答案与解析</strong><p>{{ row.analysis || row.correctAnswer || '暂无解析' }}</p></div></article></div><p v-if="!records.length" class="workspace-empty">暂无错题数据</p><nav v-if="pageCount > 1" class="workspace-pagination" aria-label="错题分页"><button type="button" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button><span>第 {{ page }} / {{ pageCount }} 页</span><button type="button" :disabled="page >= pageCount" @click="changePage(page + 1)">下一页</button></nav>
          </section>

          <section v-else class="list-board">
            <div class="workspace-toolbar"><div><span class="workspace-kicker">{{ groupName }} · {{ item.room }}</span><h1>{{ item.name }}</h1><p>{{ profile.prompt }} · 数据与学生端保持同步。</p></div><div class="toolbar-actions"><div v-if="categories.length" class="workspace-tabs"><button v-for="tab in categories" :key="tab" type="button" :class="{ active: category === tab }" @click="selectCategory(tab)">{{ tab }}</button></div><input v-if="supportsSearch" v-model="keyword" :placeholder="searchPlaceholder" @keyup.enter="resetAndLoad"></div></div>
            <div class="workspace-list"><article v-for="row in records" :key="row.id" class="workspace-card"><div class="card-top"><span class="card-tag">{{ cardTag(row) }}</span><small>{{ cardMeta(row) }}</small></div><h3>{{ cardTitle(row) }}</h3><p>{{ cardSummary(row) }}</p><div class="card-footer"><span>{{ cardFoot(row) }}</span><div class="card-actions"><button class="workspace-secondary" type="button" @click="toggleDetail(row)">{{ detailId === row.id ? '收起详情' : '查看详情' }}</button><button v-if="serviceId === 'activity'" class="workspace-primary small" type="button" :disabled="busyId === row.id" @click="toggleActivity(row)">{{ isSigned(row) ? '取消报名' : '报名参加' }}</button><button v-if="serviceId === 'idle'" class="workspace-primary small" type="button" :disabled="busyId === row.id" @click="reserveIdle(row)">预约互换</button><button v-if="serviceId === 'square'" class="workspace-primary small" type="button" :disabled="busyId === row.id" @click="toggleLike(row)">{{ row.liked ? '取消点赞' : '点赞' }}</button><button v-if="serviceId === 'message' && !row.isRead" class="workspace-primary small" type="button" :disabled="busyId === row.id" @click="readMessage(row)">标为已读</button></div></div><div v-if="detailId === row.id" class="card-detail"><strong>{{ detailTitle(row) }}</strong><p>{{ detailText(row) }}</p><form v-if="serviceId === 'qa'" class="inline-form" @submit.prevent="submitAnswer(row)"><input v-model="answerText[row.id]" placeholder="写下你的回答…" required><button class="workspace-primary small" type="submit">提交回答</button></form><form v-if="serviceId === 'square'" class="inline-form" @submit.prevent="submitComment(row)"><input v-model="commentText[row.id]" placeholder="写一条评论…" required><button class="workspace-primary small" type="submit">发表评论</button></form></div></article></div><p v-if="!records.length" class="workspace-empty">暂无符合条件的数据</p><nav v-if="pageCount > 1" class="workspace-pagination" aria-label="内容分页"><button type="button" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button><span>第 {{ page }} / {{ pageCount }} 页</span><button type="button" :disabled="page >= pageCount" @click="changePage(page + 1)">下一页</button></nav></section>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import { useMessageStore } from '../../store/message'
import { homeAggregate, listNotice, noticeDetail } from '../../api/notice'
import { listActivity, signupActivity, cancelActivitySignup } from '../../api/activity'
import { listIdle, appoint } from '../../api/idle'
import { listPartner } from '../../api/partner'
import { listLostFound } from '../../api/lostfound'
import { listQuestion, answerQuestion } from '../../api/qa'
import { listPost, likePost, unlikePost, commentPost } from '../../api/post'
import { listMessage, markRead } from '../../api/message'
import { listWrong, submitReview } from '../../api/wrong'
import { codeFix, listSessions, createSession, listMessages, chatStream } from '../../api/ai'
import { GROUPS, SERVICES, getRoomProfile } from '../../features/campus3d/campus-data.js'

const props = defineProps({ serviceId: { type: String, required: true } })
const emit = defineEmits(['close'])
const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()
const dialog = ref(null)
const closeButton = ref(null)
const aiHistory = ref(null)
const loading = ref(false)
const error = ref('')
const authRequired = ref(false)
const records = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 6
const keyword = ref('')
const category = ref('全部')
const detailId = ref(null)
const detailRecord = ref(null)
const busyId = ref(null)
const answerText = ref({})
const commentText = ref({})
const portalData = ref({ activities: [], idleItems: [], lostFounds: [] })
const portalNotices = ref([])
const messages = ref([])
const sessions = ref([])
const currentSession = ref(null)
const question = ref('')
const asking = ref(false)
const codeLanguage = ref('javascript')
const codeInput = ref('const numbers = [1, 2, 3];\nfor (let i = 0; i <= numbers.length; i++) {\n  console.log(numbers[i]);\n}')
const codeResult = ref('')
const fixing = ref(false)
const languages = ['javascript', 'python', 'java', 'cpp', 'go', 'sql']
const quickPrompts = ['帮我梳理一周复习计划', '解释一下复合函数求导', '如何开始一个前端项目？']
const serviceMap = new Map(SERVICES.map((service) => [service.id, service]))
const groupMap = new Map(GROUPS.map((group) => [group.id, group]))
const item = computed(() => serviceMap.get(props.serviceId) || SERVICES[0])
const profile = computed(() => getRoomProfile(props.serviceId))
const groupName = computed(() => groupMap.get(item.value.group)?.name || '校园总览')
const titleId = computed(() => `workspace-title-${props.serviceId}`)
const iconGlyph = computed(() => ({ calendar: '▣', bag: '◇', users: '◌', search: '⌕', help: '?', chat: '◍', megaphone: '◁', bell: '♧', spark: '✦', code: '</>', book: '▤', home: '◆' }[item.value.icon] || '◆'))
const supportsSearch = computed(() => !['portal', 'aichat', 'code'].includes(props.serviceId))
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const searchPlaceholder = computed(() => ({ activity: '搜索活动或地点', idle: '搜索闲置物品', partner: '搜索学习目标', lost: '搜索物品或地点', qa: '搜索问题', square: '搜索动态', notice: '搜索公告', message: '搜索消息' }[props.serviceId] || '搜索内容'))
const categories = computed(() => ({ activity: ['全部', '学习交流', '体育运动', '文艺娱乐', '志愿服务', '竞赛组队'], idle: ['全部', '教材书籍', '数码电子', '生活用品', '运动器材'], qa: ['全部', '学习经验', '课程作业', '校园生活'], notice: ['全部', '校园事务', '学习资源'], message: ['全部', '系统通知', '互动消息', '审核结果'], wrong: ['全部', '待复习', '已掌握'] }[props.serviceId] || []))

function close() { emit('close') }
function goLogin() { router.push({ path: '/login', query: { redirect: '/campus-3d' } }) }
function requireLogin() { if (userStore.isLoggedIn) return true; authRequired.value = true; return false }
function unwrapList(result) { const list = Array.isArray(result) ? result : (result?.list || result?.records || []); return { list, total: Number(result?.total ?? list.length) } }
function formatDate(value) { if (!value) return '待定'; const text = String(value); return text.length >= 10 ? text.slice(5, 10).replace('-', '/') : text }
function resetState() { loading.value = false; error.value = ''; authRequired.value = false; records.value = []; total.value = 0; page.value = 1; keyword.value = ''; category.value = '全部'; detailId.value = null; detailRecord.value = null }
function resetAndLoad() { page.value = 1; detailId.value = null; load() }
function selectCategory(value) { category.value = value; resetAndLoad() }
function changePage(value) { page.value = value; detailId.value = null; load() }

async function loadPortal() {
  const [aggregate, noticeResult] = await Promise.all([homeAggregate(), listNotice({ pageNum: 1, pageSize: 5 })])
  portalData.value = { activities: aggregate?.activities || [], idleItems: aggregate?.idleItems || [], lostFounds: aggregate?.lostFounds || [] }
  portalNotices.value = unwrapList(noticeResult).list
}

async function loadAi() {
  if (!requireLogin()) return
  sessions.value = await listSessions('chat')
  if (!sessions.value.length) { currentSession.value = await createSession({ scene: 'chat', title: '3D校园答疑' }); sessions.value = [currentSession.value] }
  else currentSession.value = sessions.value[0]
  const result = await listMessages(currentSession.value.id, 1, 50)
  messages.value = (result?.list || []).reverse().map((message) => ({ role: message.role, content: message.content }))
}

async function load() {
  resetAuthOnly()
  loading.value = true; error.value = ''
  try {
    if (props.serviceId === 'portal') await loadPortal()
    else if (props.serviceId === 'aichat') await loadAi()
    else if (props.serviceId === 'code') return
    else {
      const params = { pageNum: page.value, pageSize, keyword: keyword.value || undefined }
      const selected = category.value !== '全部' ? category.value : undefined
      let result
      if (props.serviceId === 'activity') result = unwrapList(await listActivity({ ...params, category: selected }))
      if (props.serviceId === 'idle') result = unwrapList(await listIdle({ ...params, category: selected }))
      if (props.serviceId === 'partner') result = unwrapList(await listPartner(params))
      if (props.serviceId === 'lost') result = unwrapList(await listLostFound(params))
      if (props.serviceId === 'qa') result = unwrapList(await listQuestion({ ...params, category: selected }))
      if (props.serviceId === 'square') result = unwrapList(await listPost(params))
      if (props.serviceId === 'notice') result = unwrapList(await listNotice({ ...params, category: selected }))
      if (props.serviceId === 'message') result = unwrapList(await listMessage({ ...params, type: selected }))
      if (props.serviceId === 'wrong') result = unwrapList(await listWrong({ ...params, status: selected === '待复习' ? 0 : selected === '已掌握' ? 1 : undefined }))
      records.value = result?.list || []
      total.value = Number(result?.total ?? records.value.length)
    }
  } catch (err) { error.value = err?.message || '学生端数据加载失败' }
  finally { loading.value = false; nextTick(() => closeButton.value?.focus({ preventScroll: true })) }
}

function resetAuthOnly() { authRequired.value = false }
function cardTitle(row) { return row.title || row.name || row.question || row.content || '校园服务内容' }
function cardSummary(row) { return row.description || row.content || row.body || row.question || row.detail || row.intro || '学生端同步内容' }
function cardMeta(row) { return row.category || row.typeName || row.department || row.subject || row.goal || row.statusText || '实时数据' }
function cardTag(row) { if (props.serviceId === 'message') return row.typeName || row.type || '消息'; if (props.serviceId === 'lost') return row.type === 0 || row.type === '寻物' ? '寻物' : '招领'; return row.category || row.subject || item.value.name }
function cardFoot(row) { return row.location || row.place || row.startTime ? `${row.location || row.place || ''}${row.startTime ? ` · ${formatDate(row.startTime)}` : ''}` : row.authorName || row.nickname || row.author || '学生端数据' }
function detailTitle(row) { return detailRecord.value?.title || cardTitle(row) }
function detailText(row) { return detailRecord.value?.content || detailRecord.value?.body || row.description || row.content || row.body || row.analysis || row.correctAnswer || '暂无更多详情' }
function isSigned(row) { return Boolean(row.signedUp ?? row.isSignup ?? row.registered ?? row.hasSignup) }
function toggleDetail(row) { detailId.value = detailId.value === row.id ? null : row.id; detailRecord.value = null; if (detailId.value && props.serviceId === 'notice') loadNoticeDetail(row) }
async function loadNoticeDetail(row) { try { detailRecord.value = await noticeDetail(row.id) } catch { detailRecord.value = row } }
function openNotice(row) { detailId.value = row.id; detailRecord.value = row; if (props.serviceId !== 'portal') loadNoticeDetail(row) }
function openDetail(row) { detailId.value = row.id; detailRecord.value = row }

async function toggleActivity(row) { if (!requireLogin()) return; busyId.value = row.id; try { if (isSigned(row)) await cancelActivitySignup(row.id); else await signupActivity(row.id, {}); ElMessage.success(isSigned(row) ? '已取消报名' : '报名成功'); await load() } catch (err) { ElMessage.error(err?.message || '活动操作失败') } finally { busyId.value = null } }
async function reserveIdle(row) { if (!requireLogin()) return; busyId.value = row.id; try { await appoint(row.id, { message: '通过3D校园服务台发起预约' }); ElMessage.success('预约申请已提交'); await load() } catch (err) { ElMessage.error(err?.message || '预约失败') } finally { busyId.value = null } }
async function toggleLike(row) { if (!requireLogin()) return; busyId.value = row.id; try { if (row.liked) { await unlikePost(row.id); row.liked = false; row.likeCount = Math.max(0, Number(row.likeCount || 0) - 1) } else { await likePost(row.id); row.liked = true; row.likeCount = Number(row.likeCount || 0) + 1 } } catch (err) { ElMessage.error(err?.message || '点赞失败') } finally { busyId.value = null } }
async function submitComment(row) { if (!requireLogin()) return; const content = commentText.value[row.id]?.trim(); if (!content) return; busyId.value = row.id; try { await commentPost(row.id, content); commentText.value[row.id] = ''; ElMessage.success('评论已提交'); } catch (err) { ElMessage.error(err?.message || '评论失败') } finally { busyId.value = null } }
async function submitAnswer(row) { if (!requireLogin()) return; const content = answerText.value[row.id]?.trim(); if (!content) return; busyId.value = row.id; try { await answerQuestion(row.id, { content }); answerText.value[row.id] = ''; ElMessage.success('回答已提交'); await load() } catch (err) { ElMessage.error(err?.message || '回答失败') } finally { busyId.value = null } }
async function readMessage(row) { if (!requireLogin()) return; busyId.value = row.id; try { await markRead(row.id); row.isRead = 1; messageStore.refreshUnread(); } catch (err) { ElMessage.error(err?.message || '消息操作失败') } finally { busyId.value = null } }
async function reviewWrong(row) { if (!requireLogin()) return; busyId.value = row.id; try { await submitReview({ wrongQuestionId: row.id, masteryLevel: 2, isCorrect: 1 }); ElMessage.success('复习记录已同步'); await load() } catch (err) { ElMessage.error(err?.message || '复习记录提交失败') } finally { busyId.value = null } }

async function sendAi() { if (!requireLogin()) return; const text = question.value.trim(); if (!text || asking.value) return; asking.value = true; question.value = ''; messages.value.push({ role: 'user', content: text }); const answer = { role: 'assistant', content: '' }; messages.value.push(answer); await nextTick(); aiHistory.value?.scrollTo({ top: aiHistory.value.scrollHeight }); try { await chatStream({ sessionId: currentSession.value?.id, question: text }, { onDelta: (delta) => { answer.content += delta; }, onDone: () => {}, onError: (_code, message) => { answer.content = answer.content || `⚠️ ${message}` } }) } catch (err) { answer.content = answer.content || `⚠️ ${err?.message || 'AI服务暂时不可用'}` } finally { asking.value = false; await nextTick(); aiHistory.value?.scrollTo({ top: aiHistory.value.scrollHeight }) } }
async function runCodeFix() { if (!requireLogin()) return; if (!codeInput.value.trim()) return; fixing.value = true; codeResult.value = ''; try { const result = await codeFix({ code: codeInput.value, language: codeLanguage.value, extra: '' }); codeResult.value = typeof result === 'string' ? result : (result?.answer || '暂无纠错结果') } catch (err) { codeResult.value = `⚠️ ${err?.message || '代码纠错失败'}` } finally { fixing.value = false } }

watch(() => props.serviceId, () => { resetState(); load() }, { immediate: true })
onMounted(() => nextTick(() => closeButton.value?.focus({ preventScroll: true })))

</script>

<style scoped>
.workspace-layer { position: absolute; inset: 0; z-index: 42; display: grid; place-items: center; padding: 28px; background: rgba(16, 43, 75, .42); backdrop-filter: blur(10px); }
.workspace-dialog { width: min(1180px, 100%); height: min(850px, 100%); display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(255,255,255,.9); border-radius: 22px; background: var(--surface, #fff); box-shadow: 0 30px 90px rgba(9,38,75,.28); color: var(--ink, #17395e); }
.workspace-header { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 20px 24px; border-bottom: 1px solid var(--line); background: rgba(255,255,255,.92); }
.workspace-heading { display: flex; align-items: center; gap: 13px; min-width: 0; }
.workspace-symbol { width: 48px; height: 48px; display: grid; place-items: center; flex: none; border-radius: 14px; font-size: 22px; font-weight: 800; }
.workspace-breadcrumb, .workspace-kicker { display: block; color: var(--ink-3, #8298b3); font-size: 11px; }
.workspace-header h2 { margin: 3px 0 0; color: var(--ink, #17395e); font-size: 22px; }
.workspace-live { display: inline-flex; align-items: center; gap: 6px; margin-left: 10px; color: #4b8d7d; font-size: 10px; white-space: nowrap; }
.workspace-live i { width: 7px; height: 7px; border-radius: 50%; background: #44bf9b; }
.workspace-close { display: inline-flex; align-items: center; gap: 7px; flex: none; min-height: 39px; padding: 0 13px; border: 1px solid var(--brand-line); border-radius: 10px; background: var(--surface); color: var(--brand); cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; }
.workspace-close:hover { background: var(--brand-soft); }
.workspace-close kbd { padding: 2px 6px; border: 1px solid var(--line); border-radius: 5px; color: var(--ink-3); font-size: 10px; font-weight: 500; }
.workspace-body { min-height: 0; flex: 1; overflow: auto; padding: 28px 32px 36px; background: linear-gradient(180deg, #fbfdff, #f4f8fd); }
.workspace-state { min-height: 100%; display: grid; place-content: center; justify-items: center; gap: 9px; text-align: center; color: var(--ink-2); }
.workspace-state span:last-child { color: var(--ink-3); font-size: 12px; }.workspace-state p { max-width: 420px; margin: 0; color: var(--ink-3); font-size: 13px; }
.workspace-error { color: #24476c; }.loader-ring { width: 30px; height: 30px; border: 3px solid rgba(40,100,234,.16); border-top-color: var(--brand); border-radius: 50%; animation: campus-workspace-spin .8s linear infinite; }@keyframes campus-workspace-spin { to { transform: rotate(360deg); } }
.workspace-primary, .workspace-secondary { display: inline-flex; align-items: center; justify-content: center; min-height: 35px; padding: 0 13px; border-radius: 8px; cursor: pointer; font: inherit; font-size: 12px; font-weight: 700; }.workspace-primary { border: 1px solid var(--brand); background: var(--brand); color: #fff; }.workspace-primary:hover { background: var(--brand-strong); }.workspace-primary:disabled { cursor: wait; opacity: .55; }.workspace-primary.small, .workspace-secondary { min-height: 30px; padding: 0 10px; font-size: 11px; }.workspace-secondary { border: 1px solid var(--line); background: #fff; color: var(--brand); }.workspace-secondary:hover { border-color: var(--brand-line); background: var(--brand-soft); }
.workspace-auth { display: grid; place-content: center; justify-items: center; gap: 10px; min-height: 100%; text-align: center; }.workspace-auth span { color: var(--ink-3); font-size: 13px; }
.portal-welcome { display: flex; align-items: center; justify-content: space-between; gap: 30px; padding: 30px 34px; border-radius: 18px; background: linear-gradient(105deg, #eaf3ff, #f7fbff 70%); }.portal-welcome h1, .list-board h1 { margin: 7px 0 9px; color: #17395e; font-size: clamp(25px, 3vw, 36px); letter-spacing: -.8px; }.portal-welcome p, .list-board .workspace-toolbar p { margin: 0; color: var(--ink-3); font-size: 13px; }.portal-orb { width: 85px; height: 85px; display: grid; place-items: center; border-radius: 28px; background: var(--brand); color: #fff; font-size: 28px; box-shadow: 0 14px 30px rgba(40,100,234,.22); }
.portal-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0; }.portal-stats > div { padding: 17px; border: 1px solid var(--line); border-radius: 13px; background: #fff; }.portal-stats span, .portal-stats small { color: var(--ink-3); font-size: 11px; }.portal-stats strong { margin-left: 12px; color: var(--brand); font-size: 26px; }.portal-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }.portal-columns > section { padding: 20px; border: 1px solid var(--line); border-radius: 15px; background: #fff; }.workspace-section-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }.workspace-section-title h3 { color: var(--ink); font-size: 15px; }.workspace-section-title span { color: var(--ink-3); font-size: 10px; }.portal-row { width: 100%; display: grid; grid-template-columns: 57px 1fr auto; gap: 10px; align-items: center; padding: 12px 0; border: 0; border-top: 1px solid var(--line); background: transparent; color: inherit; text-align: left; cursor: pointer; }.portal-row span, .portal-row b { color: var(--ink-3); font-size: 10px; font-weight: 500; }.portal-row strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink-2); font-size: 12px; }.portal-row:hover strong, .portal-row:hover b { color: var(--brand); }.portal-event { grid-template-columns: 57px 1fr 80px; }.portal-event b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.list-board { min-height: 100%; }.workspace-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 21px; }.workspace-toolbar input { width: 220px; min-height: 37px; padding: 0 12px; border: 1px solid var(--line); border-radius: 9px; outline: none; background: #fff; color: var(--ink); font: inherit; font-size: 12px; }.workspace-toolbar input:focus { border-color: var(--brand); }.toolbar-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 9px; }.workspace-tabs { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }.workspace-tabs button { padding: 6px 10px; border: 0; border-radius: 7px; background: transparent; color: var(--ink-3); cursor: pointer; font: inherit; font-size: 11px; }.workspace-tabs button.active, .workspace-tabs button:hover { background: var(--brand-soft); color: var(--brand); }
.workspace-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }.workspace-card { min-width: 0; padding: 18px; border: 1px solid var(--line); border-radius: 14px; background: #fff; transition: .18s ease; }.workspace-card:hover { border-color: var(--brand-line); box-shadow: 0 8px 22px rgba(30,74,126,.08); }.card-top, .card-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }.card-tag { padding: 4px 8px; border-radius: 6px; background: var(--brand-soft); color: var(--brand-strong); font-size: 10px; }.card-top small, .card-footer > span { color: var(--ink-3); font-size: 10px; }.workspace-card h3 { margin: 13px 0 7px; color: var(--ink); font-size: 15px; line-height: 1.45; }.workspace-card > p { min-height: 38px; margin: 0; color: var(--ink-3); font-size: 12px; line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }.card-footer { margin-top: 15px; }.card-actions { display: flex; align-items: center; gap: 7px; }.card-detail { margin-top: 14px; padding: 13px; border-radius: 10px; background: #f3f7fd; color: var(--ink-2); font-size: 12px; line-height: 1.7; }.card-detail p { margin: 5px 0 0; }.inline-form { display: flex; gap: 7px; margin-top: 10px; }.inline-form input { min-width: 0; flex: 1; min-height: 31px; padding: 0 9px; border: 1px solid var(--line); border-radius: 7px; outline: none; font: inherit; font-size: 11px; }
.workspace-empty { padding: 42px 10px; color: var(--ink-3); text-align: center; font-size: 13px; }.workspace-pagination { display: flex; align-items: center; justify-content: center; gap: 13px; margin-top: 23px; color: var(--ink-3); font-size: 11px; }.workspace-pagination button { min-height: 29px; padding: 0 10px; border: 1px solid var(--line); border-radius: 7px; background: #fff; color: var(--brand); cursor: pointer; font: inherit; }.workspace-pagination button:disabled { cursor: not-allowed; opacity: .4; }
.ai-board { display: grid; grid-template-columns: 270px 1fr; gap: 18px; height: 100%; }.ai-prompts, .ai-chat { border: 1px solid var(--line); border-radius: 15px; background: #fff; }.ai-prompts { padding: 22px; }.ai-mark { color: #8470cf; font-size: 28px; }.ai-prompts h3 { margin: 13px 0 8px; color: var(--ink); font-size: 16px; }.ai-prompts p { color: var(--ink-3); font-size: 12px; line-height: 1.6; }.ai-prompts button { display: block; width: 100%; margin-top: 9px; padding: 9px 10px; border: 1px solid #e3e0f6; border-radius: 8px; background: #faf9ff; color: #6e5ab8; text-align: left; cursor: pointer; font: inherit; font-size: 11px; }.ai-prompts button:hover { background: #f0ecff; }.ai-chat { display: flex; flex-direction: column; min-height: 0; }.ai-chat-head { display: flex; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--line); }.ai-chat-head span { color: var(--ink-3); font-size: 10px; }.ai-history { min-height: 0; flex: 1; overflow: auto; padding: 17px; }.ai-bubble { max-width: 78%; margin: 0 auto 10px 0; padding: 10px 12px; border-radius: 11px 11px 11px 3px; background: #f1f5fb; color: var(--ink-2); font-size: 12px; line-height: 1.7; white-space: pre-wrap; }.ai-bubble.mine { margin-left: auto; margin-right: 0; border-radius: 11px 11px 3px 11px; background: var(--brand-soft); color: var(--brand-strong); }.ai-input { display: flex; gap: 8px; padding: 13px; border-top: 1px solid var(--line); }.ai-input input { min-width: 0; flex: 1; min-height: 35px; padding: 0 10px; border: 1px solid var(--line); border-radius: 8px; outline: none; font: inherit; font-size: 12px; }
.code-controls { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }.code-controls label { display: flex; align-items: center; gap: 9px; color: var(--ink-3); font-size: 11px; }.code-controls select { min-height: 33px; padding: 0 9px; border: 1px solid var(--line); border-radius: 8px; color: var(--ink-2); background: #fff; }.code-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; min-height: 500px; }.code-panel { display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--line); border-radius: 13px; background: #fff; }.code-panel > span { display: flex; align-items: center; justify-content: space-between; padding: 13px 15px; border-bottom: 1px solid var(--line); color: var(--ink-2); font-size: 12px; }.code-panel small { color: var(--ink-3); font-size: 10px; font-weight: 500; }.code-panel textarea, .code-panel pre { min-height: 0; flex: 1; margin: 0; padding: 18px; border: 0; outline: none; resize: none; background: #f5f8fd; color: #254564; font: 12px/1.8 ui-monospace, SFMono-Regular, Consolas, monospace; }.code-panel pre { overflow: auto; white-space: pre-wrap; }
@media (max-width: 820px) { .workspace-layer { padding: 10px; }.workspace-dialog { height: 100%; border-radius: 16px; }.workspace-header { padding: 15px; }.workspace-live { display: none; }.workspace-body { padding: 20px 15px 28px; }.portal-columns, .workspace-list, .ai-board, .code-grid { grid-template-columns: 1fr; }.portal-stats { grid-template-columns: repeat(2, 1fr); }.workspace-toolbar { align-items: stretch; flex-direction: column; }.workspace-toolbar input { width: 100%; }.toolbar-actions { align-items: stretch; }.workspace-tabs { justify-content: flex-start; }.ai-board { height: auto; }.ai-prompts { order: 2; }.ai-chat { min-height: 500px; }.code-grid { min-height: 700px; } }
@media (max-width: 520px) { .workspace-symbol { width: 38px; height: 38px; font-size: 17px; }.workspace-header h2 { font-size: 17px; }.workspace-close { padding: 0 9px; font-size: 0; }.workspace-close span, .workspace-close kbd { font-size: 12px; }.workspace-close kbd { display: none; }.portal-welcome { padding: 22px; }.portal-orb { width: 57px; height: 57px; font-size: 18px; }.portal-welcome h1, .list-board h1 { font-size: 24px; }.card-footer { align-items: flex-end; flex-direction: column; }.card-footer > span { align-self: flex-start; }.card-actions { width: 100%; justify-content: flex-end; }.inline-form { flex-direction: column; } }
</style>
