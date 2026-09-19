let activeRouter
export function useRequestRouter(router) {
  activeRouter = router
  return () => { if (activeRouter === router) activeRouter = undefined }
}
export function requestRouter(fallback) { return activeRouter || fallback }
