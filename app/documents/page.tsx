'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { File, Download, Search, Folder, Calendar, HardDrive, ChevronRight, Home, ArrowLeft, FileCheck, ClipboardList, Receipt, Wrench, FileBox, CalendarRange } from 'lucide-react';
import toast from 'react-hot-toast';

type DocFile = {
    id: string;
    title: string;
    file_url: string;
    file_type: string;
    file_size: number;
    category: string;
    subcategory: string | null;
    reference_date: string;
    created_at: string;
    client_id: string;
};

type FolderStructure = {
    [category: string]: {
        [subcategoryOrYear: string]: any;
    };
};

const CATEGORY_COLORS: any = {
    'ART': 'text-blue-600 bg-blue-50',
    'Laudo': 'text-orange-600 bg-orange-50',
    'Ordem de Serviço': 'text-gray-600 bg-gray-50',
    'Nota Fiscal': 'text-green-600 bg-green-50',
    'Outros': 'text-purple-600 bg-purple-50',
};

const CATEGORY_ICONS: any = {
    'ART': FileCheck,
    'Laudo': ClipboardList,
    'Ordem de Serviço': Wrench,
    'Nota Fiscal': Receipt,
    'Outros': FileBox,
};

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadDocuments();
    }, []);

    async function loadDocuments() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('client_id')
                .eq('id', user.id)
                .single();

            if (!profile?.client_id) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('client_documents')
                .select('*')
                .eq('client_id', profile.client_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
            toast.error('Não foi possível carregar seus documentos');
        } finally {
            setLoading(false);
        }
    }

    async function handleDownload(doc: DocFile) {
        try {
            const { data, error } = await supabase.storage.from('documents').createSignedUrl(doc.file_url, 60);
            if (error) throw error;
            window.open(data.signedUrl, '_blank');
        } catch (error) {
            toast.error('Erro ao baixar documento');
        }
    }

    // --- Logic to filter/group based on currentPath ---
    const getCurrentItems = () => {
        let docs = documents;

        // Level 0: YEARS (Root)
        if (currentPath.length === 0) {
            const currentYear = new Date().getFullYear();
            const allowedYears = [currentYear.toString(), (currentYear + 1).toString()]; // Filter 2 years

            const years = Array.from(new Set(docs.map(d => d.reference_date ? d.reference_date.substring(0, 4) : 'Sem Data')))
                .filter(y => allowedYears.includes(y));

            return years.sort().reverse().map(year => ({
                type: 'folder',
                name: year,
                count: docs.filter(d => (d.reference_date?.substring(0, 4) || 'Sem Data') === year).length
            }));
        }

        const year = currentPath[0];
        docs = docs.filter(d => (d.reference_date?.substring(0, 4) || 'Sem Data') === year);

        // Level 1: CATEGORIES
        if (currentPath.length === 1) {
            const categories = Array.from(new Set(docs.map(d => d.category || 'Outros')));
            return categories.map(cat => ({
                type: 'folder',
                name: cat,
                count: docs.filter(d => (d.category || 'Outros') === cat).length
            }));
        }

        const category = currentPath[1];
        docs = docs.filter(d => (d.category || 'Outros') === category);

        // Level 2: SUBCATEGORY (if Laudo) OR MONTH (if others)
        if (category === 'Laudo') {
            if (currentPath.length === 2) {
                const subcategories = Array.from(new Set(docs.map(d => d.subcategory || 'Geral')));
                return subcategories.map(sub => ({
                    type: 'folder',
                    name: sub,
                    count: docs.filter(d => (d.subcategory || 'Geral') === sub).length
                }));
            }

            const subcategory = currentPath[2];
            docs = docs.filter(d => (d.subcategory || 'Geral') === subcategory);

            if (currentPath.length === 3) {
                const months = Array.from(new Set(docs.map(d => d.reference_date ? d.reference_date.substring(5, 7) : '00')));
                return months.sort().reverse().map(month => ({ type: 'folder', name: getMonthName(month), id: month, count: docs.filter(d => (d.reference_date ? d.reference_date.substring(5, 7) : '00') === month).length }));
            }

            const monthName = currentPath[3];
            return docs.filter(d => getMonthName(d.reference_date ? d.reference_date.substring(5, 7) : '00') === monthName).map(d => ({ type: 'file', ...d }));
        }

        // Generic Category (ART, NF...) -> Month -> Files
        if (currentPath.length === 2) {
            const months = Array.from(new Set(docs.map(d => d.reference_date ? d.reference_date.substring(5, 7) : '00')));
            return months.sort().reverse().map(month => ({ type: 'folder', name: getMonthName(month), id: month, count: docs.filter(d => (d.reference_date ? d.reference_date.substring(5, 7) : '00') === month).length }));
        }

        const monthName = currentPath[2];
        return docs.filter(d => getMonthName(d.reference_date ? d.reference_date.substring(5, 7) : '00') === monthName).map(d => ({ type: 'file', ...d }));
    };

    function getMonthName(month: string) {
        const months: Record<string, string> = {
            '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril', '05': 'Maio', '06': 'Junho',
            '07': 'Julho', '08': 'Agosto', '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro', '00': 'Geral'
        };
        return months[month] || month;
    }

    // --- SEARCH LOGIC ---
    useEffect(() => {
        // Simple search that filters current visible items
    }, [searchTerm]);

    const items = getCurrentItems().filter(item => {
        if (item.type === 'folder') {
            return (item as any).name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        // It's a file
        return (item as any).title?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    function navigateTo(name: string) {
        setCurrentPath([...currentPath, name]);
        setSearchTerm(''); // Clear search on navigation
    }

    function navigateUp() {
        setCurrentPath(currentPath.slice(0, -1));
        setSearchTerm('');
    }

    function navigateToBreadcrumb(index: number) {
        setCurrentPath(currentPath.slice(0, index + 1));
    }

    // Helper to get Icon
    function getFolderIcon(item: any) {
        if (currentPath.length === 0) return CalendarRange; // Years
        if (currentPath.length === 2 && CATEGORY_ICONS[currentPath[1]]) return Calendar; // Months inside Category (generic) or Subcat (Laudo)
        // Adjust for Laudo
        if (currentPath[1] === 'Laudo' && currentPath.length === 3) return Calendar;

        // Categories
        return CATEGORY_ICONS[item.name] || Folder;
    }

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Header with Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <a href="/dashboard" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors" title="Voltar ao Início">
                            <Home size={20} />
                        </a>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Folder className="text-indigo-600" />
                            Seus Documentos
                        </h1>
                    </div>
                    <p className="text-gray-500">
                        Navegue por Ano &gt; Categoria para encontrar seus arquivos.
                    </p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Filtrar nesta pasta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 overflow-x-auto pb-2 border-b border-gray-100 mb-4">
                <button
                    onClick={() => setCurrentPath([])}
                    className={`flex items-center gap-1 hover:text-indigo-600 transition-colors ${currentPath.length === 0 ? 'text-indigo-600 font-bold' : ''}`}
                >
                    <Folder size={16} /> Raiz
                </button>
                {currentPath.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 whitespace-nowrap">
                        <ChevronRight size={14} className="text-gray-300" />
                        <button
                            onClick={() => navigateToBreadcrumb(index)}
                            className={`hover:text-indigo-600 transition-colors ${index === currentPath.length - 1 ? 'text-indigo-600 font-bold' : ''}`}
                        >
                            {item}
                        </button>
                    </div>
                ))}
            </div>

            {/* Back Button */}
            {currentPath.length > 0 && (
                <button onClick={navigateUp} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
                    <ArrowLeft size={16} /> Voltar
                </button>
            )}

            {/* Content Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map((item: any, idx) => {
                        if (item.type === 'folder') {
                            const Icon = getFolderIcon(item);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => navigateTo(item.name)}
                                    className={`
                                        cursor-pointer p-4 rounded-xl border border-gray-100 bg-white
                                        hover:border-indigo-200 hover:shadow-sm transition-all duration-200
                                        flex items-center gap-4 group
                                    `}
                                >
                                    <div className={`
                                        p-3 rounded-lg ${CATEGORY_COLORS[currentPath[1] || item.name] || 'bg-gray-50 text-gray-500'}
                                        group-hover:scale-105 transition-transform duration-200
                                    `}>
                                        <Icon size={24} strokeWidth={2} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                                        <p className="text-[11px] text-gray-400 font-medium">
                                            {item.count} itens
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            );
                        } else {
                            // File
                            const doc = item as any;
                            const isPdf = doc.file_type?.toLowerCase().includes('pdf');
                            const isImage = doc.file_type?.toLowerCase().includes('image') || doc.file_type?.toLowerCase().includes('png') || doc.file_type?.toLowerCase().includes('jpg');

                            return (
                                <div
                                    key={doc.id}
                                    className="group relative bg-white p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${isPdf ? 'bg-red-50 text-red-500' : isImage ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500'}`}>
                                            {isImage ? <HardDrive size={20} strokeWidth={2} /> : <File size={20} strokeWidth={2} />}
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                            {doc.file_type?.substring(0, 3)}
                                        </span>
                                    </div>

                                    <h4 className="font-semibold text-gray-700 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors" title={doc.title}>
                                        {doc.title}
                                    </h4>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <Calendar size={10} /> {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                            title="Baixar"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        }
                    })}

                    {items.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Folder className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-gray-800 font-medium">Pasta vazia</h3>
                            <p className="text-sm text-gray-400 mt-1">Nenhum arquivo encontrado aqui.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
