<template>
  <!-- 空状态占位组件 -->
  <el-empty :description="description" :image-size="imageSize">
    <slot />
  </el-empty>
</template>

<script setup>
defineProps({
  description: { type: String, default: '暂无数据' },
  imageSize: { type: Number, default: 120 }
})
</script>

<style scoped>
:deep(.el-empty) {
  padding: 40px 20px;
}
:deep(.el-empty__description p) {
  font-size: 14px;
  color: var(--ink-3);
}
</style>
