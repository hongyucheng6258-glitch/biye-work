<template>
  <div class="admin-shell">
    <!-- ===================== 同频管理工作区 ===================== -->


    <!-- ===================== 主区 ===================== -->
    <div class="main">
      <header class="topbar">
      <div class="brand" @click="$router.push('/dashboard')">
        <div class="brand-mark">梧</div>
        <div>
          <div class="brand-name">梧桐校园</div>
          <div class="brand-sub">Admin Console</div>
        </div>
      </div>

        <div class="topbar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input ref="searchRef" v-model="keyword" type="search" placeholder="搜索用户 / 内容 / 工单 ID…（Ctrl + K）" @keydown.enter="onGlobalSearch" />
        </div>
      <div class="sidebar-foot">
        <div class="side-user" @click="$router.push('/system/config')">
          <div class="side-avatar">{{ adminStore.adminInfo?.nickname?.charAt(0) || 'A' }}</div>
          <div class="side-user-meta">
            <b>{{ adminStore.adminInfo?.nickname || '管理员' }}</b>
            <span>{{ roleText }}</span>
          </div>
        </div>
      </div>
        <div class="top-actions">
          <button class="icon-btn" title="切换主题" @click="toggleTheme">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
          </button>
          <button class="icon-btn" title="待办通知" @click="goNotice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
            <span v-if="countError" class="badge-dot retry" title="待办数加载失败，点击重试" @click.stop="loadCounts">!</span>
            <span v-else class="badge-dot">{{ totalPending }}</span>
          </button>
          <button class="icon-btn" title="退出" @click="logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </header>
    <aside class="sidebar admin-navigation">
      <div v-for="(group, groupIndex) in visibleGroups" :key="group.label" class="nav-group">
        <button
          type="button"
          class="nav-label nav-group-toggle"
          :aria-expanded="expandedGroup === group.label"
          :aria-controls="`nav-group-items-${groupIndex}`"
          @click="toggleGroup(group.label)"
        >
          <span>{{ group.label }}</span>
          <svg class="nav-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
            <path d="m7 10 5 5 5-5" />
          </svg>
        </button>
        <div
          :id="`nav-group-items-${groupIndex}`"
          class="nav-group-items"
          :class="{ 'is-collapsed': expandedGroup !== group.label }"
        >
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: isActive(item.to) }"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="ICONS[item.icon]"></svg>
            <span>{{ item.label }}</span>
            <em v-if="item.countKey !== undefined" class="nav-count" :class="{ gold: item.gold }">{{ counts[item.countKey] ?? 0 }}</em>
          </router-link>
        </div>
      </div>
    </aside>
        <div class="crumbs">
          <span>首页</span><span class="sep">/</span><b>{{ $route.meta.title || '管理后台' }}</b>
        </div>

      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../store/admin'
import { statsPendingCounts } from '../api/stats'
import {
  findNavigationGroup,
  matchesNavigationPath,
  syncExpandedGroupForRoute,
  toggleExpandedGroup
} from './adminSidebarNavigation.mjs'

const router = useRouter()
const route = useRoute()
const adminStore = useAdminStore()
const keyword = ref('')
const searchRef = ref()
const counts = ref({})
const countError = ref(false)
let countTimer = null

const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  bag: '<path d="M3 7h18l-2 13H5z"/><path d="M8 11v6M12 11v6M16 11v6"/>',
  lost: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z"/>',
  spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  warn: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  bell: '<path d="M3 11l18-5v12L3 13zM11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  admin: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  log: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  config: '<path d="M12 2 2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>'
}

const auditTypes = [
  { key: 'activity', icon: 'calendar', to: '/audit/activity', label: '活动审核', countKey: 'activity' },
  { key: 'idle', icon: 'bag', to: '/audit/idle', label: '闲置审核', countKey: 'idle' },
  { key: 'lostfound', icon: 'lost', to: '/audit/lostfound', label: '失物招领审核', countKey: 'lostfound' },
  { key: 'post', icon: 'chat', to: '/audit/post', label: '动态审核', countKey: 'post' },
  { key: 'partner', icon: 'users', to: '/audit/partner', label: '搭子审核', countKey: 'partner' }
]

const navGroups = computed(() => [
  {
    label: '概览',
    items: [{ to: '/dashboard', label: '数据看板', icon: 'dashboard' }]
  },
  {
    label: '内容审核',
    items: [
      ...auditTypes,
      { to: '/ai/audit', label: 'AI 内容审核', icon: 'spark', countKey: 'ai', gold: true }
    ]
  },
  {
    label: '内容管理',
    items: [
      { to: '/content', label: '内容管理', icon: 'log' }
    ]
  },
  {
    label: '用户与社区',
    items: [
      { to: '/user', label: '用户管理', icon: 'users' },
      { to: '/report', label: '举报处理', icon: 'warn', countKey: 'report' }
    ]
  },
  {
    label: '系统',
    items: [
      { to: '/notice', label: '系统公告', icon: 'bell' },
      { to: '/ai/config', label: 'AI 配置', icon: 'gear' },
      { to: '/ai/logs', label: '调用日志', icon: 'log' },
      { to: '/system/config', label: '系统配置', icon: 'config', superOnly: true },
      { to: '/system', label: '管理员账号', icon: 'admin', superOnly: true }
    ]
  }
])

