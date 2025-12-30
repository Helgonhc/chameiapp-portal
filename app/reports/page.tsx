'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FileText, Download, Calendar, DollarSign, Wrench, Activity, Sparkles, Filter, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [reportType, setReportType] = useState('financial') // financial, equipment, sla
    const [clientProfile, setClientProfile] = useState<any>(null)

    useEffect(() => {
        checkAuth()

        // Set default dates (current month)
        const date = new Date()
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        setDateFrom(firstDay.toISOString().split('T')[0])
        setDateTo(lastDay.toISOString().split('T')[0])
    }, [])

    async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) router.push('/login')

        // Get profile and client info for report header
        const { data: profile } = await supabase
            .from('profiles')
            .select('*, client:clients(name, client_logo_url)')
            .eq('id', user?.id)
            .single()

        setClientProfile(profile)
        setLoading(false)
    }

    const reports = [
        {
            id: 'financial',
            title: 'Relatório Financeiro',
            description: 'Gastos com manutenção, orçamentos aprovados e serviços realizados.',
            icon: DollarSign,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-400',
            gradient: 'from-emerald-500 to-emerald-600'
        },
        {
            id: 'equipment',
            title: 'Saúde dos Equipamentos',
            description: 'Status de garantia, histórico de manutenção e equipamentos críticos.',
            icon: Wrench,
            color: 'bg-blue-500',
            textColor: 'text-blue-400',
            gradient: 'from-blue-500 to-blue-600'
        },
        {
            id: 'sla',
            title: 'Performance de Atendimento',
            description: 'Tempo médio de resolução, cumprimento de SLA e chamados.',
            icon: Activity,
            color: 'bg-purple-500',
            textColor: 'text-purple-400',
            gradient: 'from-purple-500 to-purple-600'
        }
    ]

    async function generatePDF() {
        setGenerating(true)
        try {
            const doc = new jsPDF()

            // Header
            const companyName = clientProfile?.client?.name || 'Cliente'
            // const logoUrl = clientProfile?.client?.client_logo_url

            // Title
            doc.setFontSize(22)
            doc.setTextColor(40, 40, 40)
            doc.text(companyName, 14, 20)

            doc.setFontSize(12)
            doc.setTextColor(100, 100, 100)
            doc.text(`Relatório Gerencial - ${reports.find(r => r.id === reportType)?.title}`, 14, 28)

            doc.setFontSize(10)
            doc.text(`Período: ${new Date(dateFrom).toLocaleDateString('pt-BR')} até ${new Date(dateTo).toLocaleDateString('pt-BR')}`, 14, 35)
            doc.text(`Gerado por: ${clientProfile?.full_name || 'Usuário'} em ${new Date().toLocaleString('pt-BR')}`, 14, 40)

            // Line separator
            doc.setDrawColor(200, 200, 200)
            doc.line(14, 45, 196, 45)

            // Data Fetching based on Report Type
            if (reportType === 'financial') {
                const { data: quotes } = await supabase
                    .from('quotes')
                    .select('*')
                    .eq('client_id', clientProfile.client_id)
                    .gte('created_at', dateFrom)
                    .lte('created_at', dateTo + 'T23:59:59')
                    .order('created_at', { ascending: false })

                const headers = [['Data', 'Número', 'Título', 'Status', 'Valor']]
                const data = quotes?.map(q => [
                    new Date(q.created_at).toLocaleDateString('pt-BR'),
                    q.quote_number,
                    q.title,
                    translateStatus(q.status),
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(q.total)
                ]) || []

                doc.setFontSize(14)
                doc.setTextColor(0, 0, 0)
                doc.text('Orçamentos no Período', 14, 55)

                autoTable(doc, {
                    startY: 60,
                    head: headers,
                    body: data,
                    theme: 'grid',
                    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                    styles: { fontSize: 9 }
                })

                // Summary
                const total = quotes?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0
                const approved = quotes?.filter(q => q.status === 'approved' || q.status === 'converted' || q.status === 'completed').reduce((acc, curr) => acc + (curr.total || 0), 0) || 0

                const finalY = (doc as any).lastAutoTable.finalY + 10
                doc.text(`Total Orçado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}`, 14, finalY)
                doc.text(`Total Aprovado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(approved)}`, 14, finalY + 7)
            }

            else if (reportType === 'equipment') {
                const { data: equipments } = await supabase
                    .from('equipments')
                    .select('*, equipment_maintenance_history(*)')
                    .eq('client_id', clientProfile.client_id)

                const headers = [['Modelo', 'Serial', 'Status', 'Manutenções', 'Garantia']]
                const data = equipments?.map(e => [
                    `${e.brand} ${e.model}`,
                    e.serial_number,
                    e.status,
                    e.equipment_maintenance_history?.length || 0,
                    e.warranty_expiry_date ? new Date(e.warranty_expiry_date).toLocaleDateString('pt-BR') : 'N/A'
                ]) || []

                doc.text('Inventário de Equipamentos', 14, 55)

                autoTable(doc, {
                    startY: 60,
                    head: headers,
                    body: data,
                    theme: 'striped',
                    headStyles: { fillColor: [46, 204, 113], textColor: 255 },
                })
            }

            else if (reportType === 'sla') {
                const { data: tickets } = await supabase
                    .from('tickets')
                    .select('*')
                    .eq('client_id', clientProfile.client_id)
                    .gte('created_at', dateFrom)
                    .lte('created_at', dateTo + 'T23:59:59')

                const total = tickets?.length || 0
                const resolved = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0
                const pending = total - resolved

                doc.text('Performance de Chamados', 14, 55)
                doc.setFontSize(11)
                doc.text(`Total de Chamados: ${total}`, 14, 65)
                doc.text(`Resolvidos: ${resolved}`, 14, 72)
                doc.text(`Pendentes: ${pending}`, 14, 79)

                const headers = [['Ticket', 'Assunto', 'Status', 'Prioridade', 'Data Abertura']]
                const data = tickets?.map(t => [
                    t.ticket_number,
                    t.title,
                    translateStatus(t.status),
                    translatePriority(t.priority),
                    new Date(t.created_at).toLocaleDateString('pt-BR')
                ]) || []

                autoTable(doc, {
                    startY: 90,
                    head: headers,
                    body: data,
                    theme: 'plain',
                    headStyles: { fillColor: [142, 68, 173], textColor: 255 },
                })
            }

            // Footer
            const pageCount = doc.internal.pages.length - 1
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(150)
                doc.text(`Página ${i} de ${pageCount} - AeC Serviços Especializados - Relatório Oficial`, 105, 290, { align: 'center' })
            }

            doc.save(`relatorio-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`)

        } catch (error) {
            console.error('Erro ao gerar PDF:', error)
            alert('Erro ao gerar relatório. Tente novamente.')
        } finally {
            setGenerating(false)
        }
    }

    function translateStatus(status: string) {
        const map: any = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado', completed: 'Concluído', in_progress: 'Em Andamento', open: 'Aberto', resolved: 'Resolvido', closed: 'Fechado' }
        return map[status] || status
    }

    function translatePriority(priority: string) {
        const map: any = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' }
        return map[priority] || priority
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="page-header">
                    <div className="max-w-7xl mx-auto relative">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                                    Relatórios Gerenciais <Sparkles className="w-5 h-5 text-accent-400" />
                                </h1>
                                <p className="text-zinc-400">Gere PDFs detalhados da sua operação</p>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Controls */}
                    <div className="card p-6 mb-8 border border-white/10 bg-surface/80 backdrop-blur">
                        <div className="flex flex-col md:flex-row items-end gap-6">
                            <div className="flex-1 w-full">
                                <label className="form-label flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-primary-400" /> Tipo de Relatório
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {reports.map((rep) => (
                                        <button
                                            key={rep.id}
                                            onClick={() => setReportType(rep.id)}
                                            className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 ${reportType === rep.id
                                                    ? `border-white/20 bg-gradient-to-br ${rep.gradient} shadow-lg scale-[1.02]`
                                                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <rep.icon className={`w-6 h-6 mb-3 ${reportType === rep.id ? 'text-white' : rep.textColor}`} />
                                            <h3 className={`font-bold ${reportType === rep.id ? 'text-white' : 'text-zinc-200'}`}>
                                                {rep.title}
                                            </h3>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="flex-1">
                                    <label className="form-label">De</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="form-label">Até</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                            <button
                                onClick={generatePDF}
                                disabled={generating || !dateFrom || !dateTo}
                                className="btn-primary flex items-center gap-3 px-8 py-3 text-lg font-bold shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Gerando PDF...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" /> Baixar Relatório PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Preview / Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="card p-6">
                            <h3 className="font-bold text-white mb-4">O que será incluído?</h3>
                            <ul className="space-y-4">
                                {reportType === 'financial' && (
                                    <>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
                                            <div>
                                                <p className="text-zinc-200 font-medium">Orçamentos Detalhados</p>
                                                <p className="text-sm text-zinc-500">Lista completa de orçamentos gerados no período.</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
                                            <div>
                                                <p className="text-zinc-200 font-medium">Gastos Aprovados</p>
                                                <p className="text-sm text-zinc-500">Somatório de todos os serviços autorizados.</p>
                                            </div>
                                        </li>
                                    </>
                                )}
                                {reportType === 'equipment' && (
                                    <>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
                                            <div>
                                                <p className="text-zinc-200 font-medium">Status de Garantia</p>
                                                <p className="text-sm text-zinc-500">Equipamentos dentro e fora do prazo.</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
                                            <div>
                                                <p className="text-zinc-200 font-medium">Histórico de Manutenções</p>
                                                <p className="text-sm text-zinc-500">Contagem de intervenções por ativo.</p>
                                            </div>
                                        </li>
                                    </>
                                )}
                                {reportType === 'sla' && (
                                    <>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-purple-500" />
                                            <div>
                                                <p className="text-zinc-200 font-medium">Métricas de Chamados</p>
                                                <p className="text-sm text-zinc-500">Total de tickets abertos vs resolvidos.</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-purple-500" />
                                            <div>
                                                <p className="text-zinc-200 font-medium">Tempos de Resposta</p>
                                                <p className="text-sm text-zinc-500">Análise de cumprimento de prazos.</p>
                                            </div>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>

                        <div className="card p-6 bg-gradient-to-br from-surface-light to-transparent border border-white/5 flex items-center justify-center text-center">
                            <div>
                                <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium text-zinc-400">Prévia do Documento</p>
                                <p className="text-sm text-zinc-600 mt-2">O arquivo será gerado com a logo da<br />AeC Serviços Especializados</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    )
}
