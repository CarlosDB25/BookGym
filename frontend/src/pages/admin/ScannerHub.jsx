import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../../config/axios'
import { ActionModal } from '../../components/ui/ActionModal'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { IconScan, IconUser, IconUserX, IconAlertTriangle, IconShieldAlert, IconCheckCircle, IconXCircle, IconCamera, IconKeyboard } from '../../components/shared/Icons'

const SCENARIO = {
  IDLE: 'idle',
  VALID: 'valid',
  SUSPENDED: 'suspended',
  NO_RESERVATION: 'no_reservation',
}

export function ScannerHub({ onNotice }) {
  const scannerRef = useRef(null)
  const scannerContainerRef = useRef(null)
  const inputRef = useRef(null)
  const [scanner, setScanner] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [cedula, setCedula] = useState('')
  const [loading, setLoading] = useState(false)
  const [studentData, setStudentData] = useState(null)
  const [scenario, setScenario] = useState(SCENARIO.IDLE)
  const [modalOpen, setModalOpen] = useState(false)
  const [flashGreen, setFlashGreen] = useState(false)

  const studentName = studentData?.usuario?.id || cedula

  async function buscarEstudiante(documento) {
    if (!documento || documento.length < 3) return
    setCedula(documento)
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/scanner/verificar/${encodeURIComponent(documento)}`)
      if (data.estado === 'SUSPENDIDO') {
        setStudentData(data)
        setScenario(SCENARIO.SUSPENDED)
      } else if (data.estado === 'RESERVA_ENCONTRADA') {
        setStudentData(data)
        setScenario(SCENARIO.VALID)
      } else {
        setStudentData(data)
        setScenario(SCENARIO.NO_RESERVATION)
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        onNotice?.('error', 'Estudiante no encontrado')
      }
      setScenario(SCENARIO.IDLE)
      setStudentData(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckin() {
    if (!studentData?.reserva?.id) return
    try {
      await api.post(`/admin/scanner/checkin/${studentData.reserva.id}`)
      onNotice?.('success', `Check-in registrado para ${studentName}`)
      setScenario(SCENARIO.IDLE)
      setStudentData(null)
      setCedula('')
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'Error en check-in')
    }
  }

  function handleInputChange(e) {
    const val = e.target.value
    setCedula(val)
    if (val.endsWith('\n') || val.endsWith('\r')) {
      buscarEstudiante(val.trim())
      e.target.value = ''
    }
  }

  function handleInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      buscarEstudiante(cedula)
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const containerEl = scannerContainerRef.current
    if (!containerEl || scannerRef.current) return

    let mounted = true
    let instance

    const scannerDiv = document.createElement('div')
    scannerDiv.id = 'scanner-view-' + Date.now()
    containerEl.appendChild(scannerDiv)

    async function startScanner() {
      try {
        instance = new Html5Qrcode(scannerDiv.id)
        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            setFlashGreen(true)
            setTimeout(() => setFlashGreen(false), 500)
            buscarEstudiante(decodedText)
            if (inputRef.current) inputRef.current.value = decodedText
          },
          () => {}
        )
        if (!mounted) {
          await instance.stop().catch(() => {})
          return
        }
        scannerRef.current = instance
        setScanner(instance)
        setScanning(true)
      } catch {
        if (mounted) setScanning(false)
      }
    }

    startScanner()

    return () => {
      mounted = false
      scannerRef.current = null
      ;(async () => {
        try {
          if (instance) {
            await instance.stop()
            await instance.clear()
          }
        } catch {}
        if (containerEl && scannerDiv.parentNode === containerEl) {
          containerEl.removeChild(scannerDiv)
        }
      })()
    }
  }, [])

  return (
    <div className="grid h-[calc(100vh-70px)] grid-cols-12 gap-6 overflow-hidden p-6">
      <div className="col-span-5 flex flex-col gap-4">
        <div
          ref={scannerContainerRef}
          className={`relative aspect-video overflow-hidden rounded-2xl bg-slate-900 ${
            flashGreen ? 'ring-4 ring-success-400' : ''
          }`}
        >
          {!scanning && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
              <IconCamera className="h-10 w-10" />
              <p className="text-sm">Cámara no disponible</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-1 w-3/4 animate-scan rounded-full bg-danger-400 opacity-70 shadow-lg shadow-danger-400/50" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
            <IconKeyboard className="h-4 w-4" />
            Cédula del Estudiante / Código de Barras
          </label>
          <input
            ref={inputRef}
            type="text"
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-lg transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-50"
            placeholder="Escanea o escribe el código..."
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            autoFocus
          />
          <p className="mt-1 text-xs text-slate-400">Escáner físico o ingreso manual + Enter</p>
        </div>
      </div>

      <div className="col-span-7 flex flex-col">
        {scenario === SCENARIO.IDLE && !loading && (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <IconScan className="mb-3 h-16 w-16 text-slate-200" />
            <h3 className="text-lg font-semibold text-slate-400">Esperando lectura de carnet</h3>
            <p className="text-sm text-slate-300">o ingreso de cédula</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-8">
            <SkeletonLoader className="h-6 w-1/2" />
            <SkeletonLoader className="h-12 w-full" />
            <SkeletonLoader className="h-24 w-full" />
          </div>
        )}

        {scenario === SCENARIO.VALID && studentData && (
          <motion.div
            className="flex flex-col gap-4 rounded-2xl border border-success-200 bg-white p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-success-50 p-3">
                <IconCheckCircle className="h-8 w-8 text-success-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{studentName}</h2>
                <p className="text-sm text-slate-500">Reserva válida encontrada</p>
              </div>
            </div>

            {studentData.reserva && (
              <div className="rounded-xl bg-success-50 p-4">
                <p className="text-sm font-medium text-success-800">
                  {studentData.reserva.franja?.horaInicio} - {studentData.reserva.franja?.horaFin}
                </p>
                <p className="text-xs text-success-700">
                  {studentData.reserva.franja?.diaSemana}
                </p>
              </div>
            )}

            <button
              onClick={handleCheckin}
              className="flex h-24 items-center justify-center gap-3 rounded-2xl bg-success-500 text-xl font-bold text-white transition hover:bg-success-600 active:scale-[0.98]"
            >
              <IconCheckCircle className="h-8 w-8" />
              REGISTRAR ASISTENCIA
            </button>
          </motion.div>
        )}

        {scenario === SCENARIO.SUSPENDED && studentData && (
          <motion.div
            className="flex flex-col gap-4 rounded-2xl border border-danger-200 bg-danger-50 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-danger-100 p-3">
                <IconShieldAlert className="h-8 w-8 text-danger-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-danger-800">{studentName}</h2>
                <p className="text-sm text-danger-600">Cuenta suspendida</p>
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 text-sm text-danger-700">
              {studentData.suspension?.motivo || 'Suspensión automática por acumulación de inasistencias'}
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-danger-100 px-4 py-3 text-sm font-medium text-danger-700">
              <IconXCircle className="h-5 w-5" />
              No es posible registrar check-in
            </div>
          </motion.div>
        )}

        {scenario === SCENARIO.NO_RESERVATION && (
          <motion.div
            className="flex flex-col gap-4 rounded-2xl border border-warning-200 bg-warning-50 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-warning-100 p-3">
                <IconAlertTriangle className="h-8 w-8 text-warning-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{studentName}</h2>
                <p className="text-sm text-warning-600">Sin reserva previa</p>
              </div>
            </div>
            <p className="text-sm text-warning-700">
              El estudiante no posee reservas agendadas para este bloque horario.
            </p>
            <button
              onClick={() => onNotice?.('info', 'Funcionalidad de sobrecupo en desarrollo')}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-warning-400 bg-white px-6 py-4 text-sm font-bold text-warning-700 transition hover:bg-warning-50"
            >
              <IconUser className="h-5 w-5" />
              Ingreso por Sobrecupo Administrativo
            </button>
          </motion.div>
        )}
      </div>

      <ActionModal
        open={modalOpen}
        type="info"
        title="Resultado del escaneo"
        lines={[`Documento: ${cedula}`]}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
