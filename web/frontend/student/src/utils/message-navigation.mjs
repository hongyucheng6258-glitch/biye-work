/**
 * Resolve the in-app destination for a platform notification.
 * Keeping this mapping in one place makes the normal student shell and the
 * 3D room use exactly the same message behaviour.
 */
export function messageTarget(message) {
  const type = String(message?.bizType || '').trim().toLowerCase()
  const rawId = message?.bizId
  const hasId = rawId !== null && rawId !== undefined && String(rawId).trim() !== ''
  const id = hasId ? encodeURIComponent(String(rawId)) : ''

  switch (type) {
    case 'conversation':
      return id ? `/chat/${id}` : '/chat'
    case 'idle':
      // Appointment notifications belong to the two-sided appointment panel,
      // where the recipient can accept, reject, finish or review the trade.
      return '/idle/appointments'
    case 'activity':
      return id ? `/activity/detail/${id}` : '/activity'
    case 'lostfound':
      return id ? `/lostfound/detail/${id}` : '/lostfound'
    case 'qa':
      return id ? `/qa/detail/${id}` : '/qa'
    case 'post':
      return id ? `/social?post=${id}` : '/social'
    case 'partner':
      return '/partner'
    case 'notice':
      return id ? `/notice/detail/${id}` : '/notice'
    case 'user':
      return id ? `/user/${id}` : '/profile'
    default:
      return null
  }
}
