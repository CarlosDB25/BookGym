import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  getFilteredRowModel,
} from '@tanstack/react-table'
import { useAdminSuspensiones, useLevantarSuspension, useSuspensionHistorial, useCrearSuspension } from '../../hooks/useAdmin'
import { ActionModal } from '../../components/ui/ActionModal'
import { CardSkeleton } from '../../components/ui/SkeletonLoader'
import { EmptyState } from '../../components/ui/EmptyState'
import { IconUsers, IconShieldAlert, IconAlertTriangle, IconChevronUp, IconChevronDown, IconChevronLeft, IconChevronRight, IconX, IconUserCheck, IconFileText, IconHistory, IconSearch } from '../../components/shared/Icons'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars

const STATUS_BADGE = {
  suspendido: 'bg-danger-50 text-danger-700 border-danger-200',
  riesgo: 'bg-warning-50 text-warning-700 border-warning-200',
  activo: 'bg-success-50 text-success-700 border-success-200',
}

function SuspensionHistory() {
  const { data: logs = [], isLoading } = useSuspensionHistorial()

  if (isLoading) {
    return <div className="space-y-2"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
  }

  const susLogs = logs.filter((l) =>
    ['crear_suspension', 'levantar_suspension'].includes(l.accion)
  )

  if (susLogs.length === 0) {
    return (
      <EmptyState
        icon={IconHistory}
        title="Sin actividad de suspensiones"
        message="No se han registrado suspensiones o levantamientos manuales."
      />
    )
  }

  return (
    <div className="space-y-3">
      {susLogs.map((log) => {
        let detalle = {}
        try { detalle = JSON.parse(log.detalle || '{}') } catch { /* empty */ }
        const esCrear = log.accion === 'crear_suspension'
        return (
          <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className={`flex items-center gap-1.5 font-semibold ${esCrear ? 'text-danger-600' : 'text-success-600'}`}>
                {esCrear ? <IconShieldAlert className="h-3.5 w-3.5" /> : <IconUserCheck className="h-3.5 w-3.5" />}
                {esCrear ? 'Suspensión creada' : 'Suspensión levantada'}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(log.creadoEn).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Admin: {log.idUsuario} · Usuario: {detalle.idUsuario || '—'}
            </p>
            {detalle.motivo && (
              <p className="mt-1 text-[11px] text-slate-600">
                Motivo: {detalle.motivo}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function AdminUsuarios({ onNotice }) {
  const [tab, setTab] = useState('miembros')
  const [filter, setFilter] = useState('todos')
  const [searchId, setSearchId] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modal, setModal] = useState({ open: false })
  const [justificacion, setJustificacion] = useState('')
  const [suspensionModal, setSuspensionModal] = useState({ open: false })
  const [suspensionForm, setSuspensionForm] = useState({ motivo: '', fechaFin: '' })

  const { data: suspensiones = [], isLoading } = useAdminSuspensiones()
  const levantar = useLevantarSuspension()
  const crearSuspension = useCrearSuspension()

  const filteredData = useMemo(() => {
    let data = suspensiones
    if (filter === 'suspendidos') data = data.filter((s) => s.activa)
    else if (filter === 'riesgo') data = data.filter((s) => !s.activa && s.noshowCount >= 2)
    if (searchId.trim()) {
      const q = searchId.trim().toLowerCase()
      data = data.filter((s) =>
        (s.usuarioId && String(s.usuarioId).toLowerCase().includes(q)) ||
        (s.usuarioNombre && s.usuarioNombre.toLowerCase().includes(q))
      )
    }
    return data
  }, [suspensiones, filter, searchId])

  const columns = useMemo(() => {
    const col = createColumnHelper()
    return [
      col.accessor('usuarioNombre', {
        header: 'Nombre',
        cell: (info) => (
          <span className="font-medium text-slate-800">{info.getValue() || '—'}</span>
        ),
      }),
      col.accessor('usuarioId', {
        header: 'Cédula',
        cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
      }),
      col.accessor('programa', {
        header: 'Programa',
        cell: (info) => <span className="text-slate-600">{info.getValue() || '—'}</span>,
      }),
      col.accessor('noshowCount', {
        header: '% Inasist.',
        cell: (info) => {
          const val = info.getValue() || 0
          return (
            <span className={`font-medium ${val >= 3 ? 'text-danger-600' : val >= 2 ? 'text-warning-600' : ''}`}>
              {val * 10}%
            </span>
          )
        },
      }),
      col.accessor('activa', {
        header: 'Estado',
        cell: (info) => {
          const activa = info.getValue()
          const noshowCount = info.row.original.noshowCount || 0
          let status = 'activo'
          let label = 'Activo'
          if (activa) { status = 'suspendido'; label = 'Suspendido' }
          else if (noshowCount >= 2) { status = 'riesgo'; label = 'En riesgo' }
          return (
            <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGE[status]}`}>
              {label}
            </span>
          )
        },
      }),
    ]
  }, [])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  })

  function openDrawer(user) {
    setSelectedUser(user)
    setDrawerOpen(true)
  }

  function openLevantarModal() {
    setJustificacion('')
    setModal({ open: true, type: 'info', title: 'Levantar suspensión', confirm: true })
  }

  function openSuspensionModal() {
    setSuspensionForm({ motivo: '', fechaFin: '' })
    setSuspensionModal({ open: true })
  }

  async function confirmarSuspension() {
    if (!selectedUser?.usuarioId || !suspensionForm.motivo.trim() || !suspensionForm.fechaFin) return
    try {
      await crearSuspension.mutateAsync({
        idUsuario: selectedUser.usuarioId,
        fechaInicio: new Date().toISOString().slice(0, 10),
        motivo: suspensionForm.motivo,
        fechaFin: suspensionForm.fechaFin,
      })
      onNotice?.('success', 'Suspensión creada exitosamente')
      setSuspensionModal({ open: false })
      setDrawerOpen(false)
      setSelectedUser(null)
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'Error al crear suspensión')
    }
  }

  async function confirmarLevantar() {
    const suspensionId = selectedUser?.suspension?.id
    if (!suspensionId || !justificacion.trim()) return
    try {
      await levantar.mutateAsync({ id: suspensionId, justificacion })
      onNotice?.('success', 'Suspensión levantada exitosamente')
      setModal({ open: false })
      setDrawerOpen(false)
      setSelectedUser(null)
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'Error al levantar suspensión')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <CardSkeleton className="h-12 w-96" />
        <CardSkeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <ActionModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        lines={['Ingresa la justificación de auditoría para levantar esta suspensión.']}
        onClose={() => setModal({ open: false })}
        onConfirm={modal.confirm ? confirmarLevantar : undefined}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
      >
        <textarea
          className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-50"
          rows={3}
          placeholder="Justificación obligatoria..."
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
        />
      </ActionModal>

      <ActionModal
        open={suspensionModal.open}
        type="danger"
        title="Crear suspensión manual"
        lines={['Especifica la duración y motivo de la suspensión para este usuario.']}
        onClose={() => setSuspensionModal({ open: false })}
        onConfirm={confirmarSuspension}
        confirmLabel="Crear suspensión"
        cancelLabel="Cancelar"
      >
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Fecha de fin</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-50"
              value={suspensionForm.fechaFin}
              onChange={(e) => setSuspensionForm((p) => ({ ...p, fechaFin: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Motivo</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-50"
              rows={3}
              placeholder="Motivo de la suspensión..."
              value={suspensionForm.motivo}
              onChange={(e) => setSuspensionForm((p) => ({ ...p, motivo: e.target.value }))}
            />
          </div>
        </div>
      </ActionModal>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">Gestión de Comunidad</h2>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setTab('miembros')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === 'miembros' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Miembros
            </button>
            <button
              onClick={() => setTab('historial')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === 'historial' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Historial
            </button>
          </div>
        </div>
        {tab === 'miembros' && (
          <div className="flex gap-2 items-center">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por ID o nombre..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-48 rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-50"
              />
            </div>
            {[
              { id: 'todos', label: 'Ver Todos' },
              { id: 'suspendidos', label: 'Suspendidos' },
              { id: 'riesgo', label: 'En Riesgo' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  filter === id
                    ? 'bg-primary text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'historial' && <SuspensionHistory />}

      {tab === 'miembros' && (filteredData.length === 0 ? (
        <EmptyState
          icon={IconUsers}
          title="No se encontraron miembros"
          message="No hay usuarios que coincidan con el filtro seleccionado."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="cursor-pointer px-4 py-3 font-semibold text-slate-500"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <IconChevronUp className="h-3 w-3" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <IconChevronDown className="h-3 w-3" />
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-slate-50 transition hover:bg-primary-50/30"
                  onClick={() => openDrawer(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-xs text-slate-400">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <AnimatePresence>
        {drawerOpen && selectedUser && (
          <motion.div
            key="drawer-backdrop"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
          />
        )}
        {drawerOpen && selectedUser && (
          <motion.aside
            key="drawer-panel"
            className="fixed right-0 top-0 z-50 h-full w-[450px] overflow-y-auto border-l border-slate-200 bg-white shadow-elevated"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary-50 p-3">
                    <IconUserCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {selectedUser.usuarioNombre || selectedUser.usuarioId}
                    </h3>
                    <p className="text-sm text-slate-500">ID: {selectedUser.usuarioId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Historial de Reservas
                  </h4>
                  <p className="mt-2 text-sm text-slate-400">Últimas 10 reservas</p>
                  {(selectedUser.reservasRecientes || []).length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {selectedUser.reservasRecientes.slice(0, 10).map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                          <span className="text-slate-600">{r.franja || '—'}</span>
                          <span className={`font-medium ${
                            r.estado === 'completada' ? 'text-success-600' :
                            r.estado === 'no_show' ? 'text-danger-600' : 'text-slate-500'
                          }`}>
                            {r.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">Sin historial disponible</p>
                  )}
                </div>

                {selectedUser.activa && (
                  <button
                    onClick={openLevantarModal}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    <IconShieldAlert className="h-4 w-4" />
                    Levantar Suspensión Manual
                  </button>
                )}

                {!selectedUser.activa && (
                  <button
                    onClick={openSuspensionModal}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-danger-500 py-3 text-sm font-semibold text-white transition hover:bg-danger-600"
                  >
                    <IconAlertTriangle className="h-4 w-4" />
                    Crear Suspensión Manual
                  </button>
                )}
              </div>
            </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
