'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ArrowRight, X, CheckCircle2, Camera, Image as ImageIcon, Zap, Wrench, FileText, Sparkles } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Equipment {
  id: string
  name: string
  type: string
  model: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Form data
  const [callType, setCallType] = useState<'custom' | 'maintenance'>('custom')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('media')
  const [equipmentId, setEquipmentId] = useState<string>('')
  const [photos, setPhotos] = useState<string[]>([])
  const [maintenanceTypeId, setMaintenanceTypeId] = useState<string>('')
  const [maintenanceTypes, setMaintenanceTypes] = useState<any[]>([])

  useEffect(() => {
    checkAuth()
    loadEquipments()
    loadMaintenanceTypes()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadEquipments() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
      if (!profile?.client_id) return
      const { data } = await supabase.from('equipments').select('id, name, type, model').eq('client_id', profile.client_id).eq('status', 'ativo').order('name')
      setEquipments(data || [])
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error)
    }
  }

  async function loadMaintenanceTypes() {
    try {
      const { data, error } = await supabase.from('maintenance_types').select('*').eq('is_active', true).order('name')
      if (error) throw error
      setMaintenanceTypes(data || [])
    } catch (error) {
      console.error('Erro ao carregar tipos de manutenção:', error)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      if (!title.trim()) throw new Error('Título é obrigatório')
      if (!description.trim()) throw new Error('Descrição é obrigatória')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')
      const { data: profile, error: profileError } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
      if (profileError) throw profileError
      if (!profile?.client_id) throw new Error('Cliente não encontrado')
      
      // Criar o ticket
      const { data: newTicket, error: ticketError } = await supabase.from('tickets').insert({
        client_id: profile.client_id,
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'aberto',
        equipment_id: equipmentId || null,
        maintenance_type_id: maintenanceTypeId || null,
        photos: photos.length > 0 ? photos : null,
        created_by: user.id
      }).select('id, ticket_number').single()
      
      if (ticketError) throw ticketError

      // Buscar nome do cliente para a notificação
      const { data: clientData } = await supabase
        .from('clients')
        .select('name')
        .eq('id', profile.client_id)
        .single()

      // Criar notificações para TODOS os usuários da plataforma (admin, super_admin, técnicos)
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'super_admin', 'technician'])
        .eq('is_active', true)

      if (allUsers && allUsers.length > 0) {
        const notifications = allUsers.map(u => ({
          user_id: u.id,
          title: '🎫 Novo Chamado Aberto',
          message: `Cliente: ${clientData?.name || 'N/A'} - ${title.trim()}`,
          type: 'ticket',
          reference_id: newTicket?.id,
          is_read: false
        }))

        await supabase.from('notifications').insert(notifications)
      }

      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch (error: any) {
      setError(error.message || 'Erro ao criar chamado')
    } finally {
      setLoading(false)
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => setPhotos(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
  }

  function selectMaintenance(mt: any) {
    setCallType('maintenance')
    setTitle(`Manutenção: ${mt.name}`)
    setDescription(mt.description || `Solicitação de manutenção periódica: ${mt.name}`)
    setMaintenanceTypeId(mt.id)
    setPriority('media')
    setStep(3) // Pular para prioridade já que título e descrição estão preenchidos
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center animate-[fadeIn_0.5s_ease-out]">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Chamado Criado!</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Seu chamado foi registrado com sucesso. Nossa equipe já foi notificada.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-800 font-medium">
              ✓ Você receberá atualizações em tempo real
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Premium */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 px-8 py-8">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => step === 1 ? router.push('/dashboard') : setStep(step - 1)} 
                  className="p-3 bg-white/20 backdrop-blur-xl hover:bg-white/30 rounded-xl transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    Novo Chamado
                    <Sparkles className="w-6 h-6" />
                  </h1>
                  <p className="text-cyan-100">Passo {step} de 4</p>
                </div>
              </div>
              {/* Progress Bar Premium */}
              <div className="hidden md:flex items-center gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className={`h-3 w-20 rounded-full transition-all duration-500 ${s <= step ? 'bg-white shadow-lg' : 'bg-white/30'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Step 1: Escolher Tipo */}
        {step === 1 && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Como podemos ajudar?</h2>
              <p className="text-slate-600">Escolha o tipo de chamado que deseja abrir</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Chamado Personalizado */}
              <button
                onClick={() => {
                  setCallType('custom')
                  setMaintenanceTypeId('')
                  setStep(2)
                }}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Problema Específico</h3>
                  <p className="text-slate-600 mb-6">
                    Descreva um problema ou necessidade específica que você está enfrentando
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Continuar</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </button>

              {/* Manutenção Periódica */}
              <button
                onClick={() => {
                  setCallType('maintenance')
                  setStep(2)
                }}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <Wrench className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Manutenção Periódica</h3>
                  <p className="text-slate-600 mb-6">
                    Solicite uma das manutenções programadas disponíveis para sua empresa
                  </p>
                  <div className="flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Ver opções</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Detalhes (Custom) ou Escolher Manutenção */}
        {step === 2 && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            {callType === 'maintenance' ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">Escolha a Manutenção</h2>
                  <p className="text-slate-600">Selecione o tipo de manutenção que deseja solicitar</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto">
                  {maintenanceTypes.map((mt) => (
                    <button
                      key={mt.id}
                      onClick={() => selectMaintenance(mt)}
                      className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-400 text-left"
                    >
                      <div className="text-4xl mb-3">🔧</div>
                      <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-purple-600 transition-colors">
                        {mt.name}
                      </h3>
                      {mt.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {mt.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">Descreva o Problema</h2>
                  <p className="text-slate-600">Quanto mais detalhes, melhor poderemos ajudar</p>
                </div>

                <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Título do Chamado *
                    </label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      maxLength={100} 
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg" 
                      placeholder="Ex: Disjuntor desarmando constantemente" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Descrição Detalhada *
                    </label>
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      rows={6} 
                      maxLength={1000} 
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-lg" 
                      placeholder="Descreva o problema em detalhes: quando começou, com que frequência acontece, etc..." 
                    />
                    <p className="text-sm text-slate-500 mt-2">{description.length}/1000 caracteres</p>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    disabled={!title.trim() || !description.trim()}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Prioridade e Equipamento */}
        {step === 3 && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Informações Adicionais</h2>
              <p className="text-slate-600">Ajude-nos a priorizar e direcionar seu chamado</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              {/* Prioridade */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <label className="block text-lg font-bold text-slate-900 mb-6">
                  Qual a urgência? *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => setPriority('baixa')} 
                    className={`p-6 rounded-2xl border-3 transition-all ${
                      priority === 'baixa' 
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-105' 
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">🟢</div>
                    <div className="font-bold text-lg">Baixa</div>
                    <p className="text-xs text-slate-600 mt-1">Pode aguardar</p>
                  </button>
                  
                  <button 
                    onClick={() => setPriority('media')} 
                    className={`p-6 rounded-2xl border-3 transition-all ${
                      priority === 'media' 
                        ? 'border-amber-500 bg-amber-50 shadow-lg scale-105' 
                        : 'border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">🟡</div>
                    <div className="font-bold text-lg">Média</div>
                    <p className="text-xs text-slate-600 mt-1">Normal</p>
                  </button>
                  
                  <button 
                    onClick={() => setPriority('alta')} 
                    className={`p-6 rounded-2xl border-3 transition-all ${
                      priority === 'alta' 
                        ? 'border-red-500 bg-red-50 shadow-lg scale-105' 
                        : 'border-slate-200 hover:border-red-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">🔴</div>
                    <div className="font-bold text-lg">Alta</div>
                    <p className="text-xs text-slate-600 mt-1">Urgente</p>
                  </button>
                </div>
              </div>

              {/* Equipamento */}
              {equipments.length > 0 && (
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  <label className="block text-lg font-bold text-slate-900 mb-4">
                    Equipamento Relacionado (Opcional)
                  </label>
                  <select 
                    value={equipmentId} 
                    onChange={(e) => setEquipmentId(e.target.value)} 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg"
                  >
                    <option value="">Nenhum equipamento específico</option>
                    {equipments.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name} - {eq.type}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setStep(4)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Continuar</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Fotos e Confirmação */}
        {step === 4 && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Adicionar Fotos</h2>
              <p className="text-slate-600">Fotos ajudam nossa equipe a entender melhor o problema</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              {/* Upload */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <label className="flex flex-col items-center justify-center h-40 border-3 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group">
                    <Camera className="w-12 h-12 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-slate-700">Tirar Foto</span>
                    <span className="text-sm text-slate-500">Câmera</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      multiple 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>

                  <label className="flex flex-col items-center justify-center h-40 border-3 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all group">
                    <ImageIcon className="w-12 h-12 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-slate-700">Galeria</span>
                    <span className="text-sm text-slate-500">Escolher fotos</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative group">
                        <img 
                          src={photo} 
                          className="w-full h-24 object-cover rounded-xl border-2 border-slate-200" 
                          alt={`Foto ${i + 1}`} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} 
                          className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumo */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-200">
                <h3 className="font-bold text-xl text-slate-900 mb-4">Resumo do Chamado</h3>
                <div className="space-y-3 text-slate-700">
                  <p><strong>Título:</strong> {title}</p>
                  <p><strong>Prioridade:</strong> {priority === 'baixa' ? '🟢 Baixa' : priority === 'media' ? '🟡 Média' : '🔴 Alta'}</p>
                  {photos.length > 0 && <p><strong>Fotos:</strong> {photos.length} anexada(s)</p>}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Criando...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    <span>Criar Chamado</span>
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
