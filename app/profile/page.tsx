'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import {
  User, Mail, Phone, Building2, Save, Users, Camera, Lock, Shield,
  Plus, X, Trash2, LogOut, Check, Loader2, Palette, FileText, Upload,
  MapPin, Hash, CreditCard, PenTool, Image as ImageIcon
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';

interface PortalUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  cargo?: string;
  permissions?: any;
}

const JOB_TITLES = [
  { label: 'Supervisor Operacional', role: 'client', description: 'Acesso total de administrador' },
  { label: 'Auxiliar Operacional', role: 'user', description: 'Acesso restrito operacional' },
  { label: 'Assistente', role: 'user', description: 'Acesso restrito administrativo' },
  { label: 'Técnico Residente', role: 'user', description: 'Acesso para execução de ordens' },
  { label: 'Outro', role: 'user', description: 'Acesso personalizado' }
];

const PERMISSION_LABELS: Record<string, string> = {
  view_dashboard: 'Visualizar Dashboard',
  view_calendar: 'Acessar Calendário',
  view_service_orders: 'Ordens de Serviço',
  view_tickets: 'Chamados',
  view_equipments: 'Equipamentos',
  view_quotes: 'Orçamentos',
  view_documents: 'Documentos',
  view_chat: 'Chat / Suporte',
  view_history: 'Histórico'
};

