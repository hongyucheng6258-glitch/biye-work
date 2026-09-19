import { normalizeImages } from './image.mjs'

/**
 * Local, same-origin images used only when an API record has no image.
 * Uploaded or CDN images always win over these fallbacks.
 */
export const CONTENT_FALLBACK_IMAGES = Object.freeze({
  activity: '/images/generated-activity-campus.png',
  idle: '/images/generated-idle-items.png',
  lost: '/images/generated-lost-found.png',
  lostfound: '/images/generated-lost-found.png',
  square: '/images/generated-social-campus.png',
  social: '/images/generated-social-campus.png',
  partner: '/images/generated-study-partner.png',
  aichat: '/images/generated-ai-study.png',
  code: '/images/generated-ai-study.png'
})

export function fallbackImageFor(moduleId) {
  return CONTENT_FALLBACK_IMAGES[String(moduleId || '').toLowerCase()] || ''
}

export function firstContentImage(item, moduleId) {
  return normalizeImages(item)[0] || fallbackImageFor(moduleId)
}
