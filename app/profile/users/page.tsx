'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, UserPlus, Trash2, User, Mail, Calendar, AlertCircle, Users } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface PortalUser {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
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
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
    loadUsers()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('id', user.id)
      .single()

    if (profile?.client_id) {
      setClientId(profile.client_id)
    }
  }

  async function loadUsers() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) {
        setError('Cliente não encontrado')
        return
      }

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('client_id', profile.client_id)
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError
      setUsers(usersData || [])
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error)
      setError('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  async function handleInviteUser(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!newUserName.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (!newUserEmail.trim()) {
      setError('Email é obrigatório')
      return
    }

    const activeUsers = users.filter(u => u.is_active)
    if (activeUsers.length >= 2) {
      setError('Limite de 2 usuários atingido')
      return
    }

    setInviting(true)

    try {
      const tempPassword = 'Portal@' + Math.random().toString(36).slice(-6)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: tempPassword,
        options: {
          emailRedirectTo: 'https://chameiapp-portal.vercel.app',
          data: {
            full_name: newUserName,
            role: 'client'
          }
        }
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error('Usuário não foi criado')

      await new Promise(resolve => setTimeout(resolve, 1000))

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: newUserEmail,
          full_name: newUserName,
          role: 'client',
          client_id: clientId,
          is_active: true
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Erro ao atualizar profile:', profileError)
        try {
          await supabase.auth.admin.deleteUser(authData.user.id)
        } catch (e) {
          console.log('Não foi possível reverter')
        }
        throw new Error(profileError.message)
      }

      alert(`Usuário convidado!\nEmail: ${newUserEmail}\nSenha: ${tempPassword}`)

      setShowModal(false)
      setNewUserName('')
      setNewUserEmail('')
      loadUsers()
    } catch (error: any) {
      console.error('Erro ao convidar usuário:', error)
      setError(`Erro: ${error.message}`)
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveUser(user: PortalUser) {
    if (user.id === currentUserId) {
      alert('Você não pode remover a si mesmo')
      return
    }

    if (!confirm(`Remover ${user.full_name}?`)) {
      return
    }

    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

      if (authError) {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id)

        if (profileError) throw profileError
      }

      alert('Usuário removido!')
      loadUsers()
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const activeUsers = users.filter(u => u.is_active)
  const canAddUser = activeUsers.length < 2

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
              <Users className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-600 font-medium">Carregando usuários...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header Premium */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 px-8 py-12 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-6xl mx-auto">
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar ao Perfil</span>
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 backdrop-blur-xl rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Gerenciar Usuários</h1>
            </div>
            <p className="text-purple-100 text-lg">Gerencie os usuários da sua empresa (máximo 2)</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 -mt-8 pb-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Usuários Ativos</p>
                  <p className="text-4xl font-bold text-slate-900">{activeUsers.length} / 2</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Vagas Disponíveis</p>
                  <p className="text-4xl font-bold text-slate-900">{2 - activeUsers.length}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Usuários */}
          <div className="space-y-4 mb-6">
            {users.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-20 text-center">
                <div className="inline-flex p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
                  <Users className="w-16 h-16 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-3">Nenhum usuário</h3>
                <p className="text-slate-500 mb-8">Adicione o primeiro usuário da sua empresa</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
                >
                  <UserPlus className="w-5 h-5" />
                  Convidar Usuário
                </button>
              </div>
            ) : (
              users.map((user, index) => (
                <div
                  key={user.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full blur opacity-50"></div>
                        <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-xl font-bold text-slate-900">{user.full_name}</h3>
                          {user.id === currentUserId && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                              Você
                            </span>
                          )}
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          <span>Criado em {formatDate(user.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleRemoveUser(user)}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Botão Adicionar */}
          {users.length > 0 && (
            <button
              onClick={() => canAddUser ? setShowModal(true) : alert('Limite atingido')}
              disabled={!canAddUser}
              className={`w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-bold text-lg transition-all duration-300 ${
                canAddUser
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-2xl hover:shadow-purple-500/50'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <UserPlus className="w-6 h-6" />
              {canAddUser ? 'Convidar Novo Usuário' : 'Limite de 2 Usuários Atingido'}
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Convidar Usuário</h2>
            </div>

            <form onSubmit={handleInviteUser}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Nome do usuário"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setNewUserName('')
                    setNewUserEmail('')
                    setError('')
                  }}
                  disabled={inviting}
                  className="flex-1 px-5 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 disabled:opacity-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 transition-all"
                >
                  {inviting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Convidar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
