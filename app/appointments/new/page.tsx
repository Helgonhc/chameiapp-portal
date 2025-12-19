'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Calendar, Clock, CheckCircle2, Sparkles } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

export default function NewAppointmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [requestedDate, setRequestedDate] = useState('')
  const [requestedTimeStart, setRequestedTimeStart] = useState('')
  const [requestedTimeEnd, setRequestedTimeEnd] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media')
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!requestedDate || !requestedTimeStart) {
        throw new Error('Data e horário são obrigatórios')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) throw new Error('Cliente não encontrado')

      const { error: insertError } = await supabase
        .from('appointment_requests')
        .insert({
          client_id: profile.client_id,
          requested_date: requestedDate,
          requested_time_start: requestedTimeStart,
          requested_time_end: requestedTimeEnd || null,
          service_type: serviceType || null,
          description: description || null,
          priority,
          status: 'pendente'
        })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => router.push('/appointments'), 2500)
    } catch (error: any) {
      setError(error.message || 'Erro ao criar agendamento')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="card p-12 max-w-md text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-success-500/30 mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Agendamento Solicitado!</h2>
            <p className="text-zinc-400 mb-6">
              Sua solicitação foi enviada. Aguarde a confirmação do técnico.
            </p>
            <div className="info-box info-box-green">
              <p className="text-sm font-medium">
                ✓ Você receberá uma notificação quando for confirmado
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="page-header">
          <div className="max-w-4xl mx-auto relative">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 text-zinc-400 mb-4 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
                <Calendar className="w-5 h-5 text-primary-400" />
              </div>
              <span className="text-primary-400 text-sm font-medium">Novo</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">Novo Agendamento</h1>
            <p className="text-zinc-400">Solicite uma visita técnica</p>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSubmit} className="card p-6 lg:p-8 space-y-6">
            <div>
              <label className="form-label">Tipo de Serviço</label>
              <input
                type="text"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="form-input"
                placeholder="Ex: Manutenção Preventiva, Instalação, Reparo..."
              />
            </div>

            <div>
              <label className="form-label">Descrição (Opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="form-textarea"
                placeholder="Descreva o que precisa ser feito..."
              />
            </div>

            <div>
              <label className="form-label">Data Desejada *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="form-input pl-10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Horário Início *</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="time"
                    value={requestedTimeStart}
                    onChange={(e) => setRequestedTimeStart(e.target.value)}
                    required
                    className="form-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Horário Fim (Opcional)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="time"
                    value={requestedTimeEnd}
                    onChange={(e) => setRequestedTimeEnd(e.target.value)}
                    className="form-input pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Prioridade</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'baixa', label: 'Baixa', emoji: '🟢' },
                  { key: 'media', label: 'Média', emoji: '🟡' },
                  { key: 'alta', label: 'Alta', emoji: '🟠' },
                  { key: 'urgente', label: 'Urgente', emoji: '🔴' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key as any)}
                    className={`priority-btn ${priority === p.key ? 'priority-btn-active' : 'priority-btn-inactive'}`}
                  >
                    <div className="text-2xl mb-1">{p.emoji}</div>
                    <div className="text-xs font-bold text-zinc-300">{p.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="info-box info-box-red">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-lg"
            >
              {loading ? 'Enviando...' : 'Solicitar Agendamento'}
            </button>
          </form>
        </main>
      </div>
    </DashboardLayout>
  )
}
