import { useHistoryStore } from '../state/history.js'

export default function History({ onLoad }) {
  const { items, clear } = useHistoryStore()

  if (!items.length) return null

  return (
    <section className="mt-12">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Your History</h2>
        <button className="btn btn-secondary h-8 px-3 text-xs" onClick={clear}>Clear</button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it, idx) => (
          <figure key={idx} className="overflow-hidden rounded-xl border border-white/10 bg-slate-900">
            <img src={it.url} alt="history" className="aspect-square w-full object-cover" />
            <div className="flex items-center gap-2 p-2 text-xs">
              <button className="btn btn-secondary h-8 text-xs" onClick={() => onLoad?.(it)}>Remix</button>
              <button className="btn btn-secondary h-8 text-xs" onClick={async () => navigator.clipboard.writeText(it.url)}>Copy link</button>
            </div>
          </figure>
        ))}
      </div>
    </section>
  )
}

