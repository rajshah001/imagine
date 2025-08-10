import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { Download, Github, Linkedin, Loader2, Share2, Twitter, Wand2, Shuffle, Link2 } from 'lucide-react'
import Feed from './components/Feed.jsx'
import History from './components/History.jsx'
import { useHistoryStore } from './state/history.jsx'
import Nav from './components/Nav.jsx'
import TemplateBuilder from './components/TemplateBuilder.jsx'
import InfoTip from './components/InfoTip.jsx'
import toast, { Toaster } from 'react-hot-toast'

const DEFAULT_PROMPT = ''

const MODELS = [
  { value: 'flux', label: 'Flux' },
  { value: 'flux-dev', label: 'Flux Dev' },
  { value: 'playground-v2.5', label: 'Playground v2.5' },
  { value: 'sdxl', label: 'SDXL' },
]

const STYLE_PRESETS = [
  { id: 'cinematic', label: 'Cinematic', text: 'cinematic, film still, dramatic lighting, 35mm' },
  { id: 'photoreal', label: 'Photoreal', text: 'ultra-realistic, highly detailed, 8k, natural lighting' },
  { id: 'isometric', label: 'Isometric', text: 'isometric style, clean lines, minimal shadows' },
  { id: 'watercolor', label: 'Watercolor', text: 'soft watercolor painting, textured paper, delicate brush strokes' },
  { id: 'cyberpunk', label: 'Cyberpunk', text: 'cyberpunk neon, rain-soaked streets, reflective lights' },
  { id: 'anime', label: 'Anime', text: 'anime style, vibrant colors, crisp line art' },
  { id: '3drender', label: '3D Render', text: 'octane render, global illumination, hyper-realistic materials' },
]

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', w: 1024, h: 1024 },
  { id: '3:2', label: '3:2', w: 1152, h: 768 },
  { id: '4:5', label: '4:5', w: 1024, h: 1280 },
  { id: '16:9', label: '16:9', w: 1280, h: 720 },
  { id: '9:16', label: '9:16', w: 768, h: 1365 },
]

