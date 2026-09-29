/** Document viewport only; message/chat/3D scrollers retain their own behaviour. */
let navigation = 0

function waitForRestorableHeight(top, current) {
  if (typeof document === 'undefined' || document.documentElement.scrollHeight >= top + window.innerHeight) return Promise.resolve()
  return new Promise(resolve => {
    let timer
    const finish = () => { observer.disconnect(); clearTimeout(timer); resolve() }
    const check = () => {
      if (current !== navigation || document.documentElement.scrollHeight >= top + window.innerHeight) finish()
    }
    const observer = new ResizeObserver(check)
    observer.observe(document.body)
    // Failed/shortened pages must not leave history navigation waiting forever.
    timer = setTimeout(finish, 3000)
    check()
  })
}

export async function routeScroll(to, from, savedPosition) {
  const current = ++navigation
  if (savedPosition) {
    await waitForRestorableHeight(savedPosition.top, current)
    return current === navigation ? { ...savedPosition, behavior: 'instant' } : false
  }
  if (to.hash) return { el: to.hash, behavior: 'instant' }
  // Filtering, pagination and profile tabs remain in the current viewport.
  if (to.path === from.path) return false
  return { left: 0, top: 0, behavior: 'instant' }
}
