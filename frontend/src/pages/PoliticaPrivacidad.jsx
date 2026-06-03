import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/shared/Logo'
import { IconArrowRight } from '../components/shared/Icons'

export function PoliticaPrivacidad() {
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
          Política de Privacidad
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Sistema de Gestión y Optimización de Capacidad para un Gimnasio Universitario
        </p>

        <div className="space-y-6 text-sm text-slate-700">
          <section>
            <h2 className="mb-2 font-semibold text-slate-900">1. Introducción</h2>
            <p>El Sistema de Gestión y Optimización de Capacidad para un Gimnasio Universitario tiene como finalidad gestionar reservas, registrar asistencias, analizar patrones de uso y optimizar la ocupación de las instalaciones deportivas universitarias.</p>
            <p className="mt-2">La utilización del Sistema implica la aceptación de la presente Política de Privacidad.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">2. Responsable del Tratamiento</h2>
            <p>El Sistema opera como una herramienta de apoyo para la gestión del gimnasio universitario. La identificación y autenticación de los usuarios se realiza mediante los sistemas institucionales de la universidad.</p>
            <p className="mt-2">La universidad es responsable de la gestión de los datos personales primarios de los estudiantes y funcionarios.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">3. Información Tratada</h2>
            <p>El Sistema almacena únicamente información operativa necesaria para su funcionamiento, incluyendo:</p>
            <ul className="mt-1 list-inside list-disc space-y-1 pl-4">
              <li>Identificador institucional del usuario.</li>
              <li>Reservas realizadas.</li>
              <li>Cancelaciones efectuadas.</li>
              <li>Registros de asistencia (check-in).</li>
              <li>Registros de inasistencia (no-show).</li>
              <li>Suspensiones aplicadas.</li>
              <li>Historial de uso del gimnasio.</li>
              <li>Métricas agregadas de ocupación.</li>
            </ul>
            <p className="mt-2">El Sistema no almacena contraseñas institucionales ni replica información académica, financiera o sensible administrada por la universidad.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">4. Finalidad del Tratamiento</h2>
            <p>La información recopilada será utilizada exclusivamente para:</p>
            <ul className="mt-1 list-inside list-disc space-y-1 pl-4">
              <li>Gestionar reservas de franjas horarias.</li>
              <li>Controlar la capacidad del gimnasio.</li>
              <li>Registrar asistencia e inasistencia.</li>
              <li>Aplicar reglas operativas y restricciones de uso.</li>
              <li>Generar métricas e indicadores de ocupación.</li>
              <li>Optimizar la distribución de la demanda.</li>
              <li>Garantizar la seguridad y trazabilidad de las operaciones realizadas en el Sistema.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">5. Conservación de la Información</h2>
            <p>Los registros operativos serán conservados únicamente durante el tiempo necesario para cumplir los fines descritos en esta política o mientras la universidad requiera la información para fines administrativos, estadísticos o de auditoría.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">6. Seguridad de la Información</h2>
            <p>El Sistema implementará medidas razonables de seguridad para proteger la información almacenada, incluyendo:</p>
            <ul className="mt-1 list-inside list-disc space-y-1 pl-4">
              <li>Comunicación cifrada mediante HTTPS.</li>
              <li>Control de acceso basado en roles.</li>
              <li>Gestión segura de sesiones.</li>
              <li>Registro de eventos relevantes para auditoría.</li>
              <li>Respaldo periódico de la información.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">7. Derechos de los Usuarios</h2>
            <p>Los usuarios podrán:</p>
            <ul className="mt-1 list-inside list-disc space-y-1 pl-4">
              <li>Consultar la información operativa asociada a su cuenta.</li>
              <li>Solicitar correcciones cuando exista información inexacta.</li>
              <li>Conocer las suspensiones y restricciones aplicadas.</li>
              <li>Solicitar información sobre el tratamiento realizado por el Sistema.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">8. Modificaciones</h2>
            <p>La universidad podrá actualizar esta Política de Privacidad cuando sea necesario para cumplir requisitos legales, técnicos u operativos. Las modificaciones serán informadas a través de los canales institucionales correspondientes.</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">9. Normatividad Aplicable</h2>
            <p>El tratamiento de la información se realizará conforme a los principios establecidos en la Ley 1581 de 2012 y demás normas colombianas aplicables en materia de protección de datos personales.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
