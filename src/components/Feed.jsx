import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy } from 'lucide-react'

function buildUrlFromEvent(event) {
  // Many feeds include 'url'. If absent, try to construct from params we know.
  if (event?.url) return event.url
  if (!event?.prompt) return ''
  const params = new URLSearchParams()
  if (event.width) params.set('width', String(event.width))
  if (event.height) params.set('height', String(event.height))
  if (event.seed !== undefined) params.set('seed', String(event.seed))
  if (event.model) params.set('model', String(event.model))
  if (event.nologo !== undefined) params.set('nologo', String(event.nologo))
  if (event.enhance !== undefined) params.set('enhance', String(event.enhance))
  const encodedPrompt = encodeURIComponent(String(event.prompt))
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`
}

const MAX_HISTORY = 120
const PAGE_SIZE = 12

export default function Feed({ onUsePrompt }) {
  const [items, setItems] = useState([]) // newest first
  const [enabled, setEnabled] = useState(true)
  const [error, setError] = useState('')
  const [speed, setSpeed] = useState('slow') // 'slow' | 'normal'
  const [pageStart, setPageStart] = useState(0)
  const urls = useRef(new Set())
  const queueRef = useRef([])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let source
    try {
      source = new EventSource('https://image.pollinations.ai/feed', { withCredentials: false })
      source.onmessage = (e) => {
        if (cancelled) return
        try {
          const data = JSON.parse(e.data)
          const url = buildUrlFromEvent(data)
          const prompt = data?.prompt || ''
          if (!url || urls.current.has(url)) return
          urls.current.add(url)
          queueRef.current.push({ url, prompt })
        } catch (_) {
          // ignore malformed events
        }
      }
      source.onerror = () => {
        setError('Feed temporarily unavailable')
        source.close()
      }
    } catch (err) {
      setError('Unable to connect to feed')
    }
    return () => {
      cancelled = true
      try { source && source.close() } catch { /* noop */ }
    }
  }, [enabled])

  // Gradually move items from queue into the list to avoid overwhelming UI
  useEffect(() => {
    const intervalMs = speed === 'slow' ? 1500 : 700
    const id = setInterval(() => {
      if (!enabled) return
      const next = queueRef.current.shift()
      if (!next) return
      setItems((prev) => {
        const merged = [next, ...prev]
        if (merged.length > MAX_HISTORY) merged.length = MAX_HISTORY
        return merged
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [enabled, speed])

  const visible = useMemo(() => items.slice(pageStart, pageStart + PAGE_SIZE), [items, pageStart])

  const content = useMemo(() => {
    if (error) {
      return (
        <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-400">
          {error}
        </div>
      )
    }
    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-400">
          Waiting for new creations...
        </div>
      )
    }
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((item, idx) => (
          <figure key={item.url + idx} className="group overflow-hidden rounded-xl border border-white/10 bg-slate-900 slide-in-up">
            <img src={item.url} alt={item.prompt || 'Pollinations image'} className="aspect-square w-full object-cover" />
            <figcaption className="flex items-center gap-2 p-2 text-xs text-slate-300">
              <button
                className="btn btn-secondary h-7 px-2 text-xs"
                onClick={() => onUsePrompt?.(item.prompt || '')}
              >
                Use prompt
              </button>
              <button
                className="inline-flex h-7 items-center justify-center rounded-md bg-slate-800 px-2 text-slate-300 hover:bg-slate-700"
                onClick={async () => {
                  await navigator.clipboard.writeText(item.prompt || '')
                }}
                title="Copy prompt"
              >
                <Copy className="size-3.5" />
              </button>
              <span className="line-clamp-2" title={item.prompt}>{item.prompt || '—'}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    )
  }, [visible, items, error, onUsePrompt])

  return (
    <section className="mt-12">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Community Feed</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Speed</span>
          <select className="input h-8 w-[110px] text-xs" value={speed} onChange={(e) => setSpeed(e.target.value)}>
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
          </select>
          <button className="btn btn-secondary h-8 px-3 text-xs" onClick={() => setEnabled((v) => !v)}>
            {enabled ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>
      {content}
      <div className="mt-3 flex items-center justify-between">
        <button
          className="btn btn-secondary h-8 px-3 text-xs disabled:opacity-50"
          onClick={() => setPageStart((s) => Math.min(s + PAGE_SIZE, Math.max(0, items.length - PAGE_SIZE)))}
          disabled={pageStart + PAGE_SIZE >= items.length}
        >
          Older
        </button>
        <div className="text-xs text-slate-400">Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, items.length)} of {items.length}</div>
        <button
          className="btn btn-secondary h-8 px-3 text-xs disabled:opacity-50"
          onClick={() => setPageStart((s) => Math.max(0, s - PAGE_SIZE))}
          disabled={pageStart === 0}
        >
          Newer
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Streaming recent creations from Pollinations. Content is user‑generated.</p>
    </section>
  )
}


