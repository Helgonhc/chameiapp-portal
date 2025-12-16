'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Calendar, Clock, CheckCircle2 } from 'lucide-react'
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
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
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
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-2xl mb-8">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Agendamento Solicitado!</h2>
            <p className="text-gray-600 mb-6">
              Sua solicitação foi enviada. Aguarde a confirmação do técnico.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-800 font-medium">
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
      <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-12 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-white mb-6 hover:text-emerald-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Novo Agendamento</h1>
              <p className="text-emerald-100 text-lg mt-1">Solicite uma visita técnica</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-8 -mt-8 pb-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Tipo de Serviço
            </label>
            <input
              type="text"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="Ex: Manutenção Preventiva, Instalação, Reparo..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Descrição (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
              placeholder="Descreva o que precisa ser feito..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Data Desejada *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Horário Início *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  value={requestedTimeStart}
                  onChange={(e) => setRequestedTimeStart(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Horário Fim (Opcional)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  value={requestedTimeEnd}
                  onChange={(e) => setRequestedTimeEnd(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Prioridade
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  priority === 'low'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="text-2xl mb-1">🟢</div>
                <div className="text-xs font-bold text-gray-700">Baixa</div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  priority === 'medium'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                <div className="text-2xl mb-1">🟡</div>
                <div className="text-xs font-bold text-gray-700">Média</div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  priority === 'high'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="text-2xl mb-1">🟠</div>
                <div className="text-xs font-bold text-gray-700">Alta</div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  priority === 'urgent'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="text-2xl mb-1">🔴</div>
                <div className="text-xs font-bold text-gray-700">Urgente</div>
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
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? 'Enviando...' : 'Solicitar Agendamento'}
          </button>
        </form>
      </main>
    </DashboardLayout>
  )
}
