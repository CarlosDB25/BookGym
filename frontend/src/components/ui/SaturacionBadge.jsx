const config = {
  baja: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    label: 'Valle',
  },
  media: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-400',
    label: 'Media',
  },
  alta: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    dot: 'bg-rose-500',
    label: 'Pico',
  },
}

export function SaturacionBadge({ nivel, className = '' }) {
  const c = config[nivel] || config.media

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${c.bg} ${c.text} ${className}`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${c.dot} ${nivel === 'alta' ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  )
}
