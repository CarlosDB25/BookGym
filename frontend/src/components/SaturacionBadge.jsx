const colores = {
  baja: 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/40',
  media: 'bg-amber-500/20 text-amber-200 ring-amber-400/40',
  alta: 'bg-rose-500/20 text-rose-200 ring-rose-400/40',
};

export function SaturacionBadge({ nivel }) {
  const estado = colores[nivel] || colores.media;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${estado}`}>
      {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
    </span>
  );
}
