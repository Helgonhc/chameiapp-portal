'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Wrench, Calendar, AlertTriangle, CheckCircle, Search, Filter, Server, Smartphone, Monitor } from 'lucide-react'
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
}

export default function EquipmentsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [equipments, setEquipments] = useState<Equipment[]>([])
    const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => {
        loadEquipments()
    }, [])

    useEffect(() => {
        filterEquipments()
    }, [searchTerm, statusFilter, equipments])

    async function loadEquipments() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('client_id')
                .eq('id', user.id)
                .maybeSingle()

            if (!profile?.client_id) return

            const { data, error } = await supabase
                .from('equipments')
                .select('*')
                .eq('client_id', profile.client_id)
                .order('name')

            if (error) throw error
            setEquipments(data || [])
            setFilteredEquipments(data || [])
        } catch (error) {
            console.error('Erro ao carregar equipamentos:', error)
        } finally {
            setLoading(false)
        }
    }

    function filterEquipments() {
        let filtered = [...equipments]

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(e =>
                e.name.toLowerCase().includes(term) ||
                e.serial_number?.toLowerCase().includes(term) ||
                e.model?.toLowerCase().includes(term) ||
                e.location?.toLowerCase().includes(term)
            )
        }

        if (statusFilter !== 'all') {
            if (statusFilter === 'warning') {
                filtered = filtered.filter(e => e.alert_status === 'warning' || e.alert_status === 'critical' || e.alert_status === 'maintenance_due')
            } else {
                filtered = filtered.filter(e => e.status === statusFilter)
            }
        }

        setFilteredEquipments(filtered)
    }

    function getStatusColor(status: string) {
        const s = status?.toLowerCase() || ''
        if (s === 'ativo' || s === 'running' || s === 'ok') return 'bg-success-500/20 text-success-400 border-success-500/30'
        if (s === 'maintenance' || s === 'manutencao') return 'bg-warning-500/20 text-warning-400 border-warning-500/30'
        if (s === 'parado' || s === 'stopped' || s === 'broken') return 'bg-danger-500/20 text-danger-400 border-danger-500/30'
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }

    function getStatusLabel(status: string) {
        const s = status?.toLowerCase() || ''
        if (s === 'ativo' || s === 'running') return 'Operacional'
        if (s === 'maintenance') return 'Em Manutenção'
        if (s === 'parado' || s === 'stopped') return 'Parado'
        return status
    }

    function getAlertBadge(alertStatus: string) {
        if (alertStatus === 'critical') return <span className="badge badge-danger flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Crítico</span>
        if (alertStatus === 'maintenance_due') return <span className="badge badge-warning flex items-center gap-1"><Calendar className="w-3 h-3" /> Manutenção</span>
        if (alertStatus === 'warning') return <span className="badge badge-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Atenção</span>
        return null
    }

    function getIconByType(type: string) {
        const t = type?.toLowerCase() || ''
        if (t.includes('server') || t.includes('servidor')) return <Server className="w-6 h-6 text-zinc-400" />
        if (t.includes('mobile') || t.includes('celular')) return <Smartphone className="w-6 h-6 text-zinc-400" />
        return <Monitor className="w-6 h-6 text-zinc-400" />
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen bg-background">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400">Carregando equipamentos...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-background">
                <div className="page-header">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Wrench className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Meus Equipamentos</h1>
                                    <p className="text-zinc-400">Gerencie seus ativos e manutenções</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, modelo, serial..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-input pl-10 w-full"
                            />
                        </div>
                        <div className="flex gap-2 bg-surface rounded-xl p-1 border border-white/5">
                            <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}>Todos</button>
                            <button onClick={() => setStatusFilter('ativo')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'ativo' ? 'bg-success-500/20 text-success-400' : 'text-zinc-400 hover:text-white'}`}>Ativos</button>
                            <button onClick={() => setStatusFilter('warning')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'warning' ? 'bg-warning-500/20 text-warning-400' : 'text-zinc-400 hover:text-white'}`}>Alertas</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEquipments.length === 0 ? (
                            <div className="col-span-full empty-state">
                                <Wrench className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                                <p className="text-xl font-bold text-white mb-2">Nenhum equipamento encontrado</p>
                                <p className="text-zinc-400">Tente buscar com outros termos</p>
                            </div>
                        ) : (
                            filteredEquipments.map((equip) => (
                                <div
                                    key={equip.id}
                                    onClick={() => router.push(`/equipments/${equip.id}`)}
                                    className="card group cursor-pointer hover:border-accent-500/50 transition-all hover:translate-y-[-2px]"
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-surface-light rounded-lg border border-white/5 group-hover:bg-accent-500/10 group-hover:border-accent-500/20 transition-colors">
                                                {getIconByType(equip.type)}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`badge ${getStatusColor(equip.status)}`}>
                                                    {getStatusLabel(equip.status)}
                                                </span>
                                                {getAlertBadge(equip.alert_status)}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-accent-400 transition-colors">{equip.name}</h3>
                                        <p className="text-sm text-zinc-400 mb-4">{equip.brand} {equip.model}</p>

                                        <div className="space-y-2 pt-4 border-t border-white/5">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">Serial</span>
                                                <span className="text-zinc-300 font-mono">{equip.serial_number || '-'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">Local</span>
                                                <span className="text-zinc-300">{equip.location || '-'}</span>
                                            </div>
                                            {equip.next_maintenance_date && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-500">Próx. Manutenção</span>
                                                    <span className={`font-medium ${new Date(equip.next_maintenance_date) < new Date() ? 'text-danger-400' : 'text-zinc-300'}`}>
                                                        {new Date(equip.next_maintenance_date).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </DashboardLayout>
    )
}