const visibleGroups = computed(() =>
  navGroups.value
    .map((g) => ({ ...g, items: g.items.filter((m) => !m.superOnly || adminStore.isSuper) }))
    .filter((g) => g.items.length > 0)
)

const activeGroupLabel = computed(() => findNavigationGroup(visibleGroups.value, route.path))
const expandedGroup = ref(activeGroupLabel.value)

watch(activeGroupLabel, (label, previousLabel) => {
  expandedGroup.value = syncExpandedGroupForRoute(expandedGroup.value, previousLabel, label)
}, { immediate: true })

function toggleGroup(label) {
  expandedGroup.value = toggleExpandedGroup(expandedGroup.value, label)
}

const roleText = computed(() => {
  const role = adminStore.adminInfo?.role
  // 后端角色定义：super=超级管理员 / audit=审核员（与 AdminSaveDTO 角色约束一致）
  return { super: '超级管理员', audit: '审核员' }[role] || role || '管理员'
})

const totalPending = computed(() => {
  // 待办角标 = 各审核类型 + 举报（互斥业务项）；ai 复核是待审内容的子集，不累加避免重复计数
  const keys = ['activity', 'idle', 'lostfound', 'post', 'partner', 'report']
  return keys.reduce((a, k) => a + (Number(counts.value[k]) || 0), 0)
})

function isActive(to) {
  return matchesNavigationPath(to, route.path)
}

function onGlobalSearch() {
  const q = keyword.value.trim()
  router.push(q ? { path: '/user', query: { q } } : '/user')
}

function toggleTheme() {
  const root = document.documentElement
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
  root.dataset.theme = next
  localStorage.setItem('admin_theme', next)
}

function logout() {
  adminStore.logout()
  router.push('/login')
}

function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchRef.value?.focus()
  }
}

function goNotice() {
  // 按待办数排序的跳转优先级（counts 含 report/ai）。
  // 路由使用 router 内部路径（base=/admin/ 由 createWebHistory 统一处理），不得再拼 /admin 前缀。
  const order = [
    { k: 'report', to: '/report' },
    { k: 'activity', to: '/audit/activity' },
    { k: 'idle', to: '/audit/idle' },
    { k: 'lostfound', to: '/audit/lostfound' },
    { k: 'post', to: '/audit/post' },
    { k: 'partner', to: '/audit/partner' },
    { k: 'ai', to: '/ai/audit' },
  ]
  const top = order.reduce((best, it) =>
    (Number(counts.value[it.k]) || 0) > (Number(counts.value[best.k]) || 0) ? it : best, order[0])
  if (Number(counts.value[top.k]) > 0) {
    router.push(top.to)
  } else {
    // 无待办时进入举报中心（含各分类待办入口）
    router.push('/report')
  }
}

async function loadCounts() {
  try {
    const data = await statsPendingCounts()
    counts.value = data || {}
    countError.value = ''
  } catch (e) {
    // 接口失败：保留上次计数并进入可重试失败态，不能静默显示成 0 条
    countError.value = true
  }
}

onMounted(() => {
  const saved = localStorage.getItem('admin_theme')
  if (saved) document.documentElement.dataset.theme = saved
  loadCounts()
  window.addEventListener('keydown', onKeydown)
  // 待办数定时刷新（举报/审核处置后红点实时更新）
  countTimer = window.setInterval(loadCounts, 30000)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (countTimer) window.clearInterval(countTimer)
})
</script>

