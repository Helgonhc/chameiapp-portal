'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, UserPlus, Trash2, User, Mail, Calendar, AlertCircle, Users, Sparkles, Crown, CheckCircle, Shield } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface PortalUser {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
  permissions?: {
    can_view_financial: boolean
    can_open_tickets: boolean
    can_approve_maintenance: boolean
  }
}

export default function ManageUsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<PortalUser[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [clientId, setClientId] = useState<string>('')

  const [showModal, setShowModal] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [permissions, setPermissions] = useState({
    can_view_financial: true,
    can_open_tickets: true,
    can_approve_maintenance: true
  })

  const [error, setError] = useState('')

  useEffect(() => { checkAuth(); loadUsers() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setCurrentUserId(user.id)
    const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
    if (profile?.client_id) setClientId(profile.client_id)
  }

  async function loadUsers() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
      if (!profile?.client_id) { setError('Cliente não encontrado'); return }
      const { data: usersData, error: usersError } = await supabase.from('profiles').select('*').eq('client_id', profile.client_id).eq('role', 'client').order('created_at', { ascending: false })
      if (usersError) throw usersError
      setUsers(usersData || [])
    } catch (error: any) { setError('Erro ao carregar usuários') }
    finally { setLoading(false) }
  }

  async function handleInviteUser(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!newUserName.trim()) { setError('Nome é obrigatório'); return }
    if (!newUserEmail.trim()) { setError('Email é obrigatório'); return }
    const activeUsers = users.filter(u => u.is_active)
    if (activeUsers.length >= 2) { setError('Limite de 2 usuários atingido'); return }
    setInviting(true)
    try {
      const { data: currentSession } = await supabase.auth.getSession()
      const tempPassword = 'Portal@' + Math.random().toString(36).slice(-6)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: tempPassword,
        options: { emailRedirectTo: 'https://chameiapp-portal.vercel.app/login', data: { full_name: newUserName, role: 'client' } }
      })
      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error('Usuário não foi criado')

      const updateData = {
        email: newUserEmail,
        full_name: newUserName,
        role: 'client',
        client_id: clientId,
        is_active: true,
        permissions: permissions
      }

      const { error: insertError } = await supabase.from('profiles').insert({ id: authData.user.id, ...updateData })
      if (insertError) {
        // If profile exists (maybe invite resent), update it
        await supabase.from('profiles').update(updateData).eq('id', authData.user.id)
      }

      if (currentSession?.session) await supabase.auth.setSession(currentSession.session)

      alert(`✅ Usuário convidado!\n\nEmail: ${newUserEmail}\nSenha: ${tempPassword}\n\nO usuário receberá um email de confirmação.`)
      setShowModal(false); setNewUserName(''); setNewUserEmail(''); setPermissions({ can_view_financial: true, can_open_tickets: true, can_approve_maintenance: true })
      loadUsers()
    } catch (error: any) {
      setError(`Erro: ${error.message}`)
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session) router.push('/login')
    } finally { setInviting(false) }
  }

  async function handleRemoveUser(user: PortalUser) {
    if (user.id === currentUserId) { alert('Você não pode remover a si mesmo'); return }
    if (!confirm(`Remover ${user.full_name}?`)) return
    try {
      await supabase.from('profiles').delete().eq('id', user.id)
      alert('✅ Usuário removido!')
      loadUsers()
    } catch (error: any) { alert(`Erro: ${error.message}`) }
  }

  const activeUsers = users.filter(u => u.is_active)
  const canAddUser = activeUsers.length < 2

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Carregando usuários...</p>
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
          <div className="max-w-6xl mx-auto relative">
            <button onClick={() => router.push('/profile')} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5" /> Voltar ao Perfil
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
                <Users className="w-7 h-7 text-dark-900" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">Gerenciar Usuários <Crown className="w-6 h-6 text-accent-400" /></h1>
                <p className="text-zinc-400">Gerencie os usuários da sua empresa (máximo 2)</p>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Usuários Ativos</p>
                  <p className="text-4xl font-bold text-white">{activeUsers.length} <span className="text-lg text-zinc-500">/ 2</span></p>
                </div>
                <div className="w-14 h-14 bg-success-500/20 rounded-xl flex items-center justify-center border border-success-500/30">
                  <CheckCircle className="w-7 h-7 text-success-400" />
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Vagas Disponíveis</p>
                  <p className="text-4xl font-bold text-white">{2 - activeUsers.length}</p>
                </div>
                <div className="w-14 h-14 bg-primary-500/20 rounded-xl flex items-center justify-center border border-primary-500/30">
                  <UserPlus className="w-7 h-7 text-primary-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-4 mb-6">
            {users.length === 0 ? (
              <div className="empty-state">
                <div className="w-20 h-20 bg-accent-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent-500/20">
                  <Users className="w-10 h-10 text-accent-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Nenhum usuário</h3>
                <p className="text-zinc-400 mb-8">Adicione o primeiro usuário da sua empresa</p>
                <button onClick={() => setShowModal(true)} className="btn-accent inline-flex items-center gap-2">
                  <UserPlus className="w-5 h-5" /> Convidar Usuário
                </button>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="list-item">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center border border-white/10 shrink-0">
                        <User className="w-7 h-7 text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white">{user.full_name}</h3>
                          {user.id === currentUserId && <span className="badge badge-primary">Você</span>}
                          <span className={`badge ${user.is_active ? 'badge-success' : 'badge-neutral'}`}>{user.is_active ? 'Ativo' : 'Inativo'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                          <Mail className="w-4 h-4" /> {user.email}
                        </div>

                        {/* Display Permissions */}
                        {user.permissions && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {user.permissions.can_view_financial && <span className="text-xs px-2 py-1 bg-white/5 rounded border border-white/10 text-zinc-300">💰 Financeiro</span>}
                            {user.permissions.can_open_tickets && <span className="text-xs px-2 py-1 bg-white/5 rounded border border-white/10 text-zinc-300">🎫 Chamados</span>}
                            {user.permissions.can_approve_maintenance && <span className="text-xs px-2 py-1 bg-white/5 rounded border border-white/10 text-zinc-300">🛠️ Manutenção</span>}
                          </div>
                        )}

                      </div>
                    </div>
                    {user.id !== currentUserId && (
                      <button onClick={() => handleRemoveUser(user)} className="btn-danger flex items-center gap-2 text-sm">
                        <Trash2 className="w-4 h-4" /> Remover
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add User Button */}
          {users.length > 0 && (
            <button onClick={() => canAddUser ? setShowModal(true) : alert('Limite atingido')} disabled={!canAddUser} className={`w-full flex items-center justify-center gap-3 py-5 rounded-xl font-bold text-lg transition-all ${canAddUser ? 'btn-accent' : 'bg-surface-light text-zinc-500 cursor-not-allowed border border-white/5'}`}>
              <UserPlus className="w-6 h-6" />
              {canAddUser ? 'Convidar Novo Usuário' : 'Limite de 2 Usuários Atingido'}
            </button>
          )}
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
                <UserPlus className="w-6 h-6 text-dark-900" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Convidar Usuário</h2>
                <p className="text-sm text-zinc-400">Adicione um novo usuário ao portal</p>
              </div>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-5">
              <div>
                <label className="form-label">Nome Completo *</label>
                <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Nome do usuário" className="form-input" required />
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="email@empresa.com" className="form-input" required />
              </div>

              <div className="bg-surface-light p-4 rounded-xl border border-white/5">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Permissões de Acesso</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissions.can_view_financial} onChange={e => setPermissions({ ...permissions, can_view_financial: e.target.checked })} className="rounded border-gray-600 bg-surface text-accent-500 focus:ring-accent-500" />
                    <span className="text-sm text-zinc-300">Ver Orçamentos e Valores</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissions.can_open_tickets} onChange={e => setPermissions({ ...permissions, can_open_tickets: e.target.checked })} className="rounded border-gray-600 bg-surface text-accent-500 focus:ring-accent-500" />
                    <span className="text-sm text-zinc-300">Abrir e Gerenciar Chamados</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissions.can_approve_maintenance} onChange={e => setPermissions({ ...permissions, can_approve_maintenance: e.target.checked })} className="rounded border-gray-600 bg-surface text-accent-500 focus:ring-accent-500" />
                    <span className="text-sm text-zinc-300">Aprovar Manutenções</span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="info-box info-box-red flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setNewUserName(''); setNewUserEmail(''); setError('') }} disabled={inviting} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={inviting} className="btn-accent flex-1 flex items-center justify-center gap-2">
                  {inviting ? <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" /> : <><UserPlus className="w-5 h-5" /> Convidar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
