'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle, Search, Loader2, Building2, User, Camera, Upload, X } from 'lucide-react'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form fields
  const [type, setType] = useState<'PF' | 'PJ'>('PJ')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  
  // Logo/Foto
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  
  // Documento
  const [cnpjCpf, setCnpjCpf] = useState('')
  const [ieRg, setIeRg] = useState('')
  
  // Endereço completo
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  // Upload de logo/foto
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Criar preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `clients/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('os-photos')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data } = supabase.storage
        .from('os-photos')
        .getPublicUrl(fileName)

      setLogoUrl(data.publicUrl)
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      setError('Erro ao fazer upload da imagem. Tente novamente.')
      setLogoPreview('')
    } finally {
      setUploading(false)
    }
  }

  // Remover logo/foto
  function handleRemoveImage() {
    setLogoUrl('')
    setLogoPreview('')
  }

  // Buscar dados do CNPJ
  async function handleCnpjBlur() {
    if (type === 'PF') return
    
    const cleanCnpj = cnpjCpf.replace(/\D/g, '')
    if (cleanCnpj.length !== 14) return

    setCnpjLoading(true)
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`)
      const data = await response.json()

      if (!data.message) {
        setCompanyName(data.razao_social || data.nome_fantasia)
        if (data.ddd_telefone_1) setPhone(`(${data.ddd_telefone_1}) ${data.telefone_1}`)
        if (data.email) setEmail(data.email)
        
        // Endereço
        if (data.cep) setCep(data.cep.replace(/\D/g, ''))
        if (data.logradouro) setStreet(data.logradouro)
        if (data.numero) setNumber(data.numero)
        if (data.complemento) setComplement(data.complemento)
        if (data.bairro) setNeighborhood(data.bairro)
        if (data.municipio) setCity(data.municipio)
        if (data.uf) setState(data.uf)
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error)
    } finally {
      setCnpjLoading(false)
    }
  }

  // Buscar endereço pelo CEP
  async function handleCepBlur() {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setCepLoading(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        setStreet(data.logradouro || '')
        setNeighborhood(data.bairro || '')
        setCity(data.localidade || '')
        setState(data.uf || '')
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    } finally {
      setCepLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validações
      if (!fullName.trim()) throw new Error('Nome completo é obrigatório')
      if (!email.trim()) throw new Error('Email é obrigatório')
      if (!password) throw new Error('Senha é obrigatória')
      if (password.length < 6) throw new Error('Senha deve ter no mínimo 6 caracteres')
      if (password !== confirmPassword) throw new Error('As senhas não coincidem')
      if (!phone.trim()) throw new Error('Telefone é obrigatório')

      // 1. Criar usuário no Supabase Auth (SEM fazer login automático)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: fullName.trim(),
            phone: phone.trim()
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      // 2. Aguardar um pouco para o trigger criar o profile
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 3. Criar cliente na carteira (ANTES do logout para ter permissão)
      const fullAddress = street && city 
        ? `${street}, ${number} - ${neighborhood}, ${city}/${state}${cep ? ` - CEP ${cep}` : ''}`
        : ''

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: companyName.trim() || fullName.trim(),
          responsible_name: type === 'PJ' ? fullName.trim() : null,
          email: email.trim(),
          phone: phone.trim(),
          cnpj_cpf: cnpjCpf.trim() || null,
          ie_rg: ieRg.trim() || null,
          type: type,
          client_logo_url: logoUrl || null,
          zip_code: cep.trim() || null,
          street: street.trim() || null,
          number: number.trim() || null,
          complement: complement.trim() || null,
          neighborhood: neighborhood.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          address: fullAddress || null,
          portal_enabled: true,
          portal_blocked: false
        })
        .select()
        .single()

      if (clientError) {
        console.error('Erro ao criar cliente:', clientError)
        throw new Error('Erro ao criar cliente na carteira')
      }

      // 5. Atualizar profile com client_id
      // O trigger já deve ter vinculado, mas vamos garantir
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          role: 'client',
          client_id: clientData.id,
          phone: phone.trim()
        })
        .eq('id', authData.user.id)

      // Se falhar, não é crítico - o trigger deve ter feito
      if (profileError) {
        console.error('Aviso ao atualizar profile:', profileError)
        // Não lançar erro - o trigger deve ter vinculado automaticamente
      }

      // 6. FAZER LOGOUT AGORA (depois de criar tudo)
      await supabase.auth.signOut()

      setSuccess(true)
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      setError(error.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta Criada com Sucesso!</h2>
          <p className="text-gray-600 mb-2">
            Sua conta foi criada e está pronta para uso.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 font-medium mb-1">
              📧 Próximo passo:
            </p>
            <p className="text-sm text-blue-700">
              Faça login com seu email e senha para acessar o portal.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Redirecionando para o login em 3 segundos...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Criar Conta</h1>
            <p className="text-gray-600 mt-2">Preencha seus dados para acessar o portal</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Tipo de Pessoa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Cadastro *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('PF')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    type === 'PF'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Pessoa Física</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('PJ')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    type === 'PJ'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="font-medium">Pessoa Jurídica</span>
                </button>
              </div>
            </div>

            {/* Upload de Logo/Foto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {type === 'PJ' ? 'Logo da Empresa' : 'Foto de Perfil'} (opcional)
              </label>
              <div className="flex items-center gap-4">
                {/* Preview da Imagem */}
                <div className="relative">
                  {logoPreview || logoUrl ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100">
                      <Image
                        src={logoPreview || logoUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Botão de Upload */}
                <div className="flex-1">
                  <label
                    htmlFor="logo-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Escolher Imagem</span>
                      </>
                    )}
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG ou JPEG. Máximo 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* CNPJ/CPF e IE/RG */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cnpjCpf" className="block text-sm font-medium text-gray-700 mb-2">
                  {type === 'PJ' ? 'CNPJ (Busca Automática)' : 'CPF'} *
                </label>
                <div className="relative">
                  <input
                    id="cnpjCpf"
                    type="text"
                    value={cnpjCpf}
                    onChange={(e) => setCnpjCpf(e.target.value)}
                    onBlur={handleCnpjBlur}
                    required
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={type === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                  />
                  {cnpjLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>
                  )}
                  {!cnpjLoading && type === 'PJ' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Search className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="ieRg" className="block text-sm font-medium text-gray-700 mb-2">
                  {type === 'PJ' ? 'IE' : 'RG'}
                </label>
                <input
                  id="ieRg"
                  type="text"
                  value={ieRg}
                  onChange={(e) => setIeRg(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={type === 'PJ' ? 'Inscrição Estadual' : 'RG'}
                />
              </div>
            </div>

            {/* Nome Completo */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                {type === 'PJ' ? 'Nome do Responsável' : 'Nome Completo'} *
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="João Silva"
              />
            </div>

            {/* Nome da Empresa (apenas PJ) */}
            {type === 'PJ' && (
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Razão Social / Nome Fantasia *
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required={type === 'PJ'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Empresa LTDA"
                />
              </div>
            )}

            {/* Email e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone *
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Seção de Endereço */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
              
              {/* CEP e Cidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-2">
                    CEP (Busca Automática)
                  </label>
                  <div className="relative">
                    <input
                      id="cep"
                      type="text"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      onBlur={handleCepBlur}
                      maxLength={9}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="00000-000"
                    />
                    {cepLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      </div>
                    )}
                    {!cepLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Search className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="São Paulo"
                  />
                </div>
              </div>

              {/* Rua e Número */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                    Rua
                  </label>
                  <input
                    id="street"
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rua das Flores"
                  />
                </div>

                <div>
                  <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
                    Número
                  </label>
                  <input
                    id="number"
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123"
                  />
                </div>
              </div>

              {/* Bairro e Estado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
                    Bairro
                  </label>
                  <input
                    id="neighborhood"
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Centro"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    UF
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    maxLength={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="SP"
                  />
                </div>
              </div>

              {/* Complemento */}
              <div>
                <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-2">
                  Complemento
                </label>
                <input
                  id="complement"
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Apto 101, Bloco A"
                />
              </div>
            </div>

            {/* Senha e Confirmar Senha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha *
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Senha *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite a senha novamente"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="space-y-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full flex items-center justify-center gap-2 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar para o Login
              </button>
            </div>
          </form>

          {/* Rodapé */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Já tem uma conta?</p>
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Faça login aqui
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
