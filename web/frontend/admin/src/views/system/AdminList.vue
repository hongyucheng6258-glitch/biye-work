<template>
  <WtPageHeader title="管理员" subtitle="管理系统后台账号" eyebrow="管理后台" />

  <el-card>
    <template #header>
      <div class="head">
        <span>管理员账号管理</span>
        <el-button type="primary" size="small" @click="openEdit()">＋ 新增子管理员</el-button>
      </div>
    </template>
    <div class="tp-table-scroll">
<el-table :data="list" v-loading="loading">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column prop="nickname" label="昵称" width="140" />
      <el-table-column label="角色" width="110">
        <template #default="{ row }">
          <el-tag :type="row.role === 'super' ? 'danger' : 'primary'" size="small">
            {{ row.role === 'super' ? '超级管理员' : '审核员' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
</div>
    <el-pagination v-model:current-page="pageNum" :total="total" :page-size="10"
                   layout="total, prev, pager, next" style="margin-top: 16px" @current-change="load" />

    <el-dialog v-model="editVisible" :title="editForm.id ? '编辑管理员' : '新增子管理员'" width="440px">
      <el-form label-width="80px">
        <el-form-item label="用户名" required>
          <el-input v-model="editForm.username" :disabled="!!editForm.id" />
        </el-form-item>
        <el-form-item :label="editForm.id ? '新密码' : '密码'" :required="!editForm.id">
          <el-input v-model="editForm.password" type="password" show-password
                    :placeholder="editForm.id ? '留空则不修改' : '6位以上'" />
        </el-form-item>
        <el-form-item label="昵称"><el-input v-model="editForm.nickname" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role">
            <el-option label="审核员 audit" value="audit" />
            <el-option label="超级管理员 super" value="super" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import WtPageHeader from '../../components/wt/WtPageHeader.vue'
import { ElMessage } from 'element-plus'
import { listAdmins, createAdmin, updateAdmin } from '../../api/user'
import { formatTime } from '../../utils/date'

const list = ref([])
const pageNum = ref(1)
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const editVisible = ref(false)
const editForm = reactive({ id: null, username: '', password: '', nickname: '', role: 'audit' })

async function load() {
  loading.value = true
  try {
    const res = await listAdmins({ pageNum: pageNum.value, pageSize: 10 })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function openEdit(row) {
  if (row) {
    Object.assign(editForm, { id: row.id, username: row.username, password: '', nickname: row.nickname, role: row.role })
  } else {
    Object.assign(editForm, { id: null, username: '', password: '', nickname: '', role: 'audit' })
  }
  editVisible.value = true
}

async function save() {
  saving.value = true
  try {
    if (editForm.id) {
      await updateAdmin(editForm.id, editForm)
    } else {
      await createAdmin(editForm)
    }
    ElMessage.success('已保存')
    editVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
