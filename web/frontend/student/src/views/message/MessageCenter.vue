<template>
  <WtPageHeader title="消息中心" subtitle="来自平台与同学的提醒" eyebrow="我的" />

  <div class="message-center">
    <!-- 左栏：消息类型列表 -->
    <aside class="msg-sidebar card">
      <div class="msg-sidebar-title">消息中心</div>
      <button
        v-for="t in msgTypes"
        :key="t.value"
        type="button"
        class="msg-side-item"
        :class="{ active: type === t.value }"
        @click="selectType(t.value)"
      >
        <span>{{ t.label }}</span>
        <el-badge v-if="t.badge !== undefined" :value="t.badge" :hidden="!t.badge" />
      </button>
      <button type="button" class="msg-side-item private" @click="router.push('/chat')">
        <span>私信会话</span>
        <el-badge :value="chatStore.unreadTotal" :hidden="!chatStore.unreadTotal" />
      </button>
    </aside>

    <!-- 右栏：消息详情 -->
    <div class="msg-detail">
      <div class="msg-detail-head">
        <h3>{{ currentLabel }}</h3>
        <el-button size="small" @click="readAll">全部已读</el-button>
      </div>
      <div v-loading="loading" class="msg-list">
        <div
          v-for="m in list"
          :key="m.id"
          class="msg-item"
          :class="{ unread: m.isRead === 0 }"
          @click="openMsg(m)"
        >
          <el-badge is-dot :hidden="m.isRead === 1">
            <span class="m-icon">{{ iconOf(m.type) }}</span>
          </el-badge>
          <div class="m-body">
            <div class="m-title">{{ m.title }}</div>
            <div class="m-content">{{ m.content }}</div>
          </div>
          <div class="m-time">{{ fromNow(m.createTime) }}</div>
        </div>
        <EmptyBox v-if="!loading && !list.length" description="暂无消息" />
      </div>
      <el-pagination v-model:current-page="pageNum" :total="total" :page-size="10"
                     layout="prev, pager, next" style="margin-top: 16px" @current-change="load" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import WtPageHeader from '../../components/wt/WtPageHeader.vue'
import { useRouter } from 'vue-router'
import { listMessage, markRead, markAllRead } from '../../api/message'
import { useMessageStore } from '../../store/message'
import { useChatStore } from '../../store/chat'
import { fromNow } from '../../utils/date'
import EmptyBox from '../../components/EmptyBox.vue'
import { messageTarget } from '../../utils/message-navigation.mjs'

const router = useRouter()
const messageStore = useMessageStore()
const chatStore = useChatStore()
const type = ref('')
const list = ref([])
const pageNum = ref(1)
const total = ref(0)
const loading = ref(false)

const iconOf = (t) => ({ system: '📢', interact: '💬', audit: '✅' }[t] || '📩')

const msgTypes = computed(() => [
  { label: '全部', value: '', badge: messageStore.unread },
  { label: '系统通知', value: 'system', badge: undefined },
  { label: '互动消息', value: 'interact', badge: undefined },
  { label: '审核结果', value: 'audit', badge: undefined }
])

const currentLabel = computed(() => msgTypes.value.find((t) => t.value === type.value)?.label || '全部')

function selectType(t) {
  type.value = t
  search()
}

function search() {
  pageNum.value = 1
  load()
}

async function load() {
  loading.value = true
  try {
    const res = await listMessage({ type: type.value || undefined, pageNum: pageNum.value, pageSize: 10 })
    list.value = Array.isArray(res?.list) ? res.list : []
    total.value = Number(res?.total || 0)
    messageStore.refreshUnread()
  } finally {
    loading.value = false
  }
}

/** 打开消息：标记已读并跳转关联业务页 */
async function openMsg(m) {
  if (m.isRead === 0) {
    await markRead(m.id)
    m.isRead = 1
    messageStore.refreshUnread()
  }
  const target = messageTarget(m)
  if (target) await router.push(target)
}

async function readAll() {
  await markAllRead()
  list.value.forEach((m) => (m.isRead = 1))
  messageStore.refreshUnread()
}

onMounted(load)
</script>

<style scoped>
.message-center {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.msg-sidebar {
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20px;
}
.msg-sidebar-title {
  /* 页头已有标题；只保留这个重复标签供辅助技术读取。 */
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.msg-side-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: auto;
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid transparent;
  border-radius: var(--r-pill);
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--ink-2);
  white-space: nowrap;
  transition: background .15s var(--ease-out), color .15s var(--ease-out);
}
.msg-side-item:hover {
  background: var(--surface-2);
  color: var(--ink);
}
.msg-side-item.active {
  background: var(--brand);
  color: var(--brand-ink);
}
.msg-side-item.private {
  margin: 0 0 0 auto;
  border-color: var(--brand-line);
  background: var(--brand-soft);
  color: var(--brand-strong);
}
.msg-detail {
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--surface);
}
.msg-detail-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 20px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--line);
}
.msg-detail-head h3 {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}
.msg-detail-head :deep(.el-button) {
  min-height: 36px;
  padding: 8px 14px;
}
.msg-list {
  display: grid;
  gap: 8px;
  min-width: 0;
  min-height: 120px;
  padding: 8px 0;
}
.msg-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 18px;
  border-radius: 14px;
  background: var(--surface);
  cursor: pointer;
  transition: background .15s var(--ease-out);
}
.msg-item.unread {
  background: var(--brand-soft);
  box-shadow: inset 3px 0 0 var(--brand);
}
.msg-item:hover {
  background: var(--surface-2);
}
.msg-item > :deep(.el-badge) {
  align-self: start;
}
.m-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  font-size: 20px;
}
.m-body {
  min-width: 0;
}
.m-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.6;
}
.m-content {
  font-size: 13px;
  color: var(--ink-2);
  margin-top: 6px;
  line-height: 1.8;
}
.m-title, .m-content {
  white-space: normal;
  overflow-wrap: anywhere;
}
.m-time {
  padding-top: 3px;
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.6;
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  .msg-side-item, .msg-item {
    transition: none;
  }
}
@media (max-width:600px) {
  .msg-sidebar {
    gap: 6px;
    padding: 10px;
    border-radius: 18px;
  }
  .msg-side-item {
    padding: 10px 12px;
    font-size: 13px;
  }
  .msg-side-item.private {
    margin-left: 0;
  }
  .msg-detail {
    padding: 18px 14px;
    border-radius: 20px;
  }
  .msg-detail-head {
    padding-bottom: 16px;
  }
  .msg-item {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 8px 12px;
    padding: 14px;
  }
  .m-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
  .m-time {
    grid-column: 2;
    padding-top: 0;
    white-space: normal;
  }
}
</style>
