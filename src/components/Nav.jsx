import { useState } from 'react'

export default function Nav({ current, onChange }) {
  const tabs = [
    { id: 'create', label: 'Create' },
    { id: 'history', label: 'History' },
  ]
  return (
    <nav className="flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`rounded-full px-4 py-1.5 text-sm ${current === t.id ? 'bg-brand-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
          onClick={() => onChange(t.id)}
        >{t.label}</button>
      ))}
    </nav>
  )
}


