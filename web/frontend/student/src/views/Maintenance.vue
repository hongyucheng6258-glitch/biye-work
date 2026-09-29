<template>
  <div class="maintenance-page">
    <div class="maintenance-card">
      <div class="icon">🔧</div>
      <h1>系统维护中</h1>
      <p class="subtitle">{{ siteName }} 正在进行系统维护</p>
      <p class="desc">我们正在努力优化系统，预计很快恢复。请稍后再试。</p>
      <el-button type="primary" @click="checkStatus">刷新重试</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '../api/request'

const router = useRouter()
const siteName = ref('AI校园综合服务平台')

async function checkStatus() {
  try {
    // 请求一个公开接口，若不再返回503则跳回首页
    await request.get('/home/aggregate', { silent: true })
    router.push('/')
  } catch (e) {
    // 仍在维护中，保持当前页
  }
}
</script>

<style scoped>
.maintenance-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
}
.maintenance-card {
  text-align: center;
  padding: 48px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  max-width: 420px;
}
.icon {
  font-size: 64px;
  margin-bottom: 16px;
}
h1 {
  font-size: 24px;
  color: #1a1a2e;
  margin: 0 0 8px;
}
.subtitle {
  font-size: 16px;
  color: #4a5568;
  margin: 0 0 12px;
}
.desc {
  font-size: 14px;
  color: #718096;
  margin: 0 0 24px;
  line-height: 1.6;
}
/* 同频校园：本页展示布局，业务绑定保持原样 */
.maintenance-page {
  background: var(--atlas-sky);
  padding: 24px;
}
.maintenance-card {
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 26px;
  max-width: 640px;
  width: 100%;
  padding: 40px;
}
.maintenance-card h1 {
  font-size: 30px;
}
.subtitle,.desc {
  overflow-wrap: anywhere;
  font-size: 14px;
}
@media (max-width:600px) {
  .maintenance-card {
    padding: 28px;
  }
}
</style>