<style scoped>
.admin-shell {
  display: block;
  min-height: 100vh;
  background: var(--paper);
  color: var(--ink);
}
.main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.topbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  width: 100%;
  max-width: 1344px;
  margin: auto;
  padding: 24px 32px;
  min-height: 92px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: none;
}
.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 600;
  background: var(--brand);
  color: var(--brand-ink);
}
.brand-name {
  font-size: 21px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--ink);
}
.brand-sub {
  font-size: 12px;
  color: var(--ink-3);
}
.topbar-search {
  flex: 1;
  min-width: 180px;
  max-width: 440px;
  position: relative;
}
.topbar-search svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--ink-3);
  pointer-events: none;
}
.topbar-search input {
  width: 100%;
  min-height: 44px;
  padding: 10px 16px 10px 42px;
  font-size: 13px;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  color: var(--ink);
  background: var(--surface);
}
.topbar-search input:focus {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}
.icon-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--surface);
  color: var(--ink-2);
  cursor: pointer;
}
.icon-btn:hover {
  background: var(--brand-soft);
  color: var(--brand);
}
.icon-btn svg {
  width: 19px;
  height: 19px;
}
.badge-dot {
  position: absolute;
  top: -4px;
  right: -5px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: var(--r-pill);
  display: grid;
  place-items: center;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 12px;
  font-weight: 700;
}
.badge-dot.retry {
  background: var(--error);
  color: #fff;
  cursor: pointer;
}
.sidebar-foot {
  padding: 0;
  border: 0;
}
.side-user {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  border-radius: 16px;
  padding: 6px;
}
.side-user:hover {
  background: var(--surface-2);
}
.side-avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: var(--sage);
  color: var(--brand);
  border-radius: 50%;
  font-weight: 600;
}
.side-user-meta b {
  display: block;
  font-size: 14px;
  color: var(--ink);
  max-width: 140px;
  overflow-wrap: anywhere;
}
.side-user-meta span {
  font-size: 12px;
  color: var(--ink-3);
}
.sidebar.admin-navigation {
  position: static;
  inset: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: calc(100% - 64px);
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 0 20px;
  min-height: 0;
  height: auto;
  background: transparent;
  border: 0;
  overflow: visible;
}
.nav-group {
  display: contents;
}
.nav-group-toggle {
  order: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: auto;
  padding: 12px 20px;
  min-height: 46px;
  background: var(--surface);
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  font-size: 14px;
  cursor: pointer;
}
.nav-group-toggle[aria-expanded="true"] {
  background: var(--brand);
  color: var(--brand-ink);
  border-color: var(--brand);
}
.nav-group-chevron {
  width: 14px;
  height: 14px;
  transition: transform .18s;
}
.nav-group-toggle[aria-expanded="true"] .nav-group-chevron {
  transform: rotate(180deg);
}
.nav-group-items {
  order: 1;
  flex-basis: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 0 0;
}
.nav-group-items.is-collapsed {
  display: none;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 10px 16px;
  border-radius: var(--r-pill);
  background: var(--surface-2);
  color: var(--ink-2);
  font-size: 13px;
  text-decoration: none;
}
.nav-item:hover {
  background: var(--brand-soft);
  color: var(--brand);
}
.nav-item.active {
  background: var(--brand-soft);
  border: 1px solid var(--brand-line);
  color: var(--brand);
  font-weight: 600;
}
.nav-item svg {
  width: 18px;
  height: 18px;
  flex: none;
}
.nav-count {
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: var(--accent);
  color: var(--accent-ink);
  border-radius: var(--r-pill);
  font-style: normal;
  font-size: 12px;
  font-weight: 600;
}
.nav-count.gold {
  background: var(--gold-soft);
  color: var(--gold-strong);
}
.crumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  width: calc(100% - 64px);
  max-width: 1280px;
  margin: auto;
  padding: 14px 0;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--ink-3);
}
.crumbs b {
  color: var(--ink-2);
  font-weight: 500;
}
.content {
  width: 100%;
  max-width: 1344px;
  margin: auto;
  padding: 24px 32px 48px;
  min-width: 0;
}
@media (max-width:1000px) {
  .topbar {
    gap: 16px;
  }
  .topbar-search {
    max-width: none;
  }
  .sidebar-foot {
    margin-left: auto;
  }
  .top-actions {
    margin-left: 0;
  }
}
@media (max-width:600px) {
  .topbar {
    padding: 20px 16px;
    gap: 14px;
  }
  .brand-name {
    font-size: 18px;
  }
  .brand-sub {
    font-size: 12px;
  }
  .topbar-search {
    order: 5;
    flex-basis: 100%;
  }
  .topbar-search input {
    font-size: 16px;
  }
  .side-user-meta b {
    max-width: 100px;
    font-size: 12px;
  }
  .side-user-meta span {
    font-size: 12px;
  }
  .side-avatar {
    width: 32px;
    height: 32px;
  }
  .sidebar-foot {
    margin-left: 0;
  }
  .top-actions {
    margin-left: auto;
  }
  .icon-btn {
    width: 38px;
    height: 38px;
  }
  .sidebar.admin-navigation,.crumbs {
    width: calc(100% - 32px);
  }
  .nav-group-toggle {
    padding: 10px 14px;
    font-size: 13px;
  }
  .nav-item {
    font-size: 12px;
    padding: 10px 12px;
  }
  .content {
    padding: 20px 16px 40px;
  }
}
@media (prefers-reduced-motion:reduce) {
  .nav-group-chevron {
    transition: none;
  }
}
</style>
