'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ArrowRight, X, CheckCircle2, Camera, Image as ImageIcon, Zap, Wrench, FileText, Sparkles, AlertTriangle, Clock } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Equipment { id: string; name: string; type: string; model: string }

export default function NewOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [callType, setCallType] = useState<'custom' | 'maintenance'>('custom')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('media')
  const [equipmentId, setEquipmentId] = useState<string>('')
  const [photos, setPhotos] = useState<string[]>([])
  const [maintenanceTypeId, setMaintenanceTypeId] = useState<string>('')
  const [maintenanceTypes, setMaintenanceTypes] = useState<any[]>([])

  useEffect(() => { checkAuth(); loadEquipments(); loadMaintenanceTypes() }, [])

  async function checkAuth() { const { data: { user } } = await supabase.auth.getUser(); if (!user) router.push('/login') }
  
  async function loadEquipments() {
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
      if (!profile?.client_id) return
      const { data } = await supabase.from('equipments').select('id, name, type, model').eq('client_id', profile.client_id).eq('status', 'ativo').order('name')
      setEquipments(data || [])
    } catch (error) { console.error('Erro:', error) }
  }

  async function loadMaintenanceTypes() {
    try {
      const { data } = await supabase.from('maintenance_types').select('*').eq('is_active', true).order('name')
      setMaintenanceTypes(data || [])
    } catch (error) { console.error('Erro:', error) }
  }

  async function handleSubmit() {
    setLoading(true); setError('')
    try {
      if (!title.trim()) throw new Error('Título é obrigatório')
      if (!description.trim()) throw new Error('Descrição é obrigatória')
      const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Usuário não autenticado')
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
      if (!profile?.client_id) throw new Error('Cliente não encontrado')
      
      const { data: newTicket, error: ticketError } = await supabase.from('tickets').insert({
        client_id: profile.client_id, title: title.trim(), description: description.trim(), priority, status: 'aberto',
        equipment_id: equipmentId || null, maintenance_type_id: maintenanceTypeId || null, photos: photos.length > 0 ? photos : null, created_by: user.id
      }).select('id, ticket_number').single()
      if (ticketError) throw ticketError

      const { data: clientData } = await supabase.from('clients').select('name').eq('id', profile.client_id).single()
      const { data: allUsers } = await supabase.from('profiles').select('id').in('role', ['admin', 'super_admin', 'technician']).eq('is_active', true)
      if (allUsers && allUsers.length > 0) {
        const notifications = allUsers.map(u => ({ user_id: u.id, title: '🎫 Novo Chamado Aberto', message: `Cliente: ${clientData?.name || 'N/A'} - ${title.trim()}`, type: 'ticket', reference_id: newTicket?.id, is_read: false }))
        await supabase.from('notifications').insert(notifications)
      }
      setSuccess(true); setTimeout(() => router.push('/dashboard'), 2500)
    } catch (error: any) { setError(error.message || 'Erro ao criar chamado') }
    finally { setLoading(false) }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files; if (!files) return
    Array.from(files).forEach(file => { const reader = new FileReader(); reader.onloadend = () => setPhotos(prev => [...prev, reader.result as string]); reader.readAsDataURL(file) })
  }

  function selectMaintenance(mt: any) {
    setCallType('maintenance'); setTitle(`Manutenção: ${mt.name}`); setDescription(mt.description || `Solicitação de manutenção periódica: ${mt.name}`)
    setMaintenanceTypeId(mt.id); setPriority('media'); setStep(3)
  }

  if (success) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="card p-12 max-w-md text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-success-500/30 mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Chamado Criado!</h2>
            <p className="text-zinc-400 mb-6">Seu chamado foi registrado com sucesso. Nossa equipe já foi notificada.</p>
            <div className="info-box info-box-green"><p className="text-sm font-medium">✓ Você receberá atualizações em tempo real</p></div>
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
          <div className="max-w-5xl mx-auto relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => step === 1 ? router.push('/dashboard') : setStep(step - 1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">Novo Chamado <Sparkles className="w-5 h-5 text-accent-400" /></h1>
                  <p className="text-zinc-400">Passo {step} de 4</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                {[1, 2, 3, 4].map((s) => (<div key={s} className={`h-2 w-16 rounded-full transition-all ${s <= step ? 'bg-primary-500' : 'bg-white/10'}`} />))}
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="info-box info-box-red mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Step 1 - Tipo de Chamado */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Como podemos ajudar?</h2>
                <p className="text-zinc-400">Escolha o tipo de chamado</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <button onClick={() => { setCallType('custom'); setMaintenanceTypeId(''); setStep(2) }} className="group card p-8 text-left hover:border-primary-500/50">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Problema Específico</h3>
                  <p className="text-zinc-400 mb-4 text-sm">Descreva um problema ou necessidade específica</p>
                  <span className="text-primary-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">Continuar <ArrowRight className="w-4 h-4" /></span>
                </button>
                <button onClick={() => { setCallType('maintenance'); setStep(2) }} className="group card p-8 text-left hover:border-accent-500/50">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-accent-500/30 group-hover:scale-110 transition-transform">
                    <Wrench className="w-7 h-7 text-dark-900" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Manutenção Periódica</h3>
                  <p className="text-zinc-400 mb-4 text-sm">Solicite uma manutenção programada</p>
                  <span className="text-accent-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">Ver opções <ArrowRight className="w-4 h-4" /></span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 - Detalhes ou Tipo de Manutenção */}
          {step === 2 && (
            <div className="animate-fade-in">
              {callType === 'maintenance' ? (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Tipo de Manutenção</h2>
                    <p className="text-zinc-400">Selecione o tipo de manutenção desejada</p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {maintenanceTypes.length === 0 ? (
                      <div className="col-span-full empty-state">
                        <Wrench className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400">Nenhum tipo de manutenção disponível</p>
                      </div>
                    ) : (
                      maintenanceTypes.map((mt) => (
                        <button key={mt.id} onClick={() => selectMaintenance(mt)} className="card p-6 text-left hover:border-accent-500/50 group">
                          <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent-500/30 transition-colors">
                            <Wrench className="w-6 h-6 text-accent-400" />
                          </div>
                          <h3 className="font-bold text-white mb-2">{mt.name}</h3>
                          {mt.description && <p className="text-zinc-400 text-sm line-clamp-2">{mt.description}</p>}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="text-center mt-6">
                    <button onClick={() => { setCallType('custom'); setMaintenanceTypeId('') }} className="text-zinc-400 hover:text-white transition-colors">
                      Ou descreva um problema específico →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Descreva o Problema</h2>
                    <p className="text-zinc-400">Forneça detalhes sobre sua solicitação</p>
                  </div>
                  <div className="card p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
                    <div>
                      <label className="form-label">Título do Chamado *</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Ar condicionado não está gelando" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Descrição Detalhada *</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o problema com o máximo de detalhes possível..." rows={5} className="form-textarea" />
                    </div>
                    <button onClick={() => setStep(3)} disabled={!title.trim() || !description.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
                      Continuar <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3 - Prioridade e Equipamento */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Prioridade e Equipamento</h2>
                <p className="text-zinc-400">Defina a urgência e selecione o equipamento</p>
              </div>
              <div className="card p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="form-label">Prioridade</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'baixa', label: 'Baixa', color: 'success', icon: Clock },
                      { value: 'media', label: 'Média', color: 'warning', icon: AlertTriangle },
                      { value: 'alta', label: 'Alta', color: 'danger', icon: Zap }
                    ].map((p) => (
                      <button key={p.value} onClick={() => setPriority(p.value as any)} className={`priority-btn ${priority === p.value ? 'priority-btn-active' : 'priority-btn-inactive'}`}>
                        <p.icon className={`w-5 h-5 mx-auto mb-2 ${priority === p.value ? `text-${p.color}-400` : 'text-zinc-400'}`} />
                        <span className={`font-medium ${priority === p.value ? 'text-white' : 'text-zinc-400'}`}>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label">Equipamento (Opcional)</label>
                  <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} className="form-input">
                    <option value="">Selecione um equipamento</option>
                    {equipments.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.name} - {eq.model}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setStep(4)} className="btn-primary w-full flex items-center justify-center gap-2">
                  Continuar <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4 - Fotos e Confirmação */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Fotos e Confirmação</h2>
                <p className="text-zinc-400">Adicione fotos e revise seu chamado</p>
              </div>
              <div className="card p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
                {/* Upload de Fotos */}
                <div>
                  <label className="form-label">Fotos (Opcional)</label>
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-primary-500/50 transition-colors">
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Camera className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                      <p className="text-zinc-400 text-sm">Clique para adicionar fotos</p>
                      <p className="text-zinc-500 text-xs mt-1">Ajuda a identificar o problema</p>
                    </label>
                  </div>
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <button onClick={() => setPhotos(photos.filter((_, i) => i !== index))} className="absolute top-1 right-1 w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resumo */}
                <div className="bg-surface-light rounded-xl p-5 space-y-3">
                  <h3 className="font-bold text-white mb-4">Resumo do Chamado</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Título:</span>
                    <span className="text-white font-medium">{title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Prioridade:</span>
                    <span className={`font-medium ${priority === 'alta' ? 'text-danger-400' : priority === 'media' ? 'text-warning-400' : 'text-success-400'}`}>
                      {priority === 'alta' ? 'Alta' : priority === 'media' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                  {equipmentId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Equipamento:</span>
                      <span className="text-white font-medium">{equipments.find(e => e.id === equipmentId)?.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Fotos:</span>
                    <span className="text-white font-medium">{photos.length} anexada(s)</span>
                  </div>
                </div>

                <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando chamado...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Criar Chamado
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  )
}
