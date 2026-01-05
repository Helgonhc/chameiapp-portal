'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { File, Download, Search, Folder, Calendar, HardDrive, ChevronRight, Home, ArrowLeft } from 'lucide-react';
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

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState<string[]>([]); // Navigation path e.g. ['Laudo', 'SPDA', '2024']

    useEffect(() => {
        loadDocuments();
    }, []);

    async function loadDocuments() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single();
            if (!profile?.client_id) { setLoading(false); return; }

            const { data, error } = await supabase
                .from('client_documents')
                .select('*')
                .eq('client_id', profile.client_id)
                .order('reference_date', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao carregar documentos');
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
        // Level 0: Categories (Root)
        if (currentPath.length === 0) {
            const categories = Array.from(new Set(documents.map(d => d.category || 'Outros')));
            return categories.map(cat => ({ type: 'folder', name: cat, count: documents.filter(d => (d.category || 'Outros') === cat).length }));
        }

        const category = currentPath[0];

        // Filter docs by current category
        let docs = documents.filter(d => (d.category || 'Outros') === category);

        // Special Case: Laudos have subcategories
        if (category === 'Laudo') {
            // Level 1 (Laudo): Subcategories
            if (currentPath.length === 1) {
                const subcategories = Array.from(new Set(docs.map(d => d.subcategory || 'Geral')));
                return subcategories.map(sub => ({ type: 'folder', name: sub, count: docs.filter(d => (d.subcategory || 'Geral') === sub).length }));
            }

            // Filter docs by subcategory
            const subcategory = currentPath[1];
            docs = docs.filter(d => (d.subcategory || 'Geral') === subcategory);

            // Level 2 (Laudo): Years
            if (currentPath.length === 2) {
                const years = Array.from(new Set(docs.map(d => d.reference_date ? d.reference_date.substring(0, 4) : 'Sem Data')));
                return years.sort().reverse().map(year => ({ type: 'folder', name: year, count: docs.filter(d => (d.reference_date ? d.reference_date.substring(0, 4) : 'Sem Data') === year).length }));
            }

            // Level 3 (Laudo): Files by Month (or just files if we want simpler)
            // Let's list files directly inside Year for simplicity, or add Month folder?
            // User asked for "Pastas coloridas de acordo com ano e meses". So let's add Month folder.
            const year = currentPath[2];
            docs = docs.filter(d => (d.reference_date ? d.reference_date.substring(0, 4) : 'Sem Data') === year);

            if (currentPath.length === 3) {
                const months = Array.from(new Set(docs.map(d => d.reference_date ? d.reference_date.substring(5, 7) : '00')));
                return months.sort().reverse().map(month => ({ type: 'folder', name: getMonthName(month), id: month, count: docs.filter(d => (d.reference_date ? d.reference_date.substring(5, 7) : '00') === month).length }));
            }

            // Level 4 (Final): Files
            const monthName = currentPath[3];
            // We need to match back the month number or name logic. 
            // Since we passed the name to the folder, we have to filter by name? 
            // Better to just filter by docs remaining. 
            // Actually, if we are at Level 4, we just show docs filtered by month.
            // But wait, the previous level map returned objects.
            // Let's simplify: if we are at level 3, we clicked a Month. 
            // We need the ID (01, 02) to filter.
            // Since specific implementation might be tricky with just names in path, let's look at last path item.
            // Ideally we store IDs in path, but here names are easier for breadcrumb.
            // I'll assume standard month names.
            return docs.filter(d => getMonthName(d.reference_date ? d.reference_date.substring(5, 7) : '00') === monthName).map(d => ({ type: 'file', ...d }));
        }

        // Generic Categories (ART, NF, etc) -> Year -> Month -> Files
        // Level 1: Years
        if (currentPath.length === 1) {
            const years = Array.from(new Set(docs.map(d => d.reference_date ? d.reference_date.substring(0, 4) : 'Sem Data')));
            return years.sort().reverse().map(year => ({ type: 'folder', name: year, count: docs.filter(d => (d.reference_date ? d.reference_date.substring(0, 4) : 'Sem Data') === year).length }));
        }

        const year = currentPath[1];
        docs = docs.filter(d => (d.reference_date ? d.reference_date.substring(0, 4) : 'Sem Data') === year);

        // Level 2: Months
        if (currentPath.length === 2) {
            const months = Array.from(new Set(docs.map(d => d.reference_date ? d.reference_date.substring(5, 7) : '00')));
            return months.sort().reverse().map(month => ({ type: 'folder', name: getMonthName(month), id: month, count: docs.filter(d => (d.reference_date ? d.reference_date.substring(5, 7) : '00') === month).length }));
        }

        // Level 3: Files
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

    const items = getCurrentItems();

    function navigateTo(name: string) {
        setCurrentPath([...currentPath, name]); // Add folder to path
    }

    function navigateUp() {
        setCurrentPath(currentPath.slice(0, -1));
    }

    function navigateToBreadcrumb(index: number) {
        setCurrentPath(currentPath.slice(0, index + 1));
    }

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Folder className="text-indigo-600" />
                    Documentos
                </h1>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 overflow-x-auto pb-2">
                <button
                    onClick={() => setCurrentPath([])}
                    className={`flex items-center gap-1 hover:text-indigo-600 transition-colors ${currentPath.length === 0 ? 'text-indigo-600 font-bold' : ''}`}
                >
                    <Home size={16} /> Início
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

            {/* Back Button (if deep) */}
            {currentPath.length > 0 && (
                <button onClick={navigateUp} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
                    <ArrowLeft size={16} /> Voltar
                </button>
            )}

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map((item: any, idx) => (
                        item.type === 'folder' ? (
                            // RENDER FOLDER
                            <div
                                key={idx}
                                onClick={() => navigateTo(item.name)}
                                className={`
                                    cursor-pointer p-5 rounded-2xl border border-gray-100 shadow-sm 
                                    hover:shadow-md hover:scale-105 transition-all
                                    flex flex-col items-center justify-center text-center gap-3
                                    bg-white
                                `}
                            >
                                <div className={`p-3 rounded-full ${CATEGORY_COLORS[currentPath[0] || item.name] || 'bg-indigo-50 text-indigo-600'}`}>
                                    <Folder size={32} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                                    <p className="text-xs text-gray-400">{item.count} arquivos</p>
                                </div>
                            </div>
                        ) : (
                            // RENDER FILE
                            <div
                                key={item.id}
                                className="group relative bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 bg-gray-50 text-indigo-600 rounded-lg">
                                            <File size={24} />
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                            {item.file_type}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1" title={item.title}>{item.title}</h4>
                                    <div className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                                        <Calendar size={10} /> {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDownload(item)}
                                    className="w-full py-2 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 rounded-xl font-medium text-xs hover:bg-indigo-100 transition-colors"
                                >
                                    <Download size={14} /> Download
                                </button>
                            </div>
                        )
                    ))}

                    {items.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400">
                            <Folder className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>Pasta vazia</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
