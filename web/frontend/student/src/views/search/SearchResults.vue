<template>
  <WtPageHeader title="搜索结果" :subtitle="`关键词：${keyword || '未输入'}`" eyebrow="校园搜索" />

  <div v-if="!keyword" class="search-empty">请在顶部输入关键词开始搜索</div>
  <div v-else v-loading="loading">
    <!-- 分类计数 pill（对齐原型 filter-chip） -->
    <div class="chips">
      <span class="chip" :class="{ active: activeType === '' }" @click="activeType = ''">全部 {{ totalCount }}</span>
      <span
        v-for="sec in sections"
        :key="sec.type"
        class="chip"
        :class="{ active: activeType === sec.type }"
        @click="activeType = sec.type"
      >{{ sec.label }} {{ sec.items.length }}</span>
    </div>

    <!-- 结果列表（单列，关键词高亮） -->
    <div class="result-sections">
      <section v-for="section in visibleSections" :key="section.type" class="result-section">
        <header>
          <div>
            <h2>{{ section.label }}</h2>
            <span>{{ section.items.length ? `找到 ${section.items.length} 条相关内容` : '暂无相关内容' }}</span>
          </div>
          <button type="button" @click="openSection(section)">查看全部</button>
        </header>
        <div v-if="section.items.length" class="result-list">
          <button v-for="item in section.items" :key="item.key" type="button" @click="router.push(item.to)">
            <SearchResultCover :item="item.media" :module="section.type" />
            <span class="result-text">
              <strong class="result-title" v-html="highlight(item.title)"></strong>
              <span class="result-meta" v-html="highlight(item.meta)"></span>
            </span>
          </button>
        </div>
      </section>
    </div>
    <EmptyBox v-if="!loading && !totalCount" description="没有找到相关内容" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WtPageHeader from '../../components/wt/WtPageHeader.vue'
import SearchResultCover from '../../components/wt/SearchResultCover.vue'
import EmptyBox from '../../components/EmptyBox.vue'
import { listActivity } from '../../api/activity'
import { listIdle } from '../../api/idle'
import { listLostFound } from '../../api/lostfound'
import { listPost } from '../../api/post'

const route = useRoute()
const router = useRouter()
const keyword = computed(() => String(route.query.q || '').trim())
const loading = ref(false)
const sections = ref([])
const activeType = ref('')

/** 当前展示的 section（按 chip 过滤） */
const visibleSections = computed(() =>
  activeType.value ? sections.value.filter((s) => s.type === activeType.value) : sections.value
)

const totalCount = computed(() => sections.value.reduce((sum, s) => sum + s.items.length, 0))

/** 关键词高亮：先转义 HTML，再包 <mark> */
function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function highlight(text) {
  const esc = escHtml(text)
  if (!keyword.value) return esc
  const kw = escHtml(keyword.value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return esc.replace(new RegExp(kw, 'gi'), (m) => `<mark>${m}</mark>`)
}

function rows(res) {
  return Array.isArray(res) ? res : (res?.list || [])
}

function openSection(section) {
  router.push({ path: section.path, query: { q: keyword.value } })
}

async function load() {
  if (!keyword.value) {
    sections.value = []
    return
  }
  loading.value = true
  try {
    const q = keyword.value
    const [activities, idleItems, lostItems, posts] = await Promise.all([
      listActivity({ keyword: q, pageNum: 1, pageSize: 4 }),
      listIdle({ keyword: q, pageNum: 1, pageSize: 4 }),
      listLostFound({ keyword: q, pageNum: 1, pageSize: 4 }),
      listPost({ keyword: q, pageNum: 1, pageSize: 4 })
    ])
    sections.value = [
      { type: 'activity', label: '校园活动', path: '/activity', items: rows(activities).map((item) => ({ key: item.id, media: item, title: item.title, meta: item.location || '地点待定', to: `/activity/detail/${item.id}` })) },
      { type: 'idle', label: '闲置物品', path: '/idle', items: rows(idleItems).map((item) => ({ key: item.id, media: item, title: item.title, meta: item.price != null ? `¥${item.price}` : '面议', to: `/idle/detail/${item.id}` })) },
      { type: 'lost', label: '失物招领', path: '/lostfound', items: rows(lostItems).map((item) => ({ key: item.id, media: item, title: item.title, meta: item.location || '地点未知', to: `/lostfound/detail/${item.id}` })) },
      { type: 'post', label: '校园动态', path: '/social', items: rows(posts).map((item) => ({ key: item.id, media: item, title: item.content || '校园动态', meta: item.authorName || item.nickname || '校园同学', to: `/social?post=${item.id}` })) }
    ]
  } finally {
    loading.value = false
  }
}

watch(keyword, load, { immediate: true })
</script>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}
.chip {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 9px 16px;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--surface);
  color: var(--ink-2);
  font-size: var(--fs-xs);
  font-weight: 600;
  cursor: pointer;
}
.chip:hover { border-color: var(--brand-line); }
.chip.active {
  background: var(--brand);
  color: var(--brand-ink);
  border-color: var(--brand);
}
.result-sections {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}
.result-section {
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--surface);
}
.result-section header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}
.result-section header > div { min-width: 0; }
.result-section h2 {
  margin: 0 0 4px;
  color: var(--ink);
  font-size: var(--fs-lg);
}
.result-section header span {
  color: var(--ink-3);
  font-size: var(--fs-xs);
}
.result-section header button {
  min-height: 40px;
  padding: 8px 12px;
  border: 0;
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--brand-strong);
  font: inherit;
  font-size: var(--fs-xs);
  font-weight: 600;
  cursor: pointer;
}
.result-section header button:hover { background: var(--brand-soft); }
.result-list {
  display: grid;
  gap: 8px;
}
.result-list > button {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: center;
  gap: 20px;
  min-width: 0;
  width: 100%;
  padding: 14px 16px;
  border: 0;
  border-radius: 16px;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background .18s var(--ease-out);
}
.result-list > button:hover { background: var(--surface-2); }
.result-list > button:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.result-text {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.result-title {
  color: var(--ink);
  font-size: var(--fs-sm);
  font-weight: 600;
  line-height: 1.6;
  white-space: normal;
  overflow-wrap: anywhere;
}
.result-meta {
  color: var(--ink-3);
  font-size: var(--fs-xs);
  line-height: 1.7;
  white-space: normal;
  overflow-wrap: anywhere;
}
.result-section :deep(mark) {
  padding: 1px 3px;
  border-radius: 4px;
  background: var(--accent);
  color: var(--accent-ink);
}
.search-empty {
  padding: 64px 24px;
  color: var(--ink-3);
  text-align: center;
}
@media (max-width: 600px) {
  .result-section { padding: 18px 14px; }
  .result-list > button {
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 12px;
    padding: 12px 0;
    border-radius: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .result-list > button { transition: none; }
}
</style>
