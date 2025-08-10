import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'

export default function InfoTip({ text, side = 'top', className = '' }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const btnRef = useRef(null)
  const tipRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return

    const compute = () => {
      const buttonRect = btnRef.current.getBoundingClientRect()
      const tipEl = tipRef.current
      const viewportW = window.innerWidth
      const viewportH = window.innerHeight
      const margin = 8
      const pref = side

      // Temporary size estimate before render
      const tipW = (tipEl?.offsetWidth || 280)
      const tipH = (tipEl?.offsetHeight || 80)

      // Try preferred placement; if clipped at top, flip to bottom
      let top = pref === 'bottom'
        ? buttonRect.bottom + margin
        : buttonRect.top - tipH - margin
      if (top < margin) top = buttonRect.bottom + margin
      if (top + tipH > viewportH - margin) top = Math.max(margin, viewportH - tipH - margin)

      // Center horizontally; then clamp within viewport
      let left = buttonRect.left + (buttonRect.width / 2) - (tipW / 2)
      if (left < margin) left = margin
      if (left + tipW > viewportW - margin) left = Math.max(margin, viewportW - tipW - margin)
      setCoords({ top, left })
    }

    compute()
    const onScroll = () => compute()
    const onResize = () => compute()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, side])

  return (
    <span className={`relative inline-flex ${className}`} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label="More info"
        aria-describedby={id}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-slate-900 text-slate-300 hover:text-white"
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        ref={btnRef}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          id={id}
          role="tooltip"
          ref={tipRef}
          className={`pointer-events-none fixed z-50 rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-lg backdrop-blur-md`}
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            maxWidth: 'min(360px, calc(100vw - 24px))',
            width: 'max-content'
          }}
        >
          {text}
        </div>
      )}
    </span>
  )
}


