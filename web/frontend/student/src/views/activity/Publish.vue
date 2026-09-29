<template>
  <WtPageHeader :title="editId ? '编辑活动' : '发布活动'" :subtitle="editId ? '修改活动信息，保存后重新进入审核' : '发起一场属于同学们的聚会'" eyebrow="校园服务" />

  <div class="publish">
    <el-card>
      <template #header><h3>发布活动</h3></template>
      <el-alert type="info" :closable="false" title="发布后需管理员审核通过才会公开展示" style="margin-bottom: 16px" />
      <AiAssistPanel :type="'activity'" type-name="活动" @fill="applyAssist" />
      <el-form :model="form" label-width="90px" style="max-width: 640px">
        <el-form-item label="活动标题" required>
          <el-input v-model="form.title" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="form.description" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.location" placeholder="如：东区操场 / 图书馆三楼" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="报名截止">
          <el-date-picker v-model="form.signupDeadline" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="人数上限">
          <el-input-number v-model="form.maxMembers" :min="0" :max="500" />
          <span class="tip">（0 表示不限）</span>
        </el-form-item>
        <el-form-item label="图片">
          <UploadImg v-model="form.images" :max="3" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">提交审核</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
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
import { publishActivity, updateActivity, activityDetail } from '../../api/activity'

const router = useRouter()
const route = useRoute()
const editId = route.query.id ? Number(route.query.id) : 0
const categories = ['学习交流', '体育运动', '文艺娱乐', '志愿服务', '竞赛组队', '其他']
const form = reactive({
  title: '', category: '', description: '', location: '',
  startTime: '', endTime: '', signupDeadline: '', maxMembers: 0, images: []
})
const submitting = ref(false)

onMounted(async () => {
  if (!editId) return
  try {
    const d = await activityDetail(editId)
    form.title = d.title || ''
    form.category = d.category || ''
    form.description = d.description || ''
    form.location = d.location || ''
    form.startTime = (d.startTime || '').replace('T', ' ')
    form.endTime = (d.endTime || '').replace('T', ' ')
    form.signupDeadline = (d.signupDeadline || '').replace('T', ' ')
    form.maxMembers = d.maxMembers || 0
    form.images = d.imageList || []
  } catch (e) {
    ElMessage.error('加载活动信息失败')
    router.back()
  }
})

function applyAssist(data) {
  if (data.title) form.title = data.title
  if (data.content) form.description = data.content
}
async function submit() {
  if (!form.title.trim()) {
    ElMessage.warning('请填写活动标题')
    return
  }
  submitting.value = true
  try {
    if (editId) {
      await updateActivity(editId, form)
      ElMessage.success('已保存，重新进入审核')
    } else {
      await publishActivity(form)
      ElMessage.success('已提交，待管理员审核')
    }
    router.push('/activity/my-signup')
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
.tip {
  margin-left: 8px;
  font-size: 12px;
  color: var(--ink-3);
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
