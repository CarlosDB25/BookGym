const colores = {
  baja: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  media: 'bg-amber-100 text-amber-700 ring-amber-200',
  alta: 'bg-rose-100 text-rose-700 ring-rose-200',
};

export function SaturacionBadge({ nivel }) {
  const estado = colores[nivel] || colores.media;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${estado}`}>
      {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
    </span>
  );
}
