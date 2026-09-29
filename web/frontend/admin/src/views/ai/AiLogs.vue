<template>
  <WtPageHeader title="AI 调用日志" subtitle="查看平台 AI 调用记录" eyebrow="管理后台" />

  <el-card>
    <template #header>AI 调用日志</template>
    <div class="toolbar tp-page-tools">
      <el-input-number v-model="userId" placeholder="用户ID" :controls="false" style="width: 120px" />
      <el-select v-model="scene" placeholder="全部场景" clearable style="width: 150px" @change="search">
        <el-option label="答疑 chat" value="chat" />
        <el-option label="PDF问答 pdf" value="pdf" />
        <el-option label="代码纠错 code_fix" value="code_fix" />
        <el-option label="提纲 outline" value="outline" />
        <el-option label="习题 quiz" value="quiz" />
      </el-select>
      <el-select v-model="status" placeholder="全部结果" clearable style="width: 120px" @change="search">
        <el-option label="成功" :value="0" />
        <el-option label="失败" :value="1" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button>
    </div>
    <div class="tp-table-scroll">
<el-table :data="list" v-loading="loading">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="userId" label="用户ID" width="80" />
      <el-table-column prop="scene" label="场景" width="100">
        <template #default="{ row }"><el-tag size="small">{{ row.scene }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="model" label="模型" width="130" />
      <el-table-column label="Token消耗" width="120">
        <template #default="{ row }">{{ row.promptTokens }} + {{ row.completionTokens }}</template>
      </el-table-column>
      <el-table-column label="耗时" width="90">
        <template #default="{ row }">{{ (row.costMs / 1000).toFixed(1) }}s</template>
      </el-table-column>
      <el-table-column label="结果" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
            {{ row.status === 0 ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="errorMsg" label="错误信息" min-width="140" show-overflow-tooltip />
      <el-table-column label="时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
    </el-table>
</div>
    <el-pagination v-model:current-page="pageNum" :total="total" :page-size="10"
                   layout="total, prev, pager, next" style="margin-top: 16px" @current-change="load" />
  </el-card>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import WtPageHeader from '../../components/wt/WtPageHeader.vue'
import { aiLogs } from '../../api/aiConfig'
import { formatTime } from '../../utils/date'

const userId = ref(undefined)
const scene = ref(undefined)
const status = ref(undefined)
const list = ref([])
const pageNum = ref(1)
const total = ref(0)
const loading = ref(false)

function search() {
  pageNum.value = 1
  load()
}

async function load() {
  loading.value = true
  try {
    const res = await aiLogs({
      userId: userId.value || undefined,
      scene: scene.value,
      status: status.value,
      pageNum: pageNum.value,
      pageSize: 10
    })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
/* 同频校园：本页展示布局，业务绑定保持原样 */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.toolbar>* {
  min-width: 0;
}
.toolbar .el-button+ .el-button {
  margin-left: 0;
}
@media (max-width:600px) {
  .toolbar>:deep(.el-input),.toolbar>:deep(.el-select) {
    width: 100%;
  }
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 18px;
}
.head .sub {
  font-size: 13px;
  color: var(--ink-3);
}
.toolbar {
  margin-bottom: 20px;
}
:deep(.el-table__fixed-right .cell) {
  padding-inline: 10px;
}
:deep(.el-table .el-button) {
  padding: 8px 10px;
  min-height: 32px;
}
:deep(.el-table .cell) {
  font-size: 14px;
  line-height: 1.7;
}
:deep(.el-table__cell) {
  padding-block: 14px;
}
:deep(.el-pagination) {
  margin-top: 20px !important;
}
:deep(.el-dialog .el-form-item__label) {
  font-size: 14px;
}
@media (max-width:600px) {
  .toolbar :deep(.el-input-number) {
    width: 100%;
  }
  .toolbar :deep(.el-select) {
    width: 100% !important;
  }
}
</style>
