'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import {
    Wrench, Calendar, AlertTriangle, CheckCircle, Search, Filter, Server, Smartphone, Monitor,
    ArrowLeft, FileText, Download, Clock, MapPin, Tag, Shield, X, CalendarPlus, Send
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

interface MaintenanceType {
    id: string
    name: string
    color: string
    description?: string
}

interface ServiceOrder {
    id: string
    title: string
    status: string
    created_at: string
    completed_at: string | null
}

export default function EquipmentDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const { profile, user: storeUser } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [equipment, setEquipment] = useState<Equipment | null>(null)
    const [history, setHistory] = useState<MaintenanceRecord[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([])
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'documents'>('details')

    // Request State
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [clientId, setClientId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [requestForm, setRequestForm] = useState({
        title: '',
        description: '',
        maintenance_type_id: '',
        suggested_date: '',
        suggested_time_period: 'manha'
    })

    useEffect(() => {
        if (params.id && profile?.client_id && storeUser?.id) {
            setUserId(storeUser.id)
            setClientId(profile.client_id)
            loadData()
        } else if (!loading && !profile) {
            setLoading(false)
        }
    }, [params.id, profile, storeUser])

    async function loadData() {
        if (!params.id) return
        try {
            setLoading(true)

            // Load Equipment with its client_id
            const { data: equip, error: equipError } = await supabase
                .from('equipments')
                .select('*')
                .eq('id', params.id)
                .single()

            if (equipError) throw equipError
            setEquipment(equip)

            // Load History, Documents, Service Orders and Maintenance Types in parallel
            const [histRes, docsRes, ordersRes, typesRes] = await Promise.all([
                supabase
                    .from('equipment_maintenance_history')
                    .select('*, technician:technician_id(full_name)')
                    .eq('equipment_id', params.id)
                    .order('completed_date', { ascending: false }),
                supabase
                    .from('equipment_documents')
                    .select('*')
                    .eq('equipment_id', params.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('service_orders')
                    .select('id, title, status, created_at, completed_at')
                    .eq('equipment_id', params.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('maintenance_types')
                    .select('id, name, color, description')
                    .eq('is_active', true)
                    .order('name')
            ])

            if (!histRes.error) setHistory(histRes.data || [])
            if (!docsRes.error) setDocuments(docsRes.data || [])
            if (!ordersRes.error) setServiceOrders(ordersRes.data || [])
            if (!typesRes.error) setMaintenanceTypes(typesRes.data || [])

        } catch (error) {
            console.error('Erro ao carregar dados:', error)
            alert('Erro ao carregar dados do equipamento')
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmitRequest(e: React.FormEvent) {
        e.preventDefault()
        if (!clientId || !userId || !equipment) {
            alert('Sessão expirada. Por favor, faça login novamente.')
            return
        }

        setSubmitting(true)
        try {
            const { error } = await supabase
                .from('maintenance_requests')
                .insert({
                    client_id: clientId,
                    requested_by: userId,
                    equipment_id: equipment.id,
                    title: requestForm.title,
                    description: requestForm.description,
                    maintenance_type_id: requestForm.maintenance_type_id || null,
                    suggested_date: requestForm.suggested_date,
                    suggested_time_period: requestForm.suggested_time_period,
                    status: 'pendente'
                })

            if (error) throw error

            alert('Solicitação enviada com sucesso!')
            setShowRequestModal(false)
            setRequestForm({ title: '', description: '', maintenance_type_id: '', suggested_date: '', suggested_time_period: 'manha' })
        } catch (error: any) {
            console.error('Erro ao enviar solicitação:', error)
            alert('Erro ao enviar solicitação: ' + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    function getStatusBadge(status: string) {
        const s = status?.toLowerCase() || ''
        if (s === 'ativo' || s === 'active' || s === 'running' || s === 'ok') {
            return <span className="badgeBadge bg-success-500/20 text-success-400 border-success-500/30">Ativo</span>
        }
        if (s === 'maintenance' || s === 'manutenção') {
            return <span className="badgeBadge bg-amber-500/20 text-amber-400 border-amber-500/30">Em Manutenção</span>
        }
        if (s === 'inactive' || s === 'inativo') {
            return <span className="badgeBadge bg-danger-500/20 text-danger-400 border-danger-500/30">Inativo</span>
        }
        return <span className="badgeBadge bg-zinc-500/20 text-zinc-400 border-zinc-500/30">{status}</span>
    }

    const getSOStatusColor = (status: string) => {
        switch (status) {
            case 'concluido': return 'bg-success-500/20 text-success-400 border-success-500/30';
            case 'em_andamento': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'pendente': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
            default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
        }
    };

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
                                <div className="space-y-6">
                                    {/* Service Orders */}
                                    {serviceOrders.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Ordens de Serviço</h3>
                                            {serviceOrders.map(order => (
                                                <div key={order.id} className="card p-4 border border-white/5 hover:border-white/10 transition-colors bg-surface-light/30">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-white">{order.title}</h4>
                                                            <p className="text-xs text-zinc-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getSOStatusColor(order.status)} uppercase font-bold`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Maintenance Records */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Histórico de Manutenção</h3>
                                        {history.length === 0 ? <div className="text-center text-zinc-500 py-10 bg-surface rounded-xl border border-white/5">Nenhum histórico encontrado.</div> : (
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

                                    <button
                                        onClick={() => setShowRequestModal(true)}
                                        className="w-full btn-primary py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20"
                                    >
                                        Solicitar Manutenção
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Request Maintenance Modal */}
                {showRequestModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowRequestModal(false)}>
                        <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto bg-surface border border-white/10 shadow-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6 p-6 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center border border-accent-500/20">
                                        <CalendarPlus className="w-6 h-6 text-accent-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Solicitar Manutenção</h2>
                                        <p className="text-sm text-zinc-400">Para: {equipment.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-zinc-400 hover:text-white" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitRequest} className="p-6 space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Título da Solicitação *</label>
                                    <input
                                        type="text"
                                        value={requestForm.title}
                                        onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                                        placeholder="Ex: Ruído estranho, Vazamento, etc."
                                        className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-500/50 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Tipo (Opcional)</label>
                                    <select
                                        value={requestForm.maintenance_type_id}
                                        onChange={(e) => setRequestForm({ ...requestForm, maintenance_type_id: e.target.value })}
                                        className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-500/50 outline-none transition-all appearance-none"
                                    >
                                        <option value="">Selecione um tipo...</option>
                                        {maintenanceTypes.map((type) => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Descrição Detalhada</label>
                                    <textarea
                                        value={requestForm.description}
                                        onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                                        placeholder="Descreva o que está acontecendo..."
                                        className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-500/50 outline-none transition-all min-h-[100px] resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Data Sugerida *</label>
                                        <input
                                            type="date"
                                            value={requestForm.suggested_date}
                                            onChange={(e) => setRequestForm({ ...requestForm, suggested_date: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-500/50 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Período Preferido</label>
                                        <select
                                            value={requestForm.suggested_time_period}
                                            onChange={(e) => setRequestForm({ ...requestForm, suggested_time_period: e.target.value })}
                                            className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-500/50 outline-none transition-all appearance-none"
                                        >
                                            <option value="manha">Manhã</option>
                                            <option value="tarde">Tarde</option>
                                            <option value="qualquer">Qualquer Horário</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowRequestModal(false)}
                                        className="flex-1 py-4 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[2] btn-primary py-4 rounded-xl font-bold shadow-lg shadow-accent-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Enviar Solicitação</span>
                                                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
