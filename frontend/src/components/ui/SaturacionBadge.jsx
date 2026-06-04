const config = {
  baja: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Con espacio',
  },
  media: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    label: 'Casi lleno',
  },
  alta: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    label: 'Lleno',
  },
}

export function SaturacionBadge({ nivel, className = '' }) {
  const c = config[nivel] || config.media

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text} ${className}`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${c.dot} ${nivel === 'alta' ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  )
}
