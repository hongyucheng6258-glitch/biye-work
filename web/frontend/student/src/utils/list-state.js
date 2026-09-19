import { inject, onBeforeUnmount } from 'vue'

// Only room hosts provide this cache. Data is always reloaded; only filters/page are retained.
export function useListState(key, fields) {
  const cache = inject('room-list-state', null)
  const saved = cache?.get(key)
  if (saved) for (const [name, field] of Object.entries(fields)) field.value = saved[name]
  onBeforeUnmount(() => cache?.set(key, Object.fromEntries(Object.entries(fields).map(([name, field]) => [name, field.value]))))
  return !!saved
}
