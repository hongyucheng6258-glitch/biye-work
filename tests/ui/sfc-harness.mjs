import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const require = createRequire(new URL('../../web/frontend/student/package.json', import.meta.url))
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc')
const vue = require('vue')
const root = new URL('../../', import.meta.url)

// Compile the real SFC; replace only infrastructure (network, router and lifecycle
// registration). Ref/computed/watch/nextTick and all component functions are real.
export function setupSfc(path, bindings = {}, props = {}) {
  const descriptor = parse(readFileSync(new URL(path, root), 'utf8')).descriptor
  const compiled = compileScript(descriptor, { id: 'qa-regression' })
  const mounted = []
  const scope = vue.effectScope()
  const sandbox = { AbortController, console, setTimeout, clearTimeout }
  const vueBindings = { ...vue, onMounted: fn => mounted.push(fn), onUnmounted: () => {}, onBeforeUnmount: () => {} }
  for (const [local, info] of Object.entries(compiled.imports)) {
    sandbox[local] = Object.hasOwn(bindings, local) ? bindings[local]
      : info.source === 'vue' ? vueBindings[info.imported]
      : () => {}
  }
  const code = compiled.content.replace(/^import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?\s*$/gm, '').replace('export default', 'globalThis.component =')
  vm.runInNewContext(code, sandbox, { filename: path })
  const state = scope.run(() => sandbox.component.setup(vue.reactive(props), { expose() {}, emit() {} }))
  return {
    state,
    async mount() { for (const fn of mounted) await fn(); await vue.nextTick() },
    async flush() { await vue.nextTick() },
    dispose() { scope.stop() },
    render(source) {
      const template = compileTemplate({ source, id: 'qa-regression' })
      if (template.errors.length) throw new Error(String(template.errors[0]))
      const env = { ...Object.fromEntries(Object.entries(vue).map(([k, v]) => ['_' + k, v])) }
      vm.runInNewContext(template.code.replace(/^import[^\n]+\n/gm, '').replace('export function render', 'globalThis.render = function'), env)
      return env.render(vue.proxyRefs(state), [])
    },
    template: descriptor.template.content
  }
}
