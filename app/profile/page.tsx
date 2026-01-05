'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Mail, Phone, Building2, Save, Eye, EyeOff, Shield, Users, Sparkles, Crown, Camera, Loader2 } from 'lucide-react'
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
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { checkAuth(); loadProfile() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profileData, error } = await supabase.from('profiles').select(`*, client:clients(name, address, responsible_name)`).eq('id', user.id).single()
      if (error) throw error
      setProfile(profileData)
      setFullName(profileData.full_name || '')
      setEmail(user.email || '')
      setPhone(profileData.phone || '')
      setAvatarUrl(profileData.avatar_url || '')
    } catch (error) { console.error('Erro:', error) }
    finally { setLoading(false) }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setMessage({ type: 'error', text: 'Selecione uma imagem' }); return }
    if (file.size > 2 * 1024 * 1024) { setMessage({ type: 'error', text: 'Máximo 2MB' }); return }
    setUploadingAvatar(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      const fileName = `avatars/avatar-${user.id}-${Date.now()}.${file.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from('os-photos').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('os-photos').getPublicUrl(fileName)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: '✅ Foto atualizada!' })
    } catch (error: any) { setMessage({ type: 'error', text: error.message }) }
    finally { setUploadingAvatar(false) }
  }

  async function handleSaveProfile() {
    setSaving(true); setMessage(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      if (email !== user.email) await supabase.auth.updateUser({ email: email.trim() })
      await supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.trim() || null, avatar_url: avatarUrl || null }).eq('id', user.id)
      setMessage({ type: 'success', text: '✅ Perfil atualizado!' })
      await loadProfile()
    } catch (error: any) { setMessage({ type: 'error', text: error.message }) }
    finally { setSaving(false) }
  }

  async function handleChangePassword() {
    setMessage(null)
    if (!newPassword || !confirmPassword) { setMessage({ type: 'error', text: 'Preencha os campos' }); return }
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: 'Senhas não coincidem' }); return }
    if (newPassword.length < 6) { setMessage({ type: 'error', text: 'Mínimo 6 caracteres' }); return }
    setSaving(true)
    try {
      await supabase.auth.updateUser({ password: newPassword })
      setMessage({ type: 'success', text: '✅ Senha alterada!' })
      setNewPassword(''); setConfirmPassword('')
    } catch (error: any) { setMessage({ type: 'error', text: error.message }) }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Carregando perfil...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="page-header">
          <div className="max-w-4xl mx-auto relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">Meu Perfil <Sparkles className="w-5 h-5 text-accent-400" /></h1>
                <p className="text-zinc-400">Gerencie suas informações</p>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {message && <div className={`info-box ${message.type === 'success' ? 'info-box-green' : 'info-box-red'}`}><p className="font-medium">{message.text}</p></div>}

          {/* Gerenciar Usuários */}
          <div className="card p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
                <Users className="w-7 h-7 text-dark-900" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">Usuários do Portal <Crown className="w-5 h-5 text-accent-400" /></h2>
                <p className="text-sm text-zinc-400">Gerencie até 2 usuários</p>
              </div>
            </div>
            <button onClick={() => router.push('/profile/users')} className="btn-accent w-full flex items-center justify-center gap-3 text-lg py-4">
              <Users className="w-6 h-6" /> 👥 Gerenciar Usuários <Sparkles className="w-5 h-5" />
            </button>
          </div>

          {/* Empresa */}
          {profile?.client && (
            <div className="card p-6 lg:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div><h2 className="text-xl font-bold text-white">Empresa</h2><p className="text-sm text-zinc-400">Informações da empresa</p></div>
              </div>
              <div className="space-y-4">
                <div><label className="form-label">Nome</label><div className="px-4 py-3 bg-surface-light border border-white/10 rounded-xl text-white">{profile.client.name}</div></div>
                {profile.client.responsible_name && <div><label className="form-label">Responsável</label><div className="px-4 py-3 bg-surface-light border border-white/10 rounded-xl text-white">{profile.client.responsible_name}</div></div>}
                {profile.client.address && <div><label className="form-label">Endereço</label><div className="px-4 py-3 bg-surface-light border border-white/10 rounded-xl text-white">{profile.client.address}</div></div>}
              </div>
            </div>
          )}

          {/* Informações Pessoais */}
          <div className="card p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <User className="w-6 h-6 text-white" />
              </div>
              <div><h2 className="text-xl font-bold text-white">Informações Pessoais</h2><p className="text-sm text-zinc-400">Atualize seus dados</p></div>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-white/10">
                <div className="w-20 h-20 rounded-full border-2 border-white/20 overflow-hidden bg-surface-light flex items-center justify-center">
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User className="text-zinc-500 w-8 h-8" />}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <div>
                  <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="btn-secondary flex items-center gap-2 text-sm">
                    {uploadingAvatar ? <Loader2 className="animate-spin w-4 h-4" /> : <Camera className="w-4 h-4" />} {uploadingAvatar ? 'Enviando...' : 'Alterar Foto'}
                  </button>
                  <p className="text-xs text-zinc-500 mt-1">JPG, PNG. Máx 2MB</p>
                  {avatarUrl && <button onClick={() => setAvatarUrl('')} className="text-xs text-danger-400 hover:underline">Remover</button>}
                </div>
              </div>
              <div><label className="form-label">Nome Completo *</label><div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" /><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="form-input pl-12" placeholder="Seu nome" /></div></div>
              <div><label className="form-label">Email *</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input pl-12" placeholder="seu@email.com" /></div></div>
              <div><label className="form-label">Telefone</label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" /><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input pl-12" placeholder="(00) 00000-0000" /></div></div>
              <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</> : <><Save className="w-5 h-5" /> Salvar Alterações</>}
              </button>
            </div>
          </div>

          {/* Segurança */}
          <div className="card p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-lg shadow-warning-500/30">
                <Shield className="w-6 h-6 text-dark-900" />
              </div>
              <div><h2 className="text-xl font-bold text-white">Segurança</h2><p className="text-sm text-zinc-400">Altere sua senha</p></div>
            </div>
            <div className="space-y-5">
              <div><label className="form-label">Nova Senha *</label><div className="relative"><Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" /><input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input pl-12 pr-12" placeholder="Mínimo 6 caracteres" /><button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">{showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
              <div><label className="form-label">Confirmar Senha *</label><div className="relative"><Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" /><input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input pl-12 pr-12" placeholder="Repita a senha" /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
              <button onClick={handleChangePassword} disabled={saving || !newPassword || !confirmPassword} className="btn-secondary w-full border-warning-500/30 hover:border-warning-500/50 hover:bg-warning-500/10">{saving ? 'Alterando...' : 'Alterar Senha'}</button>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