const TEMPLATES = [
  { id: 'product', label: 'Product shot', pattern: '{subject} product photo, studio lighting, seamless background, high detail' },
  { id: 'portrait', label: 'Portrait', pattern: 'Portrait of {subject}, shallow depth of field, soft light, 85mm lens' },
  { id: 'landscape', label: 'Landscape', pattern: '{place} landscape, golden hour, dramatic sky, wide angle' },
  { id: 'interior', label: 'Interior design', pattern: '{room} interior, natural light, minimalistic, high-end furniture, magazine style' },
  { id: 'food', label: 'Food photo', pattern: '{dish} on ceramic plate, soft daylight, appetizing, shallow depth of field, food photography' },
  { id: 'icon', label: 'UI icon', pattern: '{object} flat vector icon, minimalist, crisp lines, subtle gradient, app icon' },
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
  // Cache bust per generation; allow caller to provide a stable token
  if (opts.bust !== undefined) params.set('bust', String(opts.bust))
  else params.set('bust', String(Date.now()))
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
  const { addItem } = useHistoryStore()
  const [view, setView] = useState('create')
  // Draft (editable) parameters
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [model, setModel] = useState(MODELS[0].value)
  const [seed, setSeed] = useState(() => {
    // Randomize on initial load/refresh only
    return Math.floor(Math.random() * 10_000)
  })
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [nologo, setNologo] = useState(true)
  const [enhance, setEnhance] = useState(false)
  const [safe, setSafe] = useState(true)
  const [seedLocked, setSeedLocked] = useState(false)
  const [stylePreset, setStylePreset] = useState(null)
  const [appliedStylePreset, setAppliedStylePreset] = useState(null)
  const [selectedRatio, setSelectedRatio] = useState('1:1')
  const [activeTemplate, setActiveTemplate] = useState(null)

  // Applied parameters (used to actually fetch an image)
  const [appliedPrompt, setAppliedPrompt] = useState('')
  const [appliedModel, setAppliedModel] = useState(MODELS[0].value)
  const [appliedSeed, setAppliedSeed] = useState(() => Math.floor(Math.random() * 10_000))
  const [appliedWidth, setAppliedWidth] = useState(1024)
  const [appliedHeight, setAppliedHeight] = useState(1024)
  const [appliedNologo, setAppliedNologo] = useState(true)
  const [appliedEnhance, setAppliedEnhance] = useState(false)
  const [appliedSafe, setAppliedSafe] = useState(true)

  const [requestedAt, setRequestedAt] = useState(0)
  const [bust, setBust] = useState(0)
  const [lastShownBust, setLastShownBust] = useState(null)
  const [numVariations, setNumVariations] = useState(1)
  const [abCompare, setAbCompare] = useState(false)
  const [modelB, setModelB] = useState(MODELS[1]?.value || MODELS[0].value)
  const [generated, setGenerated] = useState([]) // {url,label}
  const [isSurprising, setIsSurprising] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [activeTile, setActiveTile] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [loadedTileUrls, setLoadedTileUrls] = useState(() => new Set())

  useEffect(() => {
    try {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
    } catch {}
    try {
      const m = window.matchMedia('(min-width: 640px)')
      setShowAdvanced(m.matches)
      const handler = (e) => setShowAdvanced(e.matches)
      m.addEventListener ? m.addEventListener('change', handler) : m.addListener(handler)
    } catch {}
  }, [])

  const imageUrl = useMemo(() => {
    if (!appliedPrompt) return ''
    const fullPrompt = appliedStylePreset ? `${appliedPrompt}, ${STYLE_PRESETS.find(p => p.id === appliedStylePreset)?.text ?? ''}` : appliedPrompt
    return buildPollinationsUrl(fullPrompt, {
      model: appliedModel,
      seed: appliedSeed,
      width: appliedWidth,
      height: appliedHeight,
      nologo: appliedNologo,
      enhance: appliedEnhance,
      safe: appliedSafe,
      bust,
    })
  }, [appliedPrompt, appliedModel, appliedSeed, appliedWidth, appliedHeight, appliedNologo, appliedEnhance, appliedSafe, appliedStylePreset, bust])

  const { progress, isLoading } = useProgressiveLoader(imageUrl)

  const onGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Enter a prompt to generate')
      return
    }
    // If seed is not locked, randomize per generation
    let nextSeed = seed
    if (!seedLocked) {
      nextSeed = Math.floor(Math.random() * 10_000)
      setSeed(nextSeed)
    }
    // Compute full prompt and URL for history
    const newBust = Date.now()
    const fullForHistory = stylePreset ? `${prompt}, ${STYLE_PRESETS.find(p => p.id === stylePreset)?.text ?? ''}` : prompt
    const seeds = Array.from({ length: numVariations }, (_, i) => (i === 0 ? nextSeed : nextSeed + i))
    const modelsForRun = abCompare ? [model, modelB] : [model]
    const urlsForHistory = []
    let order = 0
    for (const m of modelsForRun) {
      for (const s of seeds) {
        const url = buildPollinationsUrl(fullForHistory, {
          model: m,
          seed: s,
          width,
          height,
          nologo,
          enhance,
          safe,
          bust: newBust + order,
        })
        urlsForHistory.push({ url, label: abCompare ? (m === model ? `A-${s}` : `B-${s}`) : `v${order + 1}`, seed: s, model: m })
        order += 1
      }
    }
    addItem({
      url: urlsForHistory[0]?.url,
      urls: urlsForHistory,
      prompt,
      model,
      modelB: abCompare ? modelB : null,
      seed: nextSeed,
      width,
      height,
      nologo,
      enhance,
      safe,
      stylePreset: stylePreset ?? null,
      ratio: selectedRatio,
      variations: numVariations,
      abCompare,
      timestamp: new Date().toISOString(),
    })
    setGenerated(urlsForHistory)
    toast('Saved to history and generating...', { icon: '✨' })
    // Apply current draft controls and trigger a new generation
    setAppliedPrompt(prompt)
    setAppliedModel(model)
    setAppliedSeed(nextSeed)
    setAppliedWidth(width)
    setAppliedHeight(height)
    setAppliedNologo(nologo)
    setAppliedEnhance(enhance)
    setAppliedSafe(safe)
    setAppliedStylePreset(stylePreset)
    setBust(newBust)
  }

  const onRandomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 10_000)
    setSeed(newSeed)
  }

  const onSelectRatio = (ratioId) => {
    const r = ASPECT_RATIOS.find((r) => r.id === ratioId)
    if (!r) return
    setSelectedRatio(ratioId)
    setWidth(r.w)
    setHeight(r.h)
  }

  const buildTemplateText = (pattern, value) => {
    if (!value) return ''
    return pattern.replace(/\{[^}]+\}/g, value)
  }

  const surpriseMe = () => {
    try {
      setIsSurprising(true)
      const es = new EventSource('https://image.pollinations.ai/feed')
      const timer = setTimeout(() => {
        try { es.close() } catch {}
        setIsSurprising(false)
        toast('Could not load feed right now', { icon: '⚠️' })
      }, 5000)
      es.onmessage = (e) => {
        clearTimeout(timer)
        try {
          const data = JSON.parse(e.data)
          if (data?.prompt) setPrompt(data.prompt)
          if (data?.model) setModel(data.model)
          if (typeof data?.seed === 'number') setSeed(data.seed)
          if (data?.width) setWidth(Number(data.width))
          if (data?.height) setHeight(Number(data.height))
          toast.success('Loaded a community prompt')
        } catch {}
        try { es.close() } catch {}
        setIsSurprising(false)
      }
      es.onerror = () => {
        try { es.close() } catch {}
        setIsSurprising(false)
        toast('Feed unavailable right now', { icon: '⚠️' })
      }
    } catch {
      setIsSurprising(false)
    }
  }

  const onDownload = async () => {
    if (!imageUrl) return
    try {
      // Retry with backoff if network hiccups
      const fetchWithRetry = async (url, attempts = 3) => {
        let lastErr
        for (let i = 0; i < attempts; i++) {
          try {
            const res = await fetch(url, { mode: 'cors' })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res
          } catch (e) {
            lastErr = e
            await new Promise(r => setTimeout(r, 400 * Math.pow(2, i)))
          }
        }
        throw lastErr
      }

      const response = await fetchWithRetry(imageUrl)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      const dt = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const stamp = `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}-${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`
      link.download = `${stamp}-${appliedModel}-${appliedSeed}-${appliedWidth}x${appliedHeight}.png`
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
        await navigator.share({ title: 'Generated with Pollinations', text: appliedPrompt, url: imageUrl })
        toast.success('Shared via OS share sheet')
        return
      }

      // Fallback: copy Pollinations image URL to clipboard
      // Retry copy in case of permission delay
      const tryCopy = async () => {
        try { await navigator.clipboard.writeText(imageUrl); return true } catch { return false }
      }
      if (!(await tryCopy())) {
        await new Promise(r => setTimeout(r, 300));
        await tryCopy()
      }
      toast('Share link copied to clipboard', { icon: '🔗' })
    } catch (err) {
      toast.error('Unable to share right now')
    }
  }

  const onCopyLink = async () => {
    if (!imageUrl) return
    await navigator.clipboard.writeText(imageUrl)
    toast('Copied image URL', { icon: '🔗' })
  }

  const downloadTile = async (tileUrl, label = 'image') => {
    try {
      const res = await fetch(tileUrl)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${label}-${appliedModel}-${appliedWidth}x${appliedHeight}.png`
      document.body.appendChild(link); link.click(); link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      toast.error('Download failed')
    }
  }

  const shareTile = async (tileUrl) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Generated with Pollinations', url: tileUrl })
        return
      }
      await navigator.clipboard.writeText(tileUrl)
      toast('Link copied', { icon: '🔗' })
    } catch {
      toast.error('Share failed')
    }
  }

  // removed per request: settings link & markdown helpers

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Toaster position="top-right" />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Imagine" className="h-9 w-9" />
              <div>
                <h1 className="text-lg font-semibold">Imagine</h1>
                <p className="hidden text-xs text-slate-400 sm:block">Generate images via Pollinations</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <a
                href="https://x.com/DaRajShah"
                target="_blank"
                rel="noreferrer"
                aria-label="Raj Shah on X"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-slate-300 hover:text-white"
              >
                <Twitter className="size-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/rajshah001/"
                target="_blank"
                rel="noreferrer"
                aria-label="Raj Shah on LinkedIn"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-slate-300 hover:text-white"
              >
                <Linkedin className="size-4" />
              </a>
              <a
                href="https://github.com/rajshah001"
                target="_blank"
                rel="noreferrer"
                aria-label="Raj Shah on GitHub"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-slate-300 hover:text-white"
              >
                <Github className="size-4" />
              </a>
            </nav>
          </div>
          <div className="mt-2 flex justify-center">
            <Nav current={view} onChange={setView} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        {view === 'create' && (
        <section className="glass rounded-2xl p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <label className="label flex items-center gap-2">Prompt <InfoTip align="start" text="Describe exactly what you want in the image. Be specific about subject, style, lighting, composition." /></label>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    className={classNames('template-chip', activeTemplate === t.id && 'ring-1 ring-brand-500')}
                    onClick={() => setActiveTemplate(activeTemplate === t.id ? null : t.id)}
                    title={`Use ${t.label} template`}
                  >{t.label}</button>
                ))}
                <button className="btn btn-secondary h-8 gap-1 px-3" onClick={surpriseMe} title="Load a random community prompt">
                  <Shuffle className="size-3.5" /> Surprise me
                </button>
              </div>
              {activeTemplate && (
                <TemplateBuilder
                  template={TEMPLATES.find(t => t.id === activeTemplate)}
                  currentPrompt={prompt}
                  onApply={(txt, tpl) => { setPrompt(txt); setActiveTemplate(null); toast.success(`${tpl.label} template applied`) }}
                  onCancel={() => setActiveTemplate(null)}
                />
              )}
            </div>
            <textarea
              className="input min-h-24 resize-y"
              placeholder="Describe what you want to see"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="label mr-1">Style <InfoTip align="start" text="Select a style for your image."></InfoTip></span>
              <button
                key="none"
                className={classNames('rounded-full border px-3 py-1 text-xs', !stylePreset ? 'border-brand-500 bg-brand-600/20 text-white' : 'border-white/10 bg-slate-900 text-slate-300 hover:text-white')}
                onClick={() => setStylePreset(null)}
                title="No preset"
              >None</button>
              {STYLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={classNames('rounded-full border px-3 py-1 text-xs', stylePreset === p.id ? 'border-brand-500 bg-brand-600/20 text-white' : 'border-white/10 bg-slate-900 text-slate-300 hover:text-white')}
                  onClick={() => setStylePreset(stylePreset === p.id ? null : p.id)}
                  title={p.text}
                >{p.label}</button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="label mr-1">Aspect <InfoTip align="start" text="Select an aspect ratio for your image."></InfoTip></span>
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r.id}
                  className={classNames('rounded-full border px-3 py-1 text-xs', selectedRatio === r.id ? 'border-brand-500 bg-brand-600/20 text-white' : 'border-white/10 bg-slate-900 text-slate-300 hover:text-white')}
                  onClick={() => onSelectRatio(r.id)}
                >{r.label}</button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <div>
                <label className="label flex items-center gap-1">Model <InfoTip align="start" text="Image generation model to use. Different models give different styles." /></label>
                <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 hidden sm:block">
                <label className="label flex items-center gap-1">Seed <InfoTip align="start" text="Randomness control. Same prompt + same seed gives repeatable results. Toggle lock to keep the same seed between runs." /></label>
                <div className="flex items-center gap-2">
                  <input className="input w-28 sm:w-32 md:w-36" type="number" value={seed}
                         onChange={(e) => setSeed(Number(e.target.value))} />
                  <button className="btn btn-secondary whitespace-nowrap" onClick={onRandomizeSeed}>Random</button>
                  <label className="ml-2 inline-flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap">
                    <input type="checkbox" className="size-4" checked={seedLocked} onChange={(e) => setSeedLocked(e.target.checked)} />
                    Lock
                  </label>
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-1">Width <InfoTip align="start" text="Output image width in pixels." /></label>
                <input className="input" type="number" value={width}
                       onChange={(e) => setWidth(Number(e.target.value))} />
              </div>

              <div>
                <label className="label flex items-center gap-1">Height <InfoTip align="start" text="Output image height in pixels." /></label>
                <input className="input" type="number" value={height}
                       onChange={(e) => setHeight(Number(e.target.value))} />
              </div>

              <div className="hidden items-center gap-2 pt-6 sm:flex">
                <input id="nologo" type="checkbox" className="size-4" checked={nologo}
                       onChange={(e) => setNologo(e.target.checked)} />
                <label htmlFor="nologo" className="label flex items-center gap-1">No logo <InfoTip align="start" text="Removes any provider watermarks where possible." /></label>
              </div>

              <div className="hidden items-center gap-2 pt-6 sm:flex">
                <input id="enhance" type="checkbox" className="size-4" checked={enhance}
                       onChange={(e) => setEnhance(e.target.checked)} />
                <label htmlFor="enhance" className="label flex items-center gap-1">Enhance <InfoTip align="start" text="Extra post-processing for sharpness and detail." /></label>
              </div>
              <div>
                <label className="label flex items-center gap-1">Variations <InfoTip align="start" text="Number of different outputs to render in one click (different seeds)." /></label>
                <select className="input" value={numVariations} onChange={(e) => setNumVariations(Number(e.target.value))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div className="hidden md:col-span-2 items-center gap-3 pt-6 sm:flex">
                <input id="ab" type="checkbox" className="size-4" checked={abCompare} onChange={(e)=>setAbCompare(e.target.checked)} />
                <label htmlFor="ab" className="label flex items-center gap-1">A/B Compare <InfoTip text="Render the same prompt with two models side-by-side." /></label>
                {abCompare && (
                  <>
                    <span className="text-xs text-slate-400">Model B</span>
                    <select className="input" value={modelB} onChange={(e)=>setModelB(e.target.value)}>
                      {MODELS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Model: <span className="text-slate-200">{model}</span></span>
                <span>Seed: <span className="text-slate-200">{seed}</span></span>
                <span>Size: <span className="text-slate-200">{width}×{height}</span></span>
              </div>
              <div className="hidden gap-2 sm:flex">
                <button className="btn" onClick={onGenerate}>
                  <Wand2 className="size-4" />
                  Generate
                </button>
              </div>
            </div>

            {/* Mobile Advanced Settings */}
            <div className="sm:hidden">
              <button className="btn btn-secondary w-full" onClick={() => setShowAdvanced((v) => !v)}>
                {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
              </button>
              <div className="mt-2 flex justify-center">
                <button className="btn w-full max-w-xs" onClick={onGenerate}>
                  <Wand2 className="size-4" /> Generate
                </button>
              </div>
              {showAdvanced && (
                <div className="mt-3 space-y-4">
                  <div>
                    <label className="label">Seed</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input className="input w-28" type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
                      <button className="btn btn-secondary" onClick={onRandomizeSeed}>Random</button>
                      <label className="ml-2 inline-flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap">
                        <input type="checkbox" className="size-4" checked={seedLocked} onChange={(e) => setSeedLocked(e.target.checked)} />
                        Lock
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="inline-flex items-center gap-2"><input type="checkbox" className="size-4" checked={nologo} onChange={(e) => setNologo(e.target.checked)} /> <span className="label">No logo</span></label>
                    <label className="inline-flex items-center gap-2"><input type="checkbox" className="size-4" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} /> <span className="label">Enhance</span></label>
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2"><input type="checkbox" className="size-4" checked={abCompare} onChange={(e)=> setAbCompare(e.target.checked)} /> <span className="label">A/B Compare</span></label>
                    {abCompare && (
                      <div className="mt-2">
                        <span className="text-xs text-slate-400 mr-2">Model B</span>
                        <select className="input inline-block w-44" value={modelB} onChange={(e)=> setModelB(e.target.value)}>
                          {MODELS.map((m)=> (<option key={m.value} value={m.value}>{m.label}</option>))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        {view === 'create' && (
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
              <div className={classNames('gen-grid grid gap-2 p-2', (()=>{ const c = generated.length; return c===2 ? 'sm:grid-cols-2' : c===4 ? 'sm:grid-cols-2 md:grid-cols-2' : c>=3 ? 'sm:grid-cols-2 lg:grid-cols-3' : '' })())}>
                {[{url:imageUrl,label:generated[0]?.label, seed: generated[0]?.seed, model: generated[0]?.model}, ...generated.slice(1)].map((g, idx) => {
                  const tileId = (g.label || `v${idx+1}`) + '-' + idx
                  return (
                    <div key={(g.url||'base')+idx} className="group relative overflow-hidden rounded-lg border border-white/10 bg-slate-900"
                         onTouchStart={() => setActiveTile(tileId)}>
                      <div className="absolute left-2 top-2 z-10 rounded bg-slate-950/60 px-2 py-0.5 text-xs">{g.label || `v${idx+1}`}</div>
                      <div
                        className="relative w-full overflow-hidden"
                        style={{ aspectRatio: `${appliedWidth}/${appliedHeight}` }}
                      >
                        <img
                          src={g.url || imageUrl}
                          alt="Generated"
                          onLoad={() => setLoadedTileUrls((prev) => { const s = new Set(prev); s.add(g.url || imageUrl); return s })}
                          className={classNames('absolute inset-0 h-full w-full object-cover transition-opacity', loadedTileUrls.has(g.url || imageUrl) ? 'opacity-100' : 'opacity-0')}
                        />
                        {!loadedTileUrls.has(g.url || imageUrl) && (
                          <div className="absolute inset-0 grid place-items-center bg-slate-900/30">
                            <img src={`${import.meta.env.BASE_URL}logo.svg`} className="h-10 w-10 animate-spin-slow opacity-80" alt="loading" />
                          </div>
                        )}
                      </div>
                      {/* Desktop (hover) toolbar overlay */}
                      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 hidden items-center justify-center gap-3 p-3 backdrop-blur-sm text-[13px] md:text-sm sm:group-hover:flex">
                        <button className="btn btn-secondary h-10 px-3 grid place-items-center gap-2" title="Download" onClick={() => downloadTile(g.url || imageUrl, g.label)}>
                          <Download className="size-5" /> <span className="hidden sm:inline">Download</span>
                        </button>
                        <button className="btn btn-secondary h-10 px-3 grid place-items-center gap-2" title="Share" onClick={() => shareTile(g.url || imageUrl)}>
                          <Share2 className="size-5" /> <span className="hidden sm:inline">Share</span>
                        </button>
                        <button className="btn btn-secondary h-10 px-3 grid place-items-center gap-2" title="Copy link" onClick={async () => { await navigator.clipboard.writeText(g.url || imageUrl); toast('Copied link',{icon:'🔗'})}}>
                          <Link2 className="size-5" /> <span className="hidden sm:inline">Copy link</span>
                        </button>
                      </div>
                      {/* Mobile persistent icon row */}
                      <div className="flex items-center justify-center gap-3 p-2 sm:hidden">
                        <button className="btn btn-secondary h-12 w-12 p-0 grid place-items-center" title="Download" onClick={() => downloadTile(g.url || imageUrl, g.label)}>
                          <Download className="size-6" />
                        </button>
                        <button className="btn btn-secondary h-12 w-12 p-0 grid place-items-center" title="Share" onClick={() => shareTile(g.url || imageUrl)}>
                          <Share2 className="size-6" />
                        </button>
                        <button className="btn btn-secondary h-12 w-12 p-0 grid place-items-center" title="Copy link" onClick={async () => { await navigator.clipboard.writeText(g.url || imageUrl); toast('Copied link',{icon:'🔗'})}}>
                          <Link2 className="size-6" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="grid h-[60vh] place-items-center text-slate-400">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="loading" className="h-12 w-12 animate-spin-slow" />
                    <span className="text-xs">Generating…</span>
                  </div>
                ) : (
                  <p>Enter a prompt and click Generate to see results</p>
                )}
              </div>
            )}
      </div>

          {/* Per-requested change: removed global action buttons in favor of per-tile actions */}
        </section>
        )}

        <div className={view === 'create' ? '' : 'hidden'}>
          <Feed onUsePrompt={(p) => setPrompt(p)} />
        </div>
        {view === 'history' && (
          <History onLoad={(it) => {
            setPrompt(it.prompt || '')
            setModel(it.model || model)
            setSeed(it.seed ?? seed)
            setWidth(it.width ?? width)
            setHeight(it.height ?? height)
            setStylePreset(it.stylePreset ?? null)
            setView('create')
          }} />
        )}
      </main>
      {/* Sticky mobile bar removed per request */}
      <footer className="border-t border-white/10 bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-slate-400 md:flex-row md:justify-between md:text-left">
          <p>
            Built by <a className="text-slate-200 hover:underline" href="https://github.com/rajshah001" target="_blank" rel="noreferrer">Raj Shah</a>
          </p>
          <p>
            Powered by <a className="text-slate-200 hover:underline" target="_blank" rel="noreferrer" href="https://github.com/pollinations/pollinations/blob/master/APIDOCS.md">Pollinations AI</a>
        </p>
      </div>
      </footer>
    </div>
  )
}

export default App
