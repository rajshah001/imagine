import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { Download, Image as ImageIcon, Loader2, Share2, Wand2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const DEFAULT_PROMPT = 'A futuristic city with flying cars and neon lights, ultra-detailed, cinematic lighting, wide angle';

const MODELS = [
  { value: 'flux', label: 'Flux' },
  { value: 'flux-dev', label: 'Flux Dev' },
  { value: 'playground-v2.5', label: 'Playground v2.5' },
  { value: 'sdxl', label: 'SDXL' },
]

function classNames(...values) {
  return values.filter(Boolean).join(' ')
}

function buildPollinationsUrl(prompt, opts) {
  const params = new URLSearchParams()
  // Per Pollinations API, width/height/seed/model/nologo/enhance accepted
  if (opts.width) params.set('width', String(opts.width))
  if (opts.height) params.set('height', String(opts.height))
  if (opts.seed !== undefined && opts.seed !== null && opts.seed !== '') params.set('seed', String(opts.seed))
  if (opts.model) params.set('model', opts.model)
  if (opts.nologo !== undefined) params.set('nologo', String(opts.nologo))
  if (opts.enhance !== undefined) params.set('enhance', String(opts.enhance))
  if (opts.safe !== undefined) params.set('safe', String(opts.safe))
  if (opts.steps) params.set('steps', String(opts.steps))
  if (opts.strength) params.set('strength', String(opts.strength))
  // Cache bust using a small nonce when prompt or seed changes
  params.set('bust', String(Date.now()))
  const encodedPrompt = encodeURIComponent(prompt.trim())
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`
}

function useProgressiveLoader(imageUrl) {
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!imageUrl) return
    setIsLoading(true)
    setProgress(5)
    let raf
    let percent = 5
    const tick = () => {
      percent = Math.min(percent + (percent < 80 ? 1.2 : 0.25), 95)
      setProgress(percent)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const img = new Image()
    img.onload = () => {
      cancelAnimationFrame(raf)
      setProgress(100)
      setTimeout(() => setIsLoading(false), 350)
    }
    img.onerror = () => {
      cancelAnimationFrame(raf)
      setIsLoading(false)
    }
    img.src = imageUrl

    return () => cancelAnimationFrame(raf)
  }, [imageUrl])

  return { progress, isLoading }
}

function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [model, setModel] = useState(MODELS[0].value)
  const [seed, setSeed] = useState(42)
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [nologo, setNologo] = useState(true)
  const [enhance, setEnhance] = useState(false)
  const [safe, setSafe] = useState(true)

  const [requestedAt, setRequestedAt] = useState(0)

  const imageUrl = useMemo(() => {
    if (!prompt) return ''
    return buildPollinationsUrl(prompt, { model, seed, width, height, nologo, enhance, safe })
  }, [prompt, model, seed, width, height, nologo, enhance, safe, requestedAt])

  const { progress, isLoading } = useProgressiveLoader(imageUrl)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const shareRef = useRef(null)

  const onGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Enter a prompt to generate')
      return
    }
    setRequestedAt(Date.now())
  }

  const onRandomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 10_000)
    setSeed(newSeed)
  }

  const onDownload = async () => {
    if (!imageUrl) return
    try {
      const response = await fetch(imageUrl, { mode: 'cors' })
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `pollinations-${seed}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
      toast.success('Image downloaded')
    } catch (err) {
      toast.error('Download failed')
    }
  }

  const onShare = async () => {
    if (!imageUrl) return
    try {
      // Try Web Share API first
      if (navigator.share) {
        await navigator.share({ title: 'Generated with Pollinations', text: prompt, url: imageUrl })
        toast.success('Shared via OS share sheet')
        setIsShareOpen(false)
        return
      }

      // Fallback: copy Pollinations image URL to clipboard
      await navigator.clipboard.writeText(imageUrl)
      toast('Share link copied to clipboard', { icon: '🔗' })
      setIsShareOpen(false)
    } catch (err) {
      toast.error('Unable to share right now')
    }
  }

  // Close share popover on outside click / ESC
  useEffect(() => {
    if (!isShareOpen) return
    const onDocClick = (e) => {
      if (!shareRef.current) return
      if (!shareRef.current.contains(e.target)) setIsShareOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setIsShareOpen(false)
    }
    document.addEventListener('pointerdown', onDocClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDocClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [isShareOpen])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Toaster position="top-right" />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-brand-600 grid place-items-center">
              <ImageIcon className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Imagine</h1>
              <p className="text-xs text-slate-400">Generate images via Pollinations</p>
            </div>
          </div>
          <a
            href="https://github.com/pollinations/pollinations/blob/master/APIDOCS.md"
            className="hidden md:inline-flex text-xs text-slate-300 hover:text-white"
            target="_blank" rel="noreferrer"
          >API Docs</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <section className="glass rounded-2xl p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <label className="label">Prompt</label>
            <textarea
              className="input min-h-24 resize-y"
              placeholder="Describe what you want to see"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <div>
                <label className="label">Model</label>
                <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Seed</label>
                <div className="flex gap-2">
                  <input className="input" type="number" value={seed}
                         onChange={(e) => setSeed(Number(e.target.value))} />
                  <button className="btn btn-secondary" onClick={onRandomizeSeed}>Random</button>
                </div>
              </div>

              <div>
                <label className="label">Width</label>
                <input className="input" type="number" value={width}
                       onChange={(e) => setWidth(Number(e.target.value))} />
              </div>

              <div>
                <label className="label">Height</label>
                <input className="input" type="number" value={height}
                       onChange={(e) => setHeight(Number(e.target.value))} />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input id="nologo" type="checkbox" className="size-4" checked={nologo}
                       onChange={(e) => setNologo(e.target.checked)} />
                <label htmlFor="nologo" className="label">No logo</label>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input id="enhance" type="checkbox" className="size-4" checked={enhance}
                       onChange={(e) => setEnhance(e.target.checked)} />
                <label htmlFor="enhance" className="label">Enhance</label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Model: <span className="text-slate-200">{model}</span></span>
                <span>Seed: <span className="text-slate-200">{seed}</span></span>
                <span>Size: <span className="text-slate-200">{width}×{height}</span></span>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={onGenerate}>
                  <Wand2 className="size-4" />
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-medium">Generated Image</h2>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            {isLoading && (
              <div className="absolute inset-x-0 top-0 z-10">
                <div className="h-1 w-full bg-slate-800">
                  <div
                    className="h-1 bg-brand-500 transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="pointer-events-none absolute right-3 top-2 flex items-center gap-2 rounded-full bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
                  <Loader2 className="size-3 animate-spin" />
                  Generating...
                </div>
              </div>
            )}

            {imageUrl ? (
              <img src={imageUrl} alt="Generated"
                   className={classNames('w-full object-contain transition-opacity', isLoading ? 'opacity-70' : 'opacity-100')} />
            ) : (
              <div className="grid h-[60vh] place-items-center text-slate-400">
                <p>Enter a prompt and click Generate to see results</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button className="btn" onClick={onDownload} disabled={!imageUrl}>
              <Download className="size-4" /> Download
            </button>

            <div className="relative" ref={shareRef}>
              <button
                className="btn btn-secondary"
                onClick={() => setIsShareOpen((v) => !v)}
                disabled={!imageUrl}
                aria-expanded={isShareOpen}
                aria-haspopup="dialog"
              >
                <Share2 className="size-4" /> Share
              </button>

              {isShareOpen && (
                <div
                  role="dialog"
                  aria-label="Share options"
                  className="absolute left-0 top-full z-20 mt-2 w-80 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-lg backdrop-blur-md"
                >
                  <p className="mb-3 text-sm text-slate-300">Share this image:</p>
                  <div className="flex flex-col gap-2">
                    <button className="btn" onClick={onShare}>
                      Share via OS / Copy link
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={async () => {
                        await navigator.clipboard.writeText(imageUrl)
                        toast('Copied image URL', { icon: '🔗' })
                        setIsShareOpen(false)
                      }}
                    >
                      Copy image URL
                    </button>
                    <button className="btn btn-secondary" onClick={() => setIsShareOpen(false)}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
