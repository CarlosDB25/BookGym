import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/shared/Logo'
import { IconArrowRight } from '../components/shared/Icons'

export function TerminosCondiciones() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-surface px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="text-xl font-bold text-slate-900">
            Book<span className="font-light">Gym</span>
          </span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
        >
          Volver
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">
          Términos y Condiciones de Uso
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Sistema de Gestión y Optimización de Capacidad para un Gimnasio Universitario
        </p>

        <div className="space-y-6 text-sm text-slate-700">
          <section>
            <h2 className="mb-2 font-semibold text-slate-900">1. Aceptación</h2>
            <p>El acceso y uso del Sistema implica la aceptación de los presentes Términos y Condiciones.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">2. Usuarios Autorizados</h2>
            <p>Solo podrán utilizar el Sistema los usuarios que posean credenciales institucionales válidas y autorización para acceder al gimnasio universitario.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">3. Uso del Sistema</h2>
            <p>Los usuarios podrán:</p>
            <ul className="mt-1 list-inside list-disc space-y-1 pl-4">
              <li>Consultar disponibilidad de franjas horarias.</li>
              <li>Realizar reservas.</li>
              <li>Cancelar reservas dentro de los plazos permitidos.</li>
              <li>Registrar asistencia.</li>
              <li>Consultar el historial de uso y estado de su cuenta.</li>
            </ul>
            <p className="mt-2">Los administradores contarán además con permisos para gestionar horarios, métricas y restricciones.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">4. Reglas de Reserva</h2>
            <ol className="list-inside list-decimal space-y-1 pl-4">
              <li>Toda reserva está sujeta a la disponibilidad de cupos.</li>
              <li>El usuario no podrá exceder el número máximo de reservas activas definido por la administración.</li>
              <li>El Sistema podrá sugerir horarios alternativos con menor nivel de saturación.</li>
              <li>Una reserva solo será válida mientras mantenga el estado activo dentro del Sistema.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">5. Cancelaciones</h2>
            <ol className="list-inside list-decimal space-y-1 pl-4">
              <li>Las reservas podrán cancelarse únicamente antes del inicio de la franja reservada.</li>
              <li>Las cancelaciones liberarán inmediatamente el cupo correspondiente.</li>
              <li>Una vez iniciada la franja horaria, la reserva no podrá ser cancelada.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">6. Asistencia e Inasistencia</h2>
            <ol className="list-inside list-decimal space-y-1 pl-4">
              <li>El usuario deberá registrar su asistencia dentro de la ventana de tiempo habilitada.</li>
              <li>La ausencia de registro de asistencia generará automáticamente una inasistencia (no-show).</li>
              <li>Las inasistencias serán registradas en el historial del usuario.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">7. Suspensiones y Restricciones</h2>
            <ol className="list-inside list-decimal space-y-1 pl-4">
              <li>El Sistema podrá aplicar suspensiones temporales cuando se supere el límite de inasistencias definido por la administración.</li>
              <li>Durante una suspensión activa el usuario no podrá realizar nuevas reservas.</li>
              <li>El usuario podrá consultar el motivo y duración de la suspensión desde su perfil.</li>
              <li>La administración podrá levantar una suspensión cuando lo considere justificado.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">8. Conducta del Usuario</h2>
            <p>Está prohibido:</p>
            <ul className="mt-1 list-inside list-disc space-y-1 pl-4">
              <li>Compartir credenciales institucionales.</li>
              <li>Intentar manipular la disponibilidad de cupos.</li>
              <li>Realizar reservas fraudulentas o masivas.</li>
              <li>Utilizar el Sistema para fines distintos a los establecidos.</li>
            </ul>
            <p className="mt-2">El incumplimiento podrá dar lugar a restricciones de acceso o medidas disciplinarias conforme a la normativa institucional.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">9. Disponibilidad del Servicio</h2>
            <p>La universidad realizará esfuerzos razonables para mantener la disponibilidad del Sistema. Sin embargo, podrán presentarse interrupciones por mantenimiento, actualizaciones o eventos técnicos imprevistos.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">10. Limitación de Responsabilidad</h2>
            <p>El Sistema constituye una herramienta de apoyo para la gestión del gimnasio universitario. La universidad no garantiza la disponibilidad permanente de cupos ni será responsable por inconvenientes derivados de fallas externas de conectividad o servicios tecnológicos de terceros.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">11. Modificaciones</h2>
            <p>La universidad podrá modificar estos Términos y Condiciones cuando resulte necesario para mejorar la operación del Sistema o cumplir obligaciones legales e institucionales.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">12. Legislación Aplicable</h2>
            <p>Los presentes Términos y Condiciones se regirán por la legislación colombiana vigente y por los reglamentos internos de la institución universitaria.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
