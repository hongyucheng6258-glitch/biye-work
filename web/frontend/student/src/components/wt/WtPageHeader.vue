<script setup>
// 统一页头：每个功能页顶部一致的标题区（eyebrow 小标签 + 标题 + 副文案 + 右侧操作区）
// 用法：<WtPageHeader title="闲置物品" subtitle="校园内的二手好物流转" eyebrow="校园服务">
//         <WtButton type="primary">发布</WtButton>
//       </WtPageHeader>
defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
  eyebrow:  { type: String, default: '' }, // 标题上方的小标签，如「校园服务」
})
</script>

<template>
  <header class="wt-page-header">
    <div class="wt-ph-text">
      <span v-if="eyebrow" class="wt-ph-eyebrow">{{ eyebrow }}</span>
      <h1 class="wt-ph-title">{{ title }}</h1>
      <p v-if="subtitle" class="wt-ph-sub">{{ subtitle }}</p>
    </div>
    <div class="wt-ph-actions">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.wt-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s-4);
  flex-wrap: wrap;
  padding-bottom: var(--s-4);
  margin-bottom: var(--s-5);
  border-bottom: 1px solid var(--line);
}
.wt-ph-text {
  min-width: 0;
}
.wt-ph-eyebrow {
  display: inline-block;
  font-size: var(--fs-cap);
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--brand);
  margin-bottom: var(--s-2);
}
.wt-ph-title {
  font-family: var(--font-display);
  font-size: var(--fs-h1);
  font-weight: 600;
  color: var(--ink);
  margin: 0;
  line-height: 1.15;
}
.wt-ph-sub {
  margin: var(--s-2) 0 0;
  color: var(--ink-3);
  font-size: var(--fs-sm);
}
.wt-ph-actions {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  flex-wrap: wrap;
}
@media (max-width: 640px) {
  .wt-page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .wt-ph-actions {
    width: 100%;
  }
}
/* 同频校园：本页展示布局，业务绑定保持原样 */
.wt-page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 20px;
  padding: 8px 0 28px;
  border-bottom: 0;
}
.wt-ph-text {
  flex: 1;
  min-width: 0;
}
.wt-ph-eyebrow {
  display: inline-flex;
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-size: 12px;
  letter-spacing: 0;
  border-radius: var(--r-pill);
  padding: 4px 12px;
  margin-bottom: 12px;
}
.wt-ph-title {
  font-size: clamp(26px,3vw,34px);
  line-height: 1.4;
  color: var(--ink);
  overflow-wrap: anywhere;
}
.wt-ph-sub {
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.8;
}
.wt-ph-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.wt-ph-actions :deep(.el-button) {
  margin-left: 0;
}
@media (max-width:600px) {
  .wt-ph-actions {
    width: 100%;
  }
  .wt-page-header {
    padding-bottom: 22px;
  }
}
</style>
