import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { useAdminSuspensiones, useLevantarSuspension } from '../../hooks/useAdmin'
import { ActionModal } from '../../components/ui/ActionModal'
import { CardSkeleton } from '../../components/ui/SkeletonLoader'
import { EmptyState } from '../../components/ui/EmptyState'
import { IconUsers, IconShieldAlert, IconAlertTriangle, IconChevronUp, IconChevronDown, IconChevronLeft, IconChevronRight, IconX, IconUserCheck, IconFileText } from '../../components/shared/Icons'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_BADGE = {
  suspendido: 'bg-danger-50 text-danger-700 border-danger-200',
  riesgo: 'bg-warning-50 text-warning-700 border-warning-200',
  activo: 'bg-success-50 text-success-700 border-success-200',
}

export function AdminUsuarios({ onNotice }) {
  const [filter, setFilter] = useState('todos')
  const [selectedUser, setSelectedUser] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modal, setModal] = useState({ open: false })
  const [justificacion, setJustificacion] = useState('')

  const { data: suspensiones = [], isLoading } = useAdminSuspensiones()
  const levantar = useLevantarSuspension()

  const filteredData = useMemo(() => {
    if (filter === 'suspendidos') return suspensiones.filter((s) => s.activa)
    if (filter === 'riesgo') return suspensiones.filter((s) => !s.activa && s.noshowCount >= 2)
    return suspensiones
  }, [suspensiones, filter])

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

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestión de Comunidad</h2>
          <p className="text-sm text-slate-500">{suspensiones.length} miembros</p>
        </div>
        <div className="flex gap-2">
          {[
            { id: 'todos', label: 'Ver Todos' },
            { id: 'suspendidos', label: 'Solo Suspendidos' },
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
      </div>

      {filteredData.length === 0 ? (
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
      )}

      <AnimatePresence>
        {drawerOpen && selectedUser && (
          <motion.div
            key="drawer-backdrop"
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
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
              </div>
            </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
