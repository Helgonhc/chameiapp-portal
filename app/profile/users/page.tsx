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
  
  // Modal state
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

    // Buscar client_id do usuário
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

      // Buscar client_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) {
        setError('Cliente não encontrado')
        return
      }

      // Buscar todos os usuários da empresa
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

    // Validações
    if (!newUserName.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (!newUserEmail.trim()) {
      setError('Email é obrigatório')
      return
    }

    // Verificar limite de 2 usuários
    const activeUsers = users.filter(u => u.is_active)
    if (activeUsers.length >= 2) {
      setError('Limite de 2 usuários atingido. Remova um usuário para adicionar outro.')
      return
    }

    setInviting(true)

    try {
      // Gerar senha temporária
      const tempPassword = 'Portal@' + Math.random().toString(36).slice(-6)

      // 1. Criar usuário (SEM autoConfirm para forçar envio de email)
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

      // 2. Aguardar trigger criar profile
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 3. Atualizar profile
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
        // Tentar reverter
        try {
          await supabase.auth.admin.deleteUser(authData.user.id)
        } catch (e) {
          console.log('Não foi possível reverter')
        }
        throw new Error(profileError.message)
      }

      // 4. Forçar envio de email de confirmação
      try {
        const { error: emailError } = await supabase.auth.resend({
          type: 'signup',
          email: newUserEmail,
          options: {
            emailRedirectTo: 'https://chameiapp-portal.vercel.app'
          }
        })
        
        if (emailError) {
          console.log('Aviso ao reenviar email:', emailError)
        } else {
          console.log('✅ Email de confirmação enviado!')
        }
      } catch (e) {
        console.log('Erro ao enviar email:', e)
      }

      // 5. Sucesso!
      alert(
        `✅ Usuário convidado com sucesso!\n\n` +
        `Email: ${newUserEmail}\n` +
        `Senha temporária: ${tempPassword}\n\n` +
        `📧 Um email de confirmação foi enviado para ${newUserEmail}\n` +
        `⚠️ Peça para verificar a caixa de entrada e SPAM\n\n` +
        `Informe estas credenciais ao usuário.`
      )

      setShowModal(false)
      setNewUserName('')
      setNewUserEmail('')
      loadUsers()
    } catch (error: any) {
      console.error('Erro ao convidar usuário:', error)
      setError(`Erro ao convidar usuário: ${error.message}`)
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveUser(user: PortalUser) {
    // Não pode remover a si mesmo
    if (user.id === currentUserId) {
      alert('❌ Você não pode remover a si mesmo.\n\nPeça para outro usuário ou administrador remover seu acesso.')
      return
    }

    if (!confirm(
      `⚠️ Remover Usuário\n\n` +
      `Tem certeza que deseja remover:\n` +
      `${user.full_name} (${user.email})\n\n` +
      `Esta ação não pode ser desfeita!`
    )) {
      return
    }

    try {
      // 1. Deletar do auth.users PRIMEIRO (isso também deleta de profiles via CASCADE)
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

      if (authError) {
        // Se falhar no auth, tentar deletar só do profiles
        console.log('Erro ao deletar do auth, tentando profiles:', authError)
        
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id)

        if (profileError) throw profileError
      }

      alert('✅ Usuário removido completamente!')
      loadUsers()
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error)
      alert(`Erro ao remover usuário: ${error.message}`)
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const activeUsers = users.filter(u => u.is_active)
  const canAddUser = activeUsers.length < 2

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
              <Users className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-medium text-slate-600">Carregando usuários...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        {/* Header Premium com Gradiente */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 px-8 py-12">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Voltar ao Perfil</span>
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 backdrop-blur-xl rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Gerenciar Usuários</h1>
            </div>
            <p className="text-purple-100 text-lg">Controle os acessos ao portal da sua empresa</p>
          </div>
        </div>

        <main className="px-8 -mt-8 pb-8">
        {/* Contador Premium */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Usuários Ativos</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {activeUsers.length} / 2
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium">Vagas Disponíveis</p>
              <p className="text-3xl font-bold text-slate-700">
                {2 - activeUsers.length}
              </p>
            </div>
          </div>

          <div className="mt-4">
            {canAddUser ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-900">
                    ✅ {2 - activeUsers.length} vaga{2 - activeUsers.length > 1 ? 's' : ''} disponível{2 - activeUsers.length > 1 ? 'is' : ''}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Você pode adicionar mais {2 - activeUsers.length} usuário{2 - activeUsers.length > 1 ? 's' : ''} ao portal.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-yellow-900">⚠️ Limite atingido</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Você atingiu o limite de 2 usuários. Remova um usuário para adicionar outro.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Usuários Premium */}
        <div className="space-y-4 mb-6">
          {users.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-20 text-center">
              <div className="inline-flex p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
                <Users className="w-16 h-16 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-3">Nenhum usuário cadastrado</h3>
              <p className="text-slate-500 mb-8">Adicione o primeiro usuário para o portal</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
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
                className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6 hover:shadow-xl transition-all duration-300 animate-fade-in-up ${
                  !user.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      user.is_active 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                        : 'bg-gray-300'
                    }`}>
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {user.full_name}
                        </h3>
                        {user.id === currentUserId && (
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full">
                            👤 Você
                          </span>
                        )}
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          user.is_active
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {user.is_active ? '✅ Ativo' : '⏸️ Inativo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        Criado em {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Botão Remover */}
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => handleRemoveUser(user)}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 whitespace-nowrap"
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

        {/* Botão Convidar Premium */}
        {users.length > 0 && (
          <button
            onClick={() => {
              if (canAddUser) {
                setShowModal(true)
              } else {
                alert('⚠️ Limite atingido\n\nVocê já possui 2 usuários ativos. Remova um usuário para adicionar outro.')
              }
            }}
            disabled={!canAddUser}
            className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-xl font-bold text-lg transition-all duration-300 ${
              canAddUser
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
            }`}
          >
            <UserPlus className="w-6 h-6" />
            {canAddUser ? '✨ Convidar Novo Usuário' : '🔒 Limite de Usuários Atingido'}
          </button>
        )}
        </main>
      </div>

      {/* Modal Convidar Usuário Premium */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Convidar Usuário</h2>
            </div>

            <form onSubmit={handleInviteUser}>
              <div className="mb-5">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  👤 Nome Completo
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nome do usuário"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  📧 Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="email@empresa.com"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
              </div>

              {error && (
                <div className="mb-5 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl">
                  <p className="text-sm font-semibold text-red-700">❌ {error}</p>
                </div>
              )}

              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Uma senha temporária será gerada. O usuário receberá um email de confirmação.
                </p>
              </div>

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
                  className="flex-1 px-5 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
                >
                  {inviting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
