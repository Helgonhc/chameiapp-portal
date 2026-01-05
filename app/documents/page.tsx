'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { File, Download, Search, FolderOpen, Calendar, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

    async function handleDownload(doc: any) {
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.file_url, 60);

            if (error) throw error;
            window.open(data.signedUrl, '_blank');
        } catch (error) {
            toast.error('Erro ao baixar documento');
        }
    }

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FolderOpen className="text-indigo-600" />
                        Meus Documentos
                    </h1>
                    <p className="text-gray-500">Acesse arquivos e relatórios compartilhados com você.</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar arquivo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : filteredDocs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FolderOpen className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">Nenhum documento encontrado</h3>
                    <p className="text-gray-500">Você não possui documentos compartilhados no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDocs.map((doc) => (
                        <div key={doc.id} className="group bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <File size={24} />
                                </div>
                                {doc.file_type && (
                                    <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                        {doc.file_type}
                                    </span>
                                )}
                            </div>

                            <h3 className="font-semibold text-gray-800 mb-1 truncate" title={doc.title}>
                                {doc.title}
                            </h3>

                            <div className="space-y-1 mb-4">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar size={12} />
                                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <HardDrive size={12} />
                                    {(doc.file_size / 1024).toFixed(1)} KB
                                </div>
                            </div>

                            <button
                                onClick={() => handleDownload(doc)}
                                className="w-full py-2 bg-white border border-indigo-100 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 hover:border-indigo-200 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Download size={16} />
                                Baixar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
