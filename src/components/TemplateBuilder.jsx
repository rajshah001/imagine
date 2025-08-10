import { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'

export default function TemplateBuilder({ template, currentPrompt, onApply, onCancel }) {
  const fieldNames = useMemo(() => {
    const names = new Set()
    const re = /\{([^}]+)\}/g
    let m
    while ((m = re.exec(template.pattern)) !== null) {
      names.add(m[1])
    }
    return Array.from(names)
  }, [template])

  const [values, setValues] = useState(() => Object.fromEntries(fieldNames.map((n) => [n, ''])))
  const [mode, setMode] = useState('replace') // 'replace' | 'append'

  const preview = useMemo(() => {
    let text = template.pattern
    for (const name of fieldNames) {
      const v = (values[name] || '').trim()
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), v || `{${name}}`)
    }
    if (mode === 'append' && currentPrompt) return `${currentPrompt}, ${text}`
    return text
  }, [template, fieldNames, values, mode, currentPrompt])

  const canApply = fieldNames.every((n) => (values[n] || '').trim().length > 0)

  return (
    <Popover.Root defaultOpen>
      <Popover.Trigger asChild>
        <button className="hidden" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="bottom" align="end" sideOffset={8}
          className="z-50 w-[min(95vw,34rem)] rounded-xl border border-white/10 bg-slate-900/95 p-4 shadow-lg backdrop-blur-md">
          <div className="mb-2 text-sm font-medium text-slate-200">{template.label} template</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fieldNames.map((name) => (
              <label key={name} className="text-xs text-slate-300">
                {name}
                <input
                  className="input mt-1 h-8"
                  placeholder={name}
                  value={values[name]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [name]: e.target.value }))}
                />
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-2"><input type="radio" name="tplmode" checked={mode==='replace'} onChange={() => setMode('replace')} /> Replace</label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="tplmode" checked={mode==='append'} onChange={() => setMode('append')} /> Append</label>
          </div>

          <div className="mt-3 text-xs text-slate-400">Preview</div>
          <div className="mt-1 rounded-md border border-white/10 bg-slate-950/60 p-2 text-sm">{preview}</div>

          <div className="mt-4 flex justify-end gap-2">
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn" disabled={!canApply} onClick={() => onApply(preview)}>Apply</button>
          </div>
          <Popover.Arrow className="fill-slate-900/95" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}


