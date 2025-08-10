import * as Tooltip from '@radix-ui/react-tooltip'

export default function InfoTip({ text, side = 'bottom', align = 'center' }) {
  return (
    <Tooltip.Provider delayDuration={120} disableHoverableContent={false}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-slate-800 text-[10px] leading-none text-slate-300 hover:text-white"
            aria-label="More info"
          >
            i
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            align={align}
            className="animate-fade z-50 inline-block max-w-[min(92vw,26rem)] rounded-md border border-white/10 bg-slate-900/95 p-3 text-xs text-slate-200 shadow-lg backdrop-blur-md"
            sideOffset={8}
          >
            {text}
            <Tooltip.Arrow className="fill-slate-900/95" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}


