/**
 * UTCのtimestamp文字列を日本時間(JST)に変換
 * @param {string} utcString - 例: "2026-02-03T10:12:00.000Z"
 * @returns {string} - "2026/02/03 19:12"
 */
export const toJST = (utcString) => {
  if (!utcString) return ''

  const date = new Date(utcString)

  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 全角数字を半角に変換
export const toHalfWidthNumber = (value) => {
  return value.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
}


// アラート音再生
export const playAlertSound = () => {
  const audio = new Audio('public/nakigoe.mp3') // public/nakigoe.mp3
  audio.play()
}

// 休憩タイマー（秒数・終了コールバック付き）
export const startRestTimer = ({
  seconds = 10,
  onTick,
  onFinish,
}) => {
  let remaining = seconds

  onTick?.(remaining)

  const timerId = setInterval(() => {
    remaining--
    onTick?.(remaining)

    if (remaining <= 0) {
      clearInterval(timerId)
      playAlertSound()
      onFinish?.()
    }
  }, 1000)

  return timerId
}