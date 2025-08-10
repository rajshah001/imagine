import { useEffect, useId, useRef, useState } from 'react'

export default function InfoTip({ text, side = 'auto', align = 'center' }) {
  const [open, setOpen] = useState(false)
  const tipId = useId()
  const ref = useRef(null)
  const [placement, setPlacement] = useState('top')
  const [computedAlign, setComputedAlign] = useState(align)

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

  // Recompute placement when opening/resizing/scrolling
  useEffect(() => {
    if (!open) return
    const compute = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const margin = 12
      // Side: prefer top, but if close to top viewport (e.g., under navbar), flip to bottom
      const preferredTop = side === 'auto' || side === 'top'
      let newSide = preferredTop ? 'top' : 'bottom'
      if (preferredTop && rect.top < 72 + margin) newSide = 'bottom'
      if (side === 'bottom') newSide = 'bottom'
      setPlacement(newSide)

      // Horizontal: try to keep inside viewport
      const vw = window.innerWidth
      // center by default
      let newAlign = align
      if (align === 'center') {
        // If near left/right edges, align start/end
        if (rect.left < 40) newAlign = 'start'
        else if (vw - rect.right < 40) newAlign = 'end'
        else newAlign = 'center'
      }
      setComputedAlign(newAlign)
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [open, side, align])

  const positionClasses = {
    top: `bottom-full mb-3 ${computedAlign === 'start' ? 'left-0' : computedAlign === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'}`,
    bottom: `top-full mt-3 ${computedAlign === 'start' ? 'left-0' : computedAlign === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'}`,
  }[placement]

  const arrowSide = placement === 'top' ? 'bottom-[-6px]' : 'top-[-6px]'

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
          className={`animate-fade pointer-events-auto absolute z-50 w-[min(92vw,28rem)] max-w-none rounded-md border border-white/10 bg-slate-900/95 p-3 text-xs text-slate-200 shadow-lg backdrop-blur-md ${positionClasses}`}
        >
          {text}
          <span className={`absolute left-1/2 -ml-1 h-2 w-2 rotate-45 border border-white/10 bg-slate-900/95 ${arrowSide}`}></span>
        </div>
      )}
    </span>
  )
}


