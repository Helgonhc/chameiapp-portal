'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Mail, Phone, MapPin, Building2, Save, Eye, EyeOff, Bell, Shield, Users, Sparkles, Crown, Camera, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface ProfileData {
  id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  client_id?: string
  client?: {
    name: string
    address?: string
    responsible_name?: string
    client_logo_url?: string
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkAuth()
    loadProfile()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select(`
          *,
          client:clients(name, address, responsible_name)
        `)
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(profileData)
      setFullName(profileData.full_name || '')
      setEmail(user.email || '')
      setPhone(profileData.phone || '')
      setAvatarUrl(profileData.avatar_url || '')
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione uma imagem' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter no máximo 2MB' })
      return
    }

    setUploadingAvatar(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('os-photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('os-photos').getPublicUrl(filePath)

      // Atualizar profile com nova URL
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)

      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: '✅ Foto atualizada com sucesso!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro ao enviar foto: ' + error.message })
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Atualizar email se mudou
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email.trim()
        })
        if (emailError) throw emailError
      }

      // Atualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          avatar_url: avatarUrl || null
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: '✅ Perfil atualizado com sucesso!' + (email !== user.email ? ' Verifique seu novo email para confirmar.' : '') })
      await loadProfile()
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro ao atualizar perfil: ${error.message}` })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    setMessage(null)

    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Preencha a nova senha e confirmação' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres' })
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: '✅ Senha alterada com sucesso!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro ao alterar senha: ${error.message}` })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
              <User className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-medium text-slate-600">Carregando perfil...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Premium com Gradiente */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-12">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 backdrop-blur-xl rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Meu Perfil</h1>
            </div>
            <p className="text-indigo-100 text-lg">Gerencie suas informações e configurações</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-8 pb-8">
        {/* Mensagem de Feedback Premium */}
        {message && (
          <div className={`mb-6 p-5 rounded-2xl border-l-4 shadow-lg backdrop-blur-xl ${
            message.type === 'success' 
              ? 'bg-emerald-50/80 border-emerald-500 text-emerald-800' 
              : 'bg-red-50/80 border-red-500 text-red-800'
          }`}>
            <p className="font-semibold flex items-center gap-2">
              {message.type === 'success' ? '✅' : '❌'}
              {message.text}
            </p>
          </div>
        )}

        {/* Gerenciar Usuários Premium */}
        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 mb-6 overflow-hidden hover:shadow-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl blur opacity-50"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  Usuários do Portal
                  <Crown className="w-5 h-5 text-yellow-500" />
                </h2>
                <p className="text-sm text-slate-500">Gerencie até 2 usuários da sua empresa</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/profile/users')}
            className="relative w-full group/btn px-6 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-center gap-3">
              <Users className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
              <span>👥 Gerenciar Usuários</span>
              <Sparkles className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
            </div>
          </button>
        </div>

        {/* Informações da Empresa */}
        {profile?.client && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Empresa</h2>
                <p className="text-sm text-slate-500">Informações da sua empresa</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900">
                  {profile.client.name}
                </div>
              </div>

              {profile.client.responsible_name && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                  <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900">
                    {profile.client.responsible_name}
                  </div>
                </div>
              )}

              {profile.client.address && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                  <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900">
                    {profile.client.address}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informações Pessoais */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Informações Pessoais</h2>
              <p className="text-sm text-slate-500">Atualize seus dados pessoais</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Foto de Perfil */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-slate-400 w-8 h-8" />
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {uploadingAvatar ? 'Enviando...' : 'Alterar Foto'}
                </button>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG. Máximo 2MB.</p>
                {avatarUrl && (
                  <button
                    onClick={() => setAvatarUrl('')}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Se alterar o email, você receberá um link de confirmação</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full group relative px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative flex items-center justify-center gap-2">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Alterar Senha */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Segurança</h2>
              <p className="text-sm text-slate-500">Altere sua senha de acesso</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nova Senha *
              </label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Digite a senha novamente"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={saving || !newPassword || !confirmPassword}
              className="w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-semibold hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              {saving ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
