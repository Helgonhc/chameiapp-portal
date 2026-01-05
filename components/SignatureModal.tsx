'use client'

import { useRef, useState, useEffect } from 'react'
import { X, RotateCcw, Check } from 'lucide-react'

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (signatureData: string, signerName: string, signerDoc: string) => void
  defaultName?: string
  defaultDoc?: string
}

export default function SignatureModal({ 
  isOpen, 
  onClose, 
  onSave,
  defaultName = '',
  defaultDoc = ''
}: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [signerName, setSignerName] = useState(defaultName)
  const [signerDoc, setSignerDoc] = useState(defaultDoc)

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Configurar canvas
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        // Limpar canvas
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [isOpen])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    setHasDrawn(true)

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleSave = () => {
    if (!hasDrawn) {
      alert('Por favor, assine antes de continuar')
      return
    }

    if (!signerName.trim()) {
      alert('Por favor, informe seu nome')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    // Converter canvas para base64
    const signatureData = canvas.toDataURL('image/png')
    
    onSave(signatureData, signerName.trim(), signerDoc.trim())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Assinatura Digital</h2>
            <p className="text-blue-100 text-sm mt-1">Assine abaixo para confirmar o documento</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações do Assinante */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CPF/RG (Opcional)
              </label>
              <input
                type="text"
                value={signerDoc}
                onChange={(e) => setSignerDoc(e.target.value)}
                placeholder="Digite seu CPF ou RG"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                maxLength={20}
              />
            </div>
          </div>

          {/* Canvas de Assinatura */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Assinatura *
              </label>
              <button
                onClick={clearSignature}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Limpar
              </button>
            </div>
            
            <div className="border-4 border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full cursor-crosshair touch-none"
                style={{ touchAction: 'none' }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              ✍️ Desenhe sua assinatura acima usando o mouse ou toque
            </p>
          </div>

          {/* Aviso Legal */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              <strong>📋 Declaração:</strong> Ao assinar este documento, você confirma que as informações 
              são verdadeiras e concorda com os termos do serviço prestado.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasDrawn || !signerName.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-5 h-5" />
              Confirmar Assinatura
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
