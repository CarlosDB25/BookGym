const colores = {
  baja: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  media: 'bg-amber-100 text-amber-800 ring-amber-300',
  alta: 'bg-rose-100 text-rose-800 ring-rose-300',
};

export function SaturacionBadge({ nivel }) {
  const estado = colores[nivel] || colores.media;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${estado}`}>
      {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
    </span>
  );
}
