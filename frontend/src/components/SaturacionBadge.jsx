const colores = {
  baja: 'tag-success',
  media: 'tag-warning',
  alta: 'tag-danger',
};

export function SaturacionBadge({ nivel }) {
  const estado = colores[nivel] || colores.media;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${estado}`}>
      {nivel}
    </span>
  );
}
