import React, { useEffect, useRef } from 'react'
// @ts-ignore
import ansiHtml from 'ansi-html'

ansiHtml.setColors({
  red: 'ca372d',
  green: '4c7b3a',
  yellow: 'c6c964',
  blue: '4387cf',
  magenta: 'b86cb4',
  cyan: '71d2c4',
  white: 'c3cac1',
  gray: '9a9b99',
})

type TProps = {
  data: string[]
}

function RunPanel(props: TProps) {
  const { data } = props
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const n = requestAnimationFrame(() => {
      const el = containerRef.current
      if (!el) return
      // 仅在用户已停在底部附近时自动跟随，避免抢占用户向上查看
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
      if (nearBottom) {
        // 用即时滚动替代 smooth，避免高频更新时反复触发布局动画
        el.scrollTo({ top: el.scrollHeight, behavior: 'auto' })
      }
    })
    return () => {
      cancelAnimationFrame(n)
    }
  })
  return (
    <div
      ref={containerRef}
      style={{ whiteSpace: 'pre-wrap' }}
      className="max-h-40vh overflow-auto -ml-38px rounded-1 p-2 bg-#191919 text-#c3cac1 hlink-run-container"
      dangerouslySetInnerHTML={{
        __html: Array.from(new Set(data)).map(ansiHtml).join('\n'),
      }}
    />
  )
}

export default RunPanel
