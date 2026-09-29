<template>
  <span class="search-result-cover">
    <img v-if="cover" :src="cover" alt="" loading="lazy" decoding="async" @error="onError" />
    <span v-if="cover && schematic" class="cover-label">示意图</span>
    <span v-if="!cover" class="cover-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="8" cy="8" r="1.5" />
        <path d="m4 17 5-5 4 4 3-3 4 4" />
      </svg>
      <span>暂无图片</span>
    </span>
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { firstContentImage, fallbackFor, isFallbackSrc } from '../../utils/content-assets.mjs'

// Thumbnail presentation reuses the existing list/detail image rules.
const props = defineProps({ item: { type: Object, required: true }, module: { type: String, required: true } })
const moduleId = computed(() => props.module === 'post' ? 'social' : props.module)
const requested = computed(() => firstContentImage(props.item, moduleId.value, props.item.category))
const cover = ref('')
watch(requested, value => { cover.value = value }, { immediate: true })
const schematic = computed(() => isFallbackSrc(cover.value, moduleId.value, props.item.category))
function onError() {
  const fallback = fallbackFor(moduleId.value, props.item.category)
  cover.value = cover.value !== fallback ? fallback : ''
}
</script>

<style scoped>
.search-result-cover {
  position: relative;
  display: grid;
  place-items: center;
  width: 112px;
  height: 84px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface-2);
  color: var(--ink-3);
}
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-label {
  position: absolute;
  left: 6px;
  bottom: 6px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  line-height: 1.5;
  background: var(--surface);
  color: var(--ink-2);
}
.cover-placeholder {
  display: grid;
  justify-items: center;
  gap: 6px;
  font-size: 11px;
  line-height: 1.5;
}
.cover-placeholder svg {
  width: 26px;
  height: 26px;
}
@media (max-width: 600px) {
  .search-result-cover {
    width: 80px;
    height: 72px;
    border-radius: 12px;
  }
}
</style>
