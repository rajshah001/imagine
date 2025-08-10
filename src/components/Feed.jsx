import { useEffect, useMemo, useRef, useState } from 'react'

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

export default function Feed({ onUsePrompt }) {
  const [items, setItems] = useState([])
  const [enabled, setEnabled] = useState(true)
  const [error, setError] = useState('')
  const urls = useRef(new Set())

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
          setItems((prev) => [{ url, prompt }, ...prev].slice(0, 36))
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((item, idx) => (
          <figure key={item.url + idx} className="group overflow-hidden rounded-xl border border-white/10 bg-slate-900">
            <img src={item.url} alt={item.prompt || 'Pollinations image'} className="aspect-square w-full object-cover" />
            <figcaption className="flex items-center gap-2 p-2 text-xs text-slate-300">
              <button
                className="btn btn-secondary h-7 px-2 text-xs"
                onClick={() => onUsePrompt?.(item.prompt || '')}
              >
                Use prompt
              </button>
              <span className="line-clamp-2">{item.prompt || '—'}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    )
  }, [items, error, onUsePrompt])

  return (
    <section className="mt-12">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Community Feed</h2>
        <button className="btn btn-secondary h-8 px-3 text-xs" onClick={() => setEnabled((v) => !v)}>
          {enabled ? 'Pause' : 'Resume'}
        </button>
      </div>
      {content}
      <p className="mt-2 text-xs text-slate-500">Streaming recent creations from Pollinations. Content is user‑generated.</p>
    </section>
  )
}


