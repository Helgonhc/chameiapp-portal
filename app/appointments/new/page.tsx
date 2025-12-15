'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Calendar, Clock, CheckCircle2 } from 'lucide-react'

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
          status: 'pending'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Agendamento Solicitado!</h2>
          <p className="text-slate-600 mb-6">
            Sua solicitação foi enviada. Aguarde a confirmação do técnico.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-800 font-medium">
              ✓ Você receberá uma notificação quando for confirmado
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Novo Agendamento</h1>
              <p className="text-sm text-slate-500">Solicite uma visita técnica</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-8 space-y-6">
          {/* Tipo de Serviço */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Tipo de Serviço
            </label>
            <input
              type="text"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ex: Manutenção Preventiva, Instalação, Reparo..."
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Descrição (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Descreva o que precisa ser feito..."
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Data Desejada *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Horários */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Horário Início *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="time"
                  value={requestedTimeStart}
                  onChange={(e) => setRequestedTimeStart(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Horário Fim (Opcional)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="time"
                  value={requestedTimeEnd}
                  onChange={(e) => setRequestedTimeEnd(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Prioridade
            </label>
            <div className="grid grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setPriority('baixa')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  priority === 'baixa'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <div className="text-2xl mb-1">🟢</div>
                <div className="text-xs font-bold">Baixa</div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('media')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  priority === 'media'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-slate-200 hover:border-yellow-300'
                }`}
              >
                <div className="text-2xl mb-1">🟡</div>
                <div className="text-xs font-bold">Média</div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('alta')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  priority === 'alta'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className="text-2xl mb-1">🟠</div>
                <div className="text-xs font-bold">Alta</div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('urgente')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  priority === 'urgente'
                    ? 'border-red-500 bg-red-50'
                    : 'border-slate-200 hover:border-red-300'
                }`}
              >
                <div className="text-2xl mb-1">🔴</div>
                <div className="text-xs font-bold">Urgente</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? 'Enviando...' : 'Solicitar Agendamento'}
          </button>
        </form>
      </main>
    </div>
  )
}