const DEFAULT_PERMISSIONS = {
  view_dashboard: true,
  view_calendar: true,
  view_service_orders: true,
  view_tickets: true,
  view_equipments: true,
  view_quotes: true,
  view_documents: true,
  view_chat: true,
  view_history: true
};

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const clientLogoInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'personal' | 'client' | 'documents' | 'appearance' | 'team'>('personal');

  // Forms
  const [formData, setFormData] = useState({ full_name: '', phone: '' });
  const [clientFormData, setClientFormData] = useState<any>({});

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Invite Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserJobTitle, setNewUserJobTitle] = useState('Auxiliar Operacional');
  const [newUserPermissions, setNewUserPermissions] = useState<any>(DEFAULT_PERMISSIONS);
  const [inviting, setInviting] = useState(false);
  const [createdUserCreds, setCreatedUserCreds] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: profileBase } = await supabase.from('profiles').select('*, client:clients(*)').eq('id', user.id).single();
      setProfile(profileBase);

      if (profileBase) {
        setFormData({ full_name: profileBase.full_name || '', phone: profileBase.phone || '' });
        if (profileBase.client) {
          setClientFormData({
            ...profileBase.client
          });
        }
      }

      if (profileBase?.client_id) {
        const { data: users } = await supabase.from('profiles').select('*').eq('client_id', profileBase.client_id);
        setPortalUsers(users || []);
      }

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const handleUpdateProfile = async () => {
    if (!formData.full_name) return toast.error('Nome é obrigatório');
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: formData.full_name,
        phone: formData.phone
      }).eq('id', profile.id);

      if (error) throw error;
      setProfile({ ...profile, ...formData });
      toast.success('Perfil atualizado com sucesso!');
    } catch (e) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  }

  const handleUpdateClient = async () => {
    if (profile.role !== 'client') return toast.error('Apenas administradores podem editar dados da empresa.');
    setSaving(true);
    try {
      const fullAddress = `${clientFormData.street}, ${clientFormData.number} - ${clientFormData.neighborhood}, ${clientFormData.city}/${clientFormData.state}`;

      const { error } = await supabase.from('clients').update({
        name: clientFormData.name,
        cnpj_cpf: clientFormData.cnpj_cpf,
        phone: clientFormData.phone,
        zip_code: clientFormData.zip_code,
        street: clientFormData.street,
        number: clientFormData.number,
        neighborhood: clientFormData.neighborhood,
        city: clientFormData.city,
        state: clientFormData.state,
        address: fullAddress,
        primary_color: clientFormData.primary_color
      }).eq('id', profile.client_id);

      if (error) throw error;

      // Apply Theme Immediately
      if (clientFormData.primary_color) {
        document.documentElement.style.setProperty('--primary-color', clientFormData.primary_color);
        const hex = clientFormData.primary_color.replace('#', '');
        if (hex.length === 6) {
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
        }
      }

      toast.success('Dados da empresa atualizados!');
      // Reload only if crucial, but immediate application is handled above.
      // We can keep reload to ensure persistent state sync or remove if robust enough.
      // The user complained it wasn't applying, so immediate application is key.
      if (clientFormData.primary_color !== profile.client.primary_color) {
        setTimeout(() => window.location.reload(), 1000); // Give time for toast
      }
    } catch (e) { toast.error('Erro ao atualizar empresa'); }
    finally { setSaving(false); }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'signature' | 'client_logo') => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      // Use 'os-photos' bucket which is confirmed to work in Admin Portal
      const bucket = 'os-photos';

      // Define path based on type
      let filePath = '';
      if (type === 'avatar') filePath = `avatars/${profile.id}-${Date.now()}.${fileExt}`;
      else if (type === 'signature') filePath = `signatures/${profile.id}-${Date.now()}.${fileExt}`;
      else if (type === 'client_logo') filePath = `logos/${profile.client_id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (type === 'avatar') {
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
        setProfile({ ...profile, avatar_url: publicUrl });
        toast.success('Foto de perfil atualizada!');
        // Force reload to update Sidebar
        window.location.reload();
      } else if (type === 'signature') {
        await supabase.from('profiles').update({ signature_url: publicUrl }).eq('id', profile.id);
        setProfile({ ...profile, signature_url: publicUrl });
        toast.success('Assinatura salva!');
      } else if (type === 'client_logo') {
        await supabase.from('clients').update({ client_logo_url: publicUrl }).eq('id', profile.client_id);
        setClientFormData({ ...clientFormData, client_logo_url: publicUrl });
        toast.success('Logo da empresa atualizada!');
      }

    } catch (e: any) {
      toast.error('Erro no upload: ' + e.message);
    } finally {
      setUploading(false);
    }
  }

  const handleSaveUser = async () => {
    if (!newUserEmail || !newUserName) return toast.error('Preencha os campos obrigatórios');

    setInviting(true);
    try {
      // Determine Role based on Job Title
      const selectedJob = JOB_TITLES.find(j => j.label === newUserJobTitle);
      const finalRole = selectedJob?.role || 'user';
      // FIX: Always send permissions object, even for 'client' role, to satisfy DB constraints.
      // If role is client, they implicitly have all permissions locally, but DB might require the JSON.
      const finalPermissions = newUserPermissions;

      // EDIT MODE
      if (editingUser) {
        const { error } = await supabase.from('profiles').update({
          full_name: newUserName,
          cargo: newUserJobTitle,
          permissions: finalPermissions,
          role: finalRole // Allow promoting/demoting
        }).eq('id', editingUser.id);

        if (error) throw error;
        toast.success('Permissões atualizadas!');
        setShowUserModal(false);
        loadData();
      }
      // CREATE MODE
      else {
        // Check Limits
        if (portalUsers.length >= 2) {
          throw new Error('Limite de 2 usuários atingido.');
        }

        const supabaseInvite = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false } }
        );

        const tempPassword = Math.random().toString(36).slice(-8) + "Aa1@";

        const { data, error } = await supabaseInvite.auth.signUp({
          email: newUserEmail,
          password: tempPassword,
          options: {
            data: {
              full_name: newUserName,
              role: finalRole,
              cargo: newUserJobTitle,
              permissions: finalPermissions
            }
          }
        });

        if (error) throw error;
        if (!data.user) throw new Error('Falha na criação da conta.');

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: newUserEmail,
            full_name: newUserName,
            client_id: profile.client_id,
            role: finalRole,
            cargo: newUserJobTitle,
            permissions: finalPermissions,
            is_active: true
          });

        if (profileError) throw new Error('Erro ao salvar perfil: ' + profileError.message);

        toast.success('Usuário criado com sucesso!');
        setCreatedUserCreds({ email: newUserEmail, password: tempPassword });
        // Don't close modal yet, show creds
        loadData();
      }

      if (!createdUserCreds && !editingUser) {
        setNewUserEmail('');
        setNewUserName('');
        // Reset Perms
        setNewUserPermissions(DEFAULT_PERMISSIONS);
      }

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao salvar.');
    } finally {
      setInviting(false);
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza? O usuário perderá o acesso imediatamente.')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      toast.success('Usuário removido.');
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const openEditModal = (user: PortalUser) => {
    setEditingUser(user);
    setNewUserName(user.full_name);
    setNewUserEmail(user.email);
    setNewUserJobTitle(user.cargo || 'Auxiliar Operacional');

    // Sanitize Permissions: Only load valid keys, ignore garbage from DB
    if (user.permissions) {
      const sanitized: any = { ...DEFAULT_PERMISSIONS }; // Start with all true
      // Override with user values strictly for valid keys
      Object.keys(DEFAULT_PERMISSIONS).forEach(k => {
        if (user.permissions.hasOwnProperty(k)) {
          sanitized[k] = user.permissions[k];
        }
      });
      setNewUserPermissions(sanitized);
    } else {
      setNewUserPermissions(DEFAULT_PERMISSIONS);
    }

    setCreatedUserCreds(null);
    setShowUserModal(true);
  }

  const openNewUserModal = () => {
    setEditingUser(null);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserJobTitle('Auxiliar Operacional');
    setCreatedUserCreds(null);
    setNewUserPermissions(DEFAULT_PERMISSIONS);
    setShowUserModal(true);
  }

  if (loading) return <DashboardLayout><div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-20 animate-fadeIn space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Definições da Conta</h1>
            <p className="text-slate-500">Gerencie detalhes do perfil, segurança e preferências.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">

          {/* Sidebar Navigation (Pills Vertical) */}
          <div className="lg:col-span-3">
            <nav className="flex flex-col gap-1 sticky top-6">
              {[
                { id: 'personal', label: 'Dados Pessoais', icon: User },
                { id: 'client', label: 'Dados da Empresa', icon: Building2, adminOnly: true },
                { id: 'documents', label: 'Assinatura', icon: PenTool },
                { id: 'appearance', label: 'Aparência', icon: Palette, adminOnly: true },
                { id: 'team', label: 'Time & Acesso', icon: Users, adminOnly: true },
              ].map(item => (
                (!item.adminOnly || profile?.role === 'client') && (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as any)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${activeSection === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    <item.icon size={18} /> {item.label}
                  </button>
                )
              ))}

              <div className="h-px bg-slate-200 my-4" />

              <button onClick={async () => { await logout(); router.push('/login') }} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left text-red-600 hover:bg-red-50">
                <LogOut size={18} /> Sair da Conta
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-9 space-y-6">

            {/* PERSONAL DATA */}
            {activeSection === 'personal' && (
              <div className="card bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-50">
                  <div className="relative group">
                    <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center cursor-pointer overflow-hidden">
                      {profile?.avatar_url ? <img src={`${profile.avatar_url}?t=${Date.now()}`} className="w-full h-full object-cover" /> : <User size={32} className="text-slate-300" />}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={20} /></div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e, 'avatar')} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Sua Foto</h2>
                    <p className="text-slate-500 text-sm">Isso será exibido no seu perfil.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">Nome Completo</label><input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="input w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500 transition-colors" /></div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">Email</label><input value={profile?.email} disabled className="input w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed" /></div>
                    <div><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">Telefone / Whats</label><input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" /></div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button onClick={handleUpdateProfile} disabled={saving} className="btn-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:shadow-xl transition-all">{saving ? 'Salvando...' : 'Salvar Alterações'}</button>
                </div>
              </div>
            )}

            {/* COMPANY DATA */}
            {activeSection === 'client' && (
              <div className="card bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                {/* Logo Upload Section */}
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-50">
                  <div className="relative group">
                    <div onClick={() => clientLogoInputRef.current?.click()} className="w-24 h-24 rounded-2xl bg-slate-100 border-4 border-white shadow-md flex items-center justify-center cursor-pointer overflow-hidden">
                      {clientFormData.client_logo_url ? <img src={clientFormData.client_logo_url} className="w-full h-full object-contain p-2" /> : <Building2 size={32} className="text-slate-400" />}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={20} /></div>
                    </div>
                    <input type="file" ref={clientLogoInputRef} className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e, 'client_logo')} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Logo da Empresa</h2>
                    <p className="text-slate-500 text-sm">Atualize a marca da sua empresa.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="md:col-span-2"><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">Razão Social</label><input value={clientFormData.name || ''} onChange={e => setClientFormData({ ...clientFormData, name: e.target.value })} className="input w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
                  <div><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">CNPJ / CPF</label><input value={clientFormData.cnpj_cpf || ''} onChange={e => setClientFormData({ ...clientFormData, cnpj_cpf: e.target.value })} className="input w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">Telefone</label><input value={clientFormData.phone || ''} onChange={e => setClientFormData({ ...clientFormData, phone: e.target.value })} className="input w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>

                  <div className="md:col-span-2 pt-6"><h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Endereço</h3></div>
                  <div><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">CEP</label><input value={clientFormData.zip_code || ''} onChange={e => setClientFormData({ ...clientFormData, zip_code: e.target.value })} className="input w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">Rua</label><input value={clientFormData.street || ''} onChange={e => setClientFormData({ ...clientFormData, street: e.target.value })} className="input w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">Número</label><input value={clientFormData.number || ''} onChange={e => setClientFormData({ ...clientFormData, number: e.target.value })} className="input w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">Bairro</label><input value={clientFormData.neighborhood || ''} onChange={e => setClientFormData({ ...clientFormData, neighborhood: e.target.value })} className="input w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div className="md:col-span-2 grid grid-cols-3 gap-4">
                    <div className="col-span-2"><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">Cidade</label><input value={clientFormData.city || ''} onChange={e => setClientFormData({ ...clientFormData, city: e.target.value })} className="input w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                    <div><label className="label text-xs uppercase font-bold text-slate-400 mb-1 block">UF</label><input value={clientFormData.state || ''} onChange={e => setClientFormData({ ...clientFormData, state: e.target.value })} className="input w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center uppercase" maxLength={2} /></div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button onClick={handleUpdateClient} disabled={saving} className="btn-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:shadow-xl transition-all">{saving ? 'Salvando...' : 'Atualizar Empresa'}</button>
                </div>
              </div>
            )}

            {/* SIGNATURE */}
            {activeSection === 'documents' && (
              <div className="card bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><PenTool size={32} /></div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Assinatura Digital</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">Upload da sua rubrica para assinar documentos digitalmente dentro do sistema.</p>

                <div onClick={() => signatureInputRef.current?.click()} className="w-full max-w-md h-48 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-slate-100 group rounded-2xl mx-auto flex flex-col items-center justify-center cursor-pointer transition-all relative">
                  {profile?.signature_url ? (
                    <img src={profile.signature_url} className="h-full object-contain p-4" />
                  ) : (
                    <>
                      <Upload className="text-slate-300 mb-2 group-hover:text-indigo-500" size={32} />
                      <span className="text-sm font-bold text-slate-400 group-hover:text-indigo-600">Clique para enviar (PNG/JPG)</span>
                    </>
                  )}
                  {uploading && <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10"><Loader2 className="animate-spin text-indigo-600" /></div>}
                </div>
                <input type="file" ref={signatureInputRef} className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e, 'signature')} />
              </div>
            )}

            {/* APPEARANCE */}
            {activeSection === 'appearance' && (
              <div className="card bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Personalização Visual</h2>
                <p className="text-slate-500 mb-6">Escolha a cor principal do seu portal.</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
                  {['#4f46e5', '#3b82f6', '#0ea5e9', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                    <div
                      key={color}
                      onClick={() => setClientFormData({ ...clientFormData, primary_color: color })}
                      className={`h-16 rounded-2xl cursor-pointer shadow-sm flex items-center justify-center transition-transform hover:scale-105 border-4 ${clientFormData.primary_color === color ? 'border-slate-800 scale-105' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    >
                      {clientFormData.primary_color === color && <Check className="text-white" />}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex justify-end">
                  <button onClick={handleUpdateClient} disabled={saving} className="btn-primary px-8 py-3 rounded-xl font-bold text-sm">Aplicar Tema</button>
                </div>
              </div>
            )}

            {/* TEAM */}
            {activeSection === 'team' && (
              <div className="card bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Gerenciar Equipe</h2>
                    <p className="text-slate-500 text-sm">Controle quem tem acesso.</p>
                  </div>
                  <button onClick={openNewUserModal} className="btn-primary bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16} /> Adicionar</button>
                </div>
                <div className="space-y-3">
                  {portalUsers.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-slate-700 shadow-sm">{u.full_name?.charAt(0)}</div>
                        <div><p className="font-bold text-slate-700 text-sm">{u.full_name}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border mr-2 ${u.role === 'client' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-slate-500 border-slate-200'}`}>
                          {u.cargo || (u.role === 'client' ? 'Supervisor' : 'Colaborador')}
                        </span>

                        {/* Actions (Only for others, not self) */}
                        {u.id !== profile.id && (
                          <>
                            <button onClick={() => openEditModal(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all" title="Editar Permissões">
                              <PenTool size={16} />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all" title="Remover Acesso">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowUserModal(false)} />
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md relative shadow-2xl animate-scaleIn">
              {!createdUserCreds ? (
                <>
                  <button onClick={() => setShowUserModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">{editingUser ? 'Editar Permissões' : 'Novo Usuário'}</h2>
                  <div className="space-y-4 mt-6">
                    <div><label className="label text-xs font-bold uppercase text-slate-500 mb-1 block">Nome</label><input value={newUserName} onChange={e => setNewUserName(e.target.value)} className="input w-full border-slate-300 p-3 rounded-xl" /></div>
                    <div><label className="label text-xs font-bold uppercase text-slate-500 mb-1 block">Email</label><input value={newUserEmail} disabled={!!editingUser} onChange={e => setNewUserEmail(e.target.value)} className={`input w-full border-slate-300 p-3 rounded-xl ${editingUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} /></div>
                    <div>
                      <label className="label text-xs font-bold uppercase text-slate-500 mb-1 block">Cargo / Função</label>
                      <select
                        value={newUserJobTitle}
                        onChange={e => setNewUserJobTitle(e.target.value)}
                        className="input w-full border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 mb-2"
                      >
                        {JOB_TITLES.map(job => (
                          <option key={job.label} value={job.label}>{job.label} {job.role === 'client' ? '(Admin)' : ''}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mb-4">
                        {JOB_TITLES.find(j => j.label === newUserJobTitle)?.description}
                      </p>
                    </div>

                    {/* Permissions Checkboxes (Only for Non-Admins) */}
                    {JOB_TITLES.find(j => j.label === newUserJobTitle)?.role !== 'client' && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-48 overflow-y-auto">
                        <label className="label text-xs font-bold uppercase text-slate-500 mb-2 block">Permissões de Acesso</label>
                        <div className="space-y-2">
                          {Object.keys(DEFAULT_PERMISSIONS).map((key) => (
                            <label key={key} className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors border ${newUserPermissions[key] ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                              <input
                                type="checkbox"
                                checked={!!newUserPermissions[key]}
                                onChange={(e) => setNewUserPermissions({ ...newUserPermissions, [key]: e.target.checked })}
                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                              />
                              <span className={`text-sm font-bold ${newUserPermissions[key] ? 'text-indigo-900' : 'text-slate-700'}`}>
                                {PERMISSION_LABELS[key] || key}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <button onClick={handleSaveUser} disabled={inviting} className="w-full btn-primary py-3 rounded-xl font-bold bg-indigo-600 text-white flex justify-center items-center gap-2 mt-4 hover:bg-indigo-700">{inviting ? 'Salvamos...' : (editingUser ? 'Salvar Alterações' : 'Criar Acesso')}</button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <h2 className="text-xl font-bold text-green-600 mb-2">Sucesso!</h2>
                  <p className="text-sm text-slate-500 mb-4">Senha Temporária:</p>
                  <p className="font-mono bg-slate-100 p-3 rounded-xl mb-4 text-lg font-bold select-all border border-slate-200 text-slate-800">{createdUserCreds.password}</p>
                  <button onClick={() => setShowUserModal(false)} className="btn w-full py-3 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200">Fechar Janela</button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
