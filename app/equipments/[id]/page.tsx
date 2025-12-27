'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    Wrench, Calendar, AlertTriangle, CheckCircle, Search, Filter, Server, Smartphone, Monitor,
    ArrowLeft, FileText, Download, Clock, MapPin, Tag, Shield
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Equipment {
    id: string
    name: string
    model: string
    serial_number: string
    qr_code: string | null
    status: string
    alert_status: string
    next_maintenance_date: string | null
    warranty_expiry_date: string | null
    type: string
    brand: string
    location: string
    purchase_date: string | null
    supplier: string | null
}

interface MaintenanceRecord {
    id: string
    title: string
    description: string
    maintenance_type: string
    completed_date: string
    technician: { full_name: string } | null
    status: string
}

interface Document {
    id: string
    title: string
    document_type: string
    file_url: string
    created_at: string
}

export default function EquipmentDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [equipment, setEquipment] = useState<Equipment | null>(null)
    const [history, setHistory] = useState<MaintenanceRecord[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'documents'>('details')

    useEffect(() => {
        if (params.id) loadData()
    }, [params.id])

    async function loadData() {
        try {
            // Load Equipment
            const { data: equip, error: equipError } = await supabase
                .from('equipments')
                .select('*')
                .eq('id', params.id)
                .single()

            if (equipError) throw equipError
            setEquipment(equip)

            // Load History
            const { data: hist, error: histError } = await supabase
                .from('equipment_maintenance_history')
                .select('*, technician:technician_id(full_name)')
                .eq('equipment_id', params.id)
                .order('completed_date', { ascending: false })

            if (!histError) setHistory(hist || [])

            // Load Documents
            const { data: docs, error: docsError } = await supabase
                .from('equipment_documents')
                .select('*')
                .eq('equipment_id', params.id)
                .order('created_at', { ascending: false })

            if (!docsError) setDocuments(docs || [])

        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    function getStatusBadge(status: string) {
        const s = status?.toLowerCase() || ''
        if (s === 'ativo' || s === 'running' || s === 'ok') return <span className="badgeBadge bg-success-500/20 text-success-400 border-success-500/30">Operacional</span>
        return <span className="badgeBadge bg-zinc-500/20 text-zinc-400 border-zinc-500/30">{status}</span>
    }

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div></DashboardLayout>
    if (!equipment) return null

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-background pb-10">
                {/* Header */}
                <div className="page-header">
                    <div className="max-w-7xl mx-auto">
                        <button onClick={() => router.push('/equipments')} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
                            <ArrowLeft className="w-5 h-5" /> <span>Voltar para Equipamentos</span>
                        </button>
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <div className="w-20 h-20 bg-surface-light rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                                <Server className="w-10 h-10 text-accent-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{equipment.name}</h1>
                                <div className="flex flex-wrap gap-3">
                                    {getStatusBadge(equipment.status)}
                                    <span className="badge badge-neutral font-mono">{equipment.serial_number}</span>
                                    <span className="badge badge-neutral">{equipment.brand} {equipment.model}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                    <div className="flex gap-2 bg-surface rounded-xl p-1 mb-6 border border-white/5 w-fit">
                        {['details', 'history', 'documents'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}
                            >
                                {tab === 'details' ? 'Detalhes' : tab === 'history' ? 'Histórico' : 'Documentos'}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Dynamic Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {activeTab === 'details' && (
                                <div className="card p-6 space-y-6 bg-surface border border-white/10">
                                    <h3 className="text-lg font-bold text-white mb-4">Informações Técnicas</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div><label className="text-xs text-zinc-500 uppercase tracking-wider">Tipo</label><p className="text-white font-medium">{equipment.type}</p></div>
                                        <div><label className="text-xs text-zinc-500 uppercase tracking-wider">Marca</label><p className="text-white font-medium">{equipment.brand}</p></div>
                                        <div><label className="text-xs text-zinc-500 uppercase tracking-wider">Modelo</label><p className="text-white font-medium">{equipment.model}</p></div>
                                        <div><label className="text-xs text-zinc-500 uppercase tracking-wider">Serial</label><p className="text-white font-mono">{equipment.serial_number}</p></div>
                                        <div><label className="text-xs text-zinc-500 uppercase tracking-wider">Localização</label><p className="text-white font-medium">{equipment.location}</p></div>
                                        <div><label className="text-xs text-zinc-500 uppercase tracking-wider">QR Code</label><p className="text-white font-mono">{equipment.qr_code}</p></div>
                                    </div>

                                    <div className="border-t border-white/10 pt-6 mt-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Garantia & Compra</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div><label className="text-xs text-zinc-500 uppercase tracking-wider">Data de Compra</label><p className="text-white font-medium">{equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : '-'}</p></div>
                                            <div><label className="text-xs text-zinc-500 uppercase tracking-wider">Fornecedor</label><p className="text-white font-medium">{equipment.supplier || '-'}</p></div>
                                            <div><label className="text-xs text-zinc-500 uppercase tracking-wider">Garantia até</label><p className={`font-medium ${new Date(equipment.warranty_expiry_date || '') < new Date() ? 'text-danger-400' : 'text-success-400'}`}>{equipment.warranty_expiry_date ? new Date(equipment.warranty_expiry_date).toLocaleDateString() : '-'}</p></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    {history.length === 0 ? <div className="text-center text-zinc-500 py-10">Nenhum histórico encontrado.</div> : (
                                        history.map(rec => (
                                            <div key={rec.id} className="card p-4 border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-xs font-bold text-accent-400 uppercase mb-1 block">{rec.maintenance_type}</span>
                                                        <h4 className="font-bold text-white">{rec.title}</h4>
                                                    </div>
                                                    <span className="text-sm text-zinc-400">{new Date(rec.completed_date).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-zinc-400 mb-3">{rec.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-zinc-500 bg-surface-light p-2 rounded-lg w-fit">
                                                    <Wrench className="w-3 h-3" /> Técnico: {rec.technician?.full_name || 'N/A'}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {documents.length === 0 ? <div className="col-span-full text-center text-zinc-500 py-10">Nenhum documento anexado.</div> : (
                                        documents.map(doc => (
                                            <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="card p-4 border border-white/5 hover:border-accent-500/50 transition-all flex items-center gap-3 group">
                                                <div className="w-10 h-10 bg-surface-light rounded-lg flex items-center justify-center group-hover:bg-accent-500/20 transition-colors">
                                                    <FileText className="w-5 h-5 text-zinc-400 group-hover:text-accent-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-white group-hover:text-accent-400 transition-colors">{doc.title}</h4>
                                                    <p className="text-xs text-zinc-500 capitalize">{doc.document_type}</p>
                                                </div>
                                                <Download className="w-4 h-4 text-zinc-600 ml-auto group-hover:text-white" />
                                            </a>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Column - Status Card */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="card p-6 bg-surface border border-white/10">
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Status de Manutenção</h3>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${equipment.alert_status === 'ok' ? 'bg-success-500' : 'bg-danger-500'}`}></div>
                                        <div>
                                            <p className="text-white font-medium">Próxima Preventiva</p>
                                            <p className="text-2xl font-bold text-white mt-1">{equipment.next_maintenance_date ? new Date(equipment.next_maintenance_date).toLocaleDateString() : 'Não agendada'}</p>
                                            {equipment.next_maintenance_date && new Date(equipment.next_maintenance_date) < new Date() && (
                                                <span className="text-xs text-danger-400 font-bold mt-1 block">⚠️ Atrasado</span>
                                            )}
                                        </div>
                                    </div>

                                    <button className="w-full btn-primary py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20">
                                        Solicitar Manutenção
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    )
}
