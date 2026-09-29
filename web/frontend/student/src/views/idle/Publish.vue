<template>
  <WtPageHeader :title="editId ? '编辑闲置' : '发布闲置'" :subtitle="editId ? '修改物品信息，保存后重新进入审核' : '把闲置好物分享给同学'" eyebrow="校园服务" />

  <div class="publish">
    <el-card>
      <template #header><h3>发布闲置物品</h3></template>
      <el-alert type="info" :closable="false" title="发布后需管理员审核通过才会公开展示" style="margin-bottom: 16px" />
      <AiAssistPanel :type="'idle'" type-name="闲置" @fill="applyAssist" />
      <el-form :model="form" label-width="90px" style="max-width: 640px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" maxlength="64" show-word-limit placeholder="如：九成新《数据结构》教材" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="选择分类">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="物品描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="成色、入手渠道、瑕疵等" />
        </el-form-item>
        <el-form-item label="期望换物">
          <el-input v-model="form.expectItem" placeholder="想换什么？如：Java编程思想 / 篮球" />
        </el-form-item>
        <el-form-item label="图片">
          <UploadImg v-model="form.images" :max="9" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">提交审核</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>

      <!-- AI 智能估价：非编辑时显示 -->
      <template v-if="!editId">
        <el-divider />
        <div class="est-head">
          <h3>🤖 AI 智能估价</h3>
          <span class="est-tip">填写标题和描述后，AI 参考校园二手行情给出定价区间、建议与卖点文案</span>
        </div>
        <el-button
          type="success"
          plain
          :loading="estimating"
          :disabled="!form.title.trim()"
          @click="doEstimate"
        >{{ estimating ? 'AI 估价中…' : '让 AI 估个价' }}</el-button>

        <div v-if="estimate" class="est-card">
          <div class="est-price">参考价 <b>¥{{ estimate.priceMin }} - {{ estimate.priceMax }}</b> 元</div>
          <div v-if="estimate.reference" class="est-line"><b>行情参考：</b>{{ estimate.reference }}</div>
          <div v-if="estimate.tip" class="est-line"><b>建议：</b>{{ estimate.tip }}</div>
          <div v-if="estimate.sellingPoints?.length" class="est-line">
            <b>卖点文案：</b>
            <ul>
              <li v-for="(p, i) in estimate.sellingPoints" :key="i">{{ p }}</li>
            </ul>
          </div>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import WtPageHeader from '../../components/wt/WtPageHeader.vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import UploadImg from '../../components/UploadImg.vue'
import AiAssistPanel from '../../components/AiAssistPanel.vue'
import { publishIdle, updateIdle, idleDetail, idleEstimate } from '../../api/idle'

const router = useRouter()
const route = useRoute()
const editId = route.query.id ? Number(route.query.id) : 0
const categories = ['教材书籍', '数码电子', '生活用品', '运动器材', '服饰鞋包', '其他']
const form = reactive({ title: '', category: '', description: '', expectItem: '', images: [] })
const submitting = ref(false)
const estimating = ref(false)
const estimate = ref(null)

onMounted(async () => {
  if (!editId) return
  try {
    const d = await idleDetail(editId)
    form.title = d.title || ''
    form.category = d.category || ''
    form.description = d.description || ''
    form.expectItem = d.expectItem || ''
    form.images = d.imageList || []
  } catch (e) {
    ElMessage.error('加载物品信息失败')
    router.back()
  }
})

function applyAssist(data) {
  if (data.title) form.title = data.title
  if (data.content) form.description = data.content
}

/** AI 智能估价 */
async function doEstimate() {
  if (!form.title.trim()) {
    ElMessage.warning('请先填写物品名称')
    return
  }
  estimating.value = true
  estimate.value = null
  try {
    estimate.value = await idleEstimate({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      expectItem: form.expectItem.trim()
    })
  } catch (e) {
    ElMessage.error(e.message || 'AI 估价失败，请稍后重试')
  } finally {
    estimating.value = false
  }
}
async function submit() {
  if (!form.title.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  submitting.value = true
  try {
    if (editId) {
      await updateIdle(editId, form)
      ElMessage.success('已保存，重新进入审核')
    } else {
      await publishIdle(form)
      ElMessage.success('已提交，待管理员审核')
    }
    router.push('/profile')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.publish {
  max-width: 760px;
  margin: 0 auto;
}
.est-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}
.est-head h3 {
  margin: 0;
  font-size: var(--fs-body);
}
.est-tip {
  font-size: var(--fs-cap);
  color: var(--ink-3);
}
.est-card {
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px solid var(--success-line, #b3e6d0);
  border-radius: var(--r-md);
  background: var(--success-soft, #f0faf5);
}
.est-price {
  font-size: var(--fs-sm);
  margin-bottom: 8px;
}
.est-price b {
  font-size: 18px;
  color: var(--success-strong, #008a5c);
}
.est-line {
  font-size: var(--fs-cap);
  color: var(--ink-2);
  margin-top: 4px;
}
.est-line ul {
  margin: 4px 0 0;
  padding-left: 18px;
}
/* 同频校园：本页展示布局，业务绑定保持原样 */
.publish {
  max-width: 1040px;
  margin: 0 auto;
  min-width: 0;
}
.publish>:deep(.el-card) {
  border-radius: 26px;
}
.publish :deep(.el-form) {
  width: 100%;
  max-width: none !important;
}
.publish :deep(.el-form-item) {
  margin-bottom: 24px;
}
.publish :deep(.el-form-item__label) {
  color: var(--ink-2);
  font-weight: 600;
}
.publish :deep(.el-input),.publish :deep(.el-select),.publish :deep(.el-date-editor) {
  max-width: 100%;
}
.publish :deep(.el-alert) {
  background: var(--atlas-sky);
  border-radius: 14px;
}
.tip {
  font-size: 12px;
  white-space: normal;
  color: var(--ink-3);
}
.match-head,.est-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.match-list {
  display: grid;
  gap: 14px;
}
.match-card,.est-card {
  border: 1px solid var(--accent-line);
  background: var(--accent-soft);
  border-radius: 18px;
  padding: 20px;
  min-width: 0;
}
.match-card__main,.est-line {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.match-reason,.match-meta {
  overflow-wrap: anywhere;
}
.match-tip,.est-tip {
  font-size: 13px;
}
@media (max-width:600px) {
  .publish :deep(.el-form-item) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .publish :deep(.el-form-item__label) {
    width: auto !important;
    text-align: left;
    padding-bottom: 8px;
  }
  .publish :deep(.el-form-item__content) {
    margin-left: 0 !important;
    width: 100%;
  }
  .publish :deep(.el-date-editor) {
    width: 100%;
  }
  .publish :deep(.el-form-item__content)>.el-button {
    margin: 0 8px 8px 0;
  }
  .publish :deep(.el-input-number) {
    max-width: 100%;
  }
}
</style>
