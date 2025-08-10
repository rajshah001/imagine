import { useEffect, useId, useRef, useState } from 'react'

export default function InfoTip({ text, side = 'top', align = 'center' }) {
  const [open, setOpen] = useState(false)
  const tipId = useId()
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const positionClasses = {
    top: `bottom-full mb-2 ${align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'}`,
    bottom: `top-full mt-2 ${align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'}`,
  }[side]

  const arrowSide = side === 'top' ? 'bottom-[-6px]' : 'top-[-6px]'

  return (
    <span ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-slate-800 text-[10px] leading-none text-slate-300 hover:text-white"
      >
        i
      </button>
      {open && (
        <div
          id={tipId}
          role="tooltip"
          className={`animate-fade pointer-events-none absolute z-30 max-w-xs rounded-md border border-white/10 bg-slate-900/95 p-2 text-xs text-slate-200 shadow-lg backdrop-blur-md ${positionClasses}`}
        >
          {text}
          <span className={`absolute left-1/2 -ml-1 h-2 w-2 rotate-45 border border-white/10 bg-slate-900/95 ${arrowSide}`}></span>
        </div>
      )}
    </span>
  )
}


