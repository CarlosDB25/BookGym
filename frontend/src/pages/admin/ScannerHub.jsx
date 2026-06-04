import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'
import { Html5QrcodeSupportedFormats } from 'html5-qrcode'
import api from '../../config/axios'
import { ActionModal } from '../../components/ui/ActionModal'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { IconScan, IconUser, IconUserX, IconAlertTriangle, IconShieldAlert, IconCheckCircle, IconXCircle, IconCamera, IconKeyboard, IconBarcodeScanner, IconCameraOff } from '../../components/shared/Icons'

const SCENARIO = {
  IDLE: 'idle',
  VALID: 'valid',
  SUSPENDED: 'suspended',
  NO_RESERVATION: 'no_reservation',
}

const SCAN_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.AZTEC,
]

export function ScannerHub({ onNotice }) {
  const scannerContainerRef = useRef(null)
  const inputRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [cedula, setCedula] = useState('')
  const [loading, setLoading] = useState(false)
  const [studentData, setStudentData] = useState(null)
  const [scenario, setScenario] = useState(SCENARIO.IDLE)
  const [modalOpen, setModalOpen] = useState(false)
  const [flashGreen, setFlashGreen] = useState(false)
  const [scanMode, setScanMode] = useState('camera')
  const [lastScan, setLastScan] = useState(null)

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
      onNotice?.('success', `Asistencia registrada para ${studentName}`)
      setScenario(SCENARIO.IDLE)
      setStudentData(null)
      setCedula('')
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'Error en check-in')
    }
  }

  function handleInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      buscarEstudiante(cedula.trim())
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (scanMode !== 'camera') return
    const containerEl = scannerContainerRef.current
    if (!containerEl) return

    let mounted = true
    let instance = null
    const scannerDiv = document.createElement('div')
    scannerDiv.id = 'scanner-view-' + Date.now()
    scannerDiv.style.width = '100%'
    scannerDiv.style.height = '100%'
    containerEl.appendChild(scannerDiv)

    async function startScanner() {
      try {
        instance = new Html5Qrcode(scannerDiv.id, {
          verbose: false,
          formatsToSupport: SCAN_FORMATS,
        })
        await instance.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
              const qrboxSize = Math.floor(minEdge * 0.7)
              return { width: qrboxSize, height: Math.floor(qrboxSize * 0.6) }
            },
            aspectRatio: 1.333,
            disableFlip: false,
          },
          (decodedText) => {
            const text = (decodedText || '').trim()
            const now = Date.now()
            if (lastScan && text === lastScan.text && now - lastScan.ts < 2000) return
            setLastScan({ text, ts: now })
            setFlashGreen(true)
            setTimeout(() => setFlashGreen(false), 600)
            if (inputRef.current) inputRef.current.value = text
            buscarEstudiante(text)
          },
          () => {}
        )
        if (mounted) setScanning(true)
        else await instance.stop().catch(() => {})
      } catch (err) {
        if (mounted) {
          setScanning(false)
          setCameraError(err?.message || 'No se pudo iniciar la cámara')
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      ;(async () => {
        try {
          if (instance) {
            await instance.stop().catch(() => {})
            await instance.clear().catch(() => {})
          }
        } catch {}
        try {
          if (scannerDiv.parentNode === containerEl) containerEl.removeChild(scannerDiv)
        } catch {}
      })()
    }
  }, [scanMode])

  return (
    <div className="grid h-[calc(100vh-70px)] grid-cols-12 gap-6 overflow-hidden p-6">
      <div className="col-span-5 flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setScanMode('camera')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
              scanMode === 'camera'
                ? 'bg-primary text-white'
                : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            <IconCamera className="h-4 w-4" />
            Cámara
          </button>
          <button
            onClick={() => setScanMode('manual')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
              scanMode === 'manual'
                ? 'bg-primary text-white'
                : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            <IconKeyboard className="h-4 w-4" />
            Manual
          </button>
        </div>

        {scanMode === 'camera' ? (
          <>
            <div
              ref={scannerContainerRef}
              className={`relative aspect-video overflow-hidden rounded-2xl bg-slate-900 ${
                flashGreen ? 'ring-4 ring-success-400' : ''
              }`}
            >
              {!scanning && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                  <IconCameraOff className="h-10 w-10" />
                  <p className="text-sm font-medium">
                    {cameraError || 'Iniciando cámara…'}
                  </p>
                  {cameraError && (
                    <button
                      onClick={() => setScanMode('manual')}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Usar ingreso manual
                    </button>
                  )}
                </div>
              )}
              {scanning && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-0.5 w-3/4 animate-scan rounded-full bg-danger-400 opacity-70 shadow-lg shadow-danger-400/50" />
                </div>
              )}
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
              <IconBarcodeScanner className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Acerca el código QR o código de barras del carnet a la cámara. Se
                aceptan QR, Code 128, Code 39, EAN y PDF417.
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex h-32 items-center justify-center rounded-xl bg-slate-50">
              <IconKeyboard className="h-12 w-12 text-slate-300" />
            </div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
              <IconBarcodeScanner className="h-4 w-4" />
              Cédula del Estudiante / Código
            </label>
            <input
              ref={inputRef}
              type="text"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-lg transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-50"
              placeholder="Escanea o digita el código..."
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              onKeyDown={handleInputKeyDown}
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-400">
              Presiona <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">Enter</kbd> para buscar
            </p>
          </div>
        )}
      </div>

      <div className="col-span-7 flex flex-col">
        {scenario === SCENARIO.IDLE && !loading && (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <IconScan className="mb-3 h-16 w-16 text-slate-200" />
            <h3 className="text-lg font-semibold text-slate-400">Esperando lectura</h3>
            <p className="text-sm text-slate-300">
              Apunta la cámara al código o digita la cédula
            </p>
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
