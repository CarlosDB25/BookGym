import { IconInbox } from '../shared/Icons'

export function EmptyState({ icon: Icon = IconInbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <Icon className="mb-3 h-10 w-10 text-slate-300" />
      {title && <h3 className="text-base font-semibold text-slate-700">{title}</h3>}
      {message && <p className="mt-1 text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
