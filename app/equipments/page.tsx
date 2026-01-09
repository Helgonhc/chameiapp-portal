'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Wrench, Calendar, AlertTriangle, CheckCircle, Search, Filter, Server, Smartphone, Monitor, Box, MapPin, Hash, QrCode } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/store/authStore';

interface Equipment {
    id: string;
    name: string;
    model: string;
    serial_number: string;
    qr_code: string | null;
    status: string;
    alert_status: string;
    next_maintenance_date: string | null;
    warranty_expiry_date: string | null;
    type: string;
    brand: string;
    location: string;
}

export default function EquipmentsPage() {
    const router = useRouter();
    const { profile, isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (isAuthenticated && profile?.client_id) {
            loadEquipments();
        } else if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, profile]);

    useEffect(() => { filterEquipments(); }, [searchTerm, statusFilter, equipments]);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    async function loadEquipments() {
        if (!profile?.client_id) return;
        try {
            setLoading(true);
            setErrorMsg(null);
            const { data, error } = await supabase
                .from('equipments')
                .select('*')
                .eq('client_id', profile.client_id);
            if (error) {
                console.error('Supabase Error:', error);
                setErrorMsg(`Error ${error.code}: ${error.message}`);
                throw error;
            }
            setEquipments(data || []);
            setFilteredEquipments(data || []);
        } catch (error: any) {
            console.error('Erro ao carregar equipamentos:', error);
            if (!errorMsg) setErrorMsg(error.message || 'Erro desconhecido');
        }
        finally { setLoading(false); }
    }

    function filterEquipments() {
        let filtered = [...equipments];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.name.toLowerCase().includes(term) ||
                e.serial_number?.toLowerCase().includes(term) ||
                e.model?.toLowerCase().includes(term) ||
                e.location?.toLowerCase().includes(term)
            );
        }
        if (statusFilter !== 'all') {
            if (statusFilter === 'warning') {
                filtered = filtered.filter(e => ['warning', 'critical', 'maintenance_due'].includes(e.alert_status));
            } else if (statusFilter === 'ativo') {
                filtered = filtered.filter(e => ['ativo', 'active', 'ok', 'running'].includes(e.status?.toLowerCase()));
            } else {
                filtered = filtered.filter(e => e.status === statusFilter);
            }
        }
        setFilteredEquipments(filtered);
    }

    function getStatusStyle(status: string) {
        const s = status?.toLowerCase() || '';
        if (['ativo', 'running', 'ok', 'active'].includes(s)) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (['maintenance', 'manutencao'].includes(s)) return 'bg-amber-50 text-amber-700 border-amber-100';
        if (['parado', 'stopped', 'broken'].includes(s)) return 'bg-red-50 text-red-700 border-red-100';
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }

    function getStatusLabel(status: string) {
        const s = status?.toLowerCase() || '';
        if (['ativo', 'running', 'active'].includes(s)) return 'Operacional';
        if (s === 'maintenance' || s === 'manutencao') return 'Em Manutenção';
        if (['parado', 'stopped'].includes(s)) return 'Parado';
        return status;
    }

    function getIconByType(type: string) {
        const t = type?.toLowerCase() || '';
        if (t.includes('server')) return <Server className="w-6 h-6" />;
        if (t.includes('mobile')) return <Smartphone className="w-6 h-6" />;
        if (t.includes('motor')) return <Wrench className="w-6 h-6" />;
        return <Box className="w-6 h-6" />;
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">Carregando ativos...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-fadeIn pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 text-white">
                            <Server size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Equipamentos</h1>
                            <p className="text-slate-500 text-sm">Gerencie o ciclo de vida dos seus ativos.</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar equipamentos, serial, modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-slate-600 shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'ativo', label: 'Operacionais' },
                            { id: 'warning', label: 'Alertas' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setStatusFilter(btn.id)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === btn.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {errorMsg && (
                    <div className="col-span-full p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl mb-4">
                        <p className="font-bold flex items-center gap-2"><AlertTriangle size={18} /> Erro de Sincronização</p>
                        <p className="text-sm">{errorMsg}</p>
                    </div>
                )}
                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredEquipments.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Box className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">Nenhum equipamento encontrado</h3>
                            <p className="text-slate-400 text-sm">Tente ajustar a busca.</p>
                        </div>
                    ) : (
                        filteredEquipments.map((equip) => (
                            <div
                                key={equip.id}
                                onClick={() => router.push(`/equipments/${equip.id}`)}
                                className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] hover:border-indigo-100 transition-all cursor-pointer group flex flex-col h-full"
                            >
                                <div className="flex  justify-between items-start mb-4">
                                    <div className="p-3 bg-slate-50 rounded-2xl text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        {getIconByType(equip.type)}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${getStatusStyle(equip.status)}`}>
                                        {getStatusLabel(equip.status)}
                                    </span>
                                </div>

                                <div className="mb-4 flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{equip.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded-md">{equip.brand} {equip.model}</p>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <div className="w-5 flex justify-center"><Hash size={14} className="text-slate-300" /></div>
                                        <span className="font-mono text-slate-600">{equip.serial_number || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <div className="w-5 flex justify-center"><MapPin size={14} className="text-slate-300" /></div>
                                        <span>{equip.location || 'Local não definido'}</span>
                                    </div>

                                    {equip.alert_status && equip.alert_status !== 'ok' && (
                                        <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2 flex items-center gap-2 text-xs font-bold text-amber-700">
                                            <AlertTriangle size={14} className="text-amber-500" />
                                            {equip.alert_status === 'maintenance_due' ? 'Manutenção Vencida' : 'Atenção Requerida'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
