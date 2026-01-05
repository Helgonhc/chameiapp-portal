'use client'

import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { X, Camera, AlertCircle, Wrench, FilePlus, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface ScannerModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ScannerModal({ isOpen, onClose }: ScannerModalProps) {
    const router = useRouter()
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [equipment, setEquipment] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null

        if (isOpen && !scanResult) {
            scanner = new Html5QrcodeScanner(
                'reader',
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                /* verbose= */ false
            )

            scanner.render(onScanSuccess, onScanError)
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(err => console.error('Failed to clear scanner', err))
            }
        }
    }, [isOpen, scanResult])

    async function onScanSuccess(decodedText: string) {
        console.log('Code scanned:', decodedText)
        setScanResult(decodedText)

        // Check if it's a valid equipment code (e.g., EQ-XXXXXXXX)
        if (decodedText.startsWith('EQ-')) {
            await loadEquipment(decodedText)
        } else {
            setError('Código QR não reconhecido como um equipamento válido.')
        }
    }

    function onScanError(err: any) {
        // This is called for every frame without a scan, so we don't log it
    }

    async function loadEquipment(qrCode: string) {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from('equipments')
                .select('*')
                .eq('qr_code', qrCode)
                .single()

            if (error) throw error
            if (data) {
                setEquipment(data)
            } else {
                setError('Equipamento não encontrado no sistema.')
            }
        } catch (err: any) {
            console.error('Error loading scanned equipment:', err)
            setError('Erro ao carregar dados do equipamento.')
        } finally {
            setLoading(false)
        }
    }

    function resetScanner() {
        setScanResult(null)
        setEquipment(null)
        setError(null)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-sm bg-[#0f1115] border border-white/10 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/5">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
                    <button
                        onClick={onClose}
                        className="p-2 ml-auto bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full text-white transition-all border border-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-1">
                    {!scanResult ? (
                        <div className="relative">
                            <div
                                id="reader"
                                className="overflow-hidden rounded-2xl bg-black"
                                style={{ minHeight: '350px' }}
                            ></div>
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent text-center">
                                <p className="text-white font-medium mb-1">Escanear Equipamento</p>
                                <p className="text-xs text-zinc-400">
                                    Aponte a câmera para o QR Code
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 pt-12 animate-fade-in-up">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                                    <p className="text-zinc-400">Consultando equipamento...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-red-500/5">
                                        <AlertCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-white font-bold mb-2 text-lg">Código Inválido</h3>
                                    <p className="text-zinc-400 text-sm mb-6 max-w-[200px] mx-auto">{error}</p>
                                    <button
                                        onClick={resetScanner}
                                        className="w-full py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 text-white transition-all"
                                    >
                                        Tentar Novamente
                                    </button>
                                </div>
                            ) : equipment ? (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20 ring-4 ring-black">
                                            <Wrench className="w-10 h-10 text-white" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white mb-1">{equipment.model}</h2>
                                        <p className="text-sm text-zinc-400">{equipment.brand} • {equipment.serial_number}</p>

                                        <div className="flex justify-center mt-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${equipment.status === 'operacional'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {equipment.status === 'operacional' ? '● Operacional' : '● ' + equipment.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                router.push(`/equipments/${equipment.id}`)
                                                onClose()
                                            }}
                                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                                        >
                                            <Wrench className="w-6 h-6 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold text-white">Ver Detalhes</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                router.push(`/tickets?equipment_id=${equipment.id}`)
                                                onClose()
                                            }}
                                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-all group"
                                        >
                                            <FilePlus className="w-6 h-6 text-indigo-300 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold text-white">Abrir Chamado</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={resetScanner}
                                        className="w-full py-4 text-zinc-500 text-sm font-medium hover:text-white transition-colors border-t border-white/5"
                                    >
                                        Escanear outro código
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
