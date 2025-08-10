import { useId, useState } from 'react'
import { Info } from 'lucide-react'

export default function InfoTip({ text, side = 'top', className = '' }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  const position = (() => {
    switch (side) {
      case 'bottom':
        return 'left-1/2 top-full mt-2 -translate-x-1/2'
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2'
      case 'top':
      default:
        return 'left-1/2 bottom-full mb-2 -translate-x-1/2'
    }
  })()

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
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          id={id}
          role="tooltip"
          className={`pointer-events-none absolute z-50 max-w-xs rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-lg backdrop-blur-md ${position}`}
        >
          {text}
        </div>
      )}
    </span>
  )
}


