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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-600 mt-2">Gerencie os usuários da sua empresa (máximo 2)</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{activeUsers.length} / 2</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vagas Disponíveis</p>
              <p className="text-2xl font-bold text-gray-900">{2 - activeUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {users.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário</h3>
              <p className="text-gray-600 mb-6">Adicione o primeiro usuário</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus className="w-5 h-5" />
                Convidar Usuário
              </button>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                        {user.id === currentUserId && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            Você
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        Criado em {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => handleRemoveUser(user)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

        {users.length > 0 && (
          <button
            onClick={() => canAddUser ? setShowModal(true) : alert('Limite atingido')}
            disabled={!canAddUser}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium ${
              canAddUser
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            {canAddUser ? 'Convidar Novo Usuário' : 'Limite Atingido'}
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Convidar Usuário</h2>

            <form onSubmit={handleInviteUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nome do usuário"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="email@empresa.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
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
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
