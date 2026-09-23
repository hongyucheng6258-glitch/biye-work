export function captureCompletedArtwork(event, viewerUserId, canvas) {
  const roundId = event?.roundId
  const drawerUserId = Number(event?.drawerUserId)
  if (roundId == null || viewerUserId == null || drawerUserId !== Number(viewerUserId)
      || typeof canvas?.toDataURL !== 'function') return null

  try {
    const imageDataUrl = canvas.toDataURL('image/png')
    return typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/png;base64,')
      ? { roundId, imageDataUrl }
      : null
  } catch {
    return null
  }
}

export function dataUrlToBlob(imageDataUrl) {
  const match = /^data:(image\/[\w.+-]+);base64,([\w+/=\s]+)$/.exec(imageDataUrl || '')
  if (!match) throw new Error('画作数据格式无效。')

  const binary = atob(match[2].replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: match[1] })
}
