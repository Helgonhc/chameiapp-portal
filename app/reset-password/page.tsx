'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Shield, KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);

  // Validações de senha
  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');

    if (type === 'recovery' && accessToken) {
      setValidToken(true);
    } else {
      setError('Link inválido ou expirado. Solicite um novo link de redefinição.');
    }
  }, []);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (!validToken) {
      setError('Link inválido ou expirado. Solicite um novo link de redefinição.');
      return;
    }

    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[150px]"></div>

        <div className="max-w-md w-full relative z-10">
          <div className="card p-8 border border-white/10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Senha Redefinida!</h1>
            <p className="text-zinc-400 mb-6">
              Sua senha foi alterada com sucesso. Você será redirecionado para a página de login...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center relative z-10">
          <p className="text-xs text-zinc-600">
            Desenvolvido por{' '}
            <span className="font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Helgon Henrique
            </span>
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-20"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-[150px]"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Company Name */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent">
              AeC Serviços Especializados
            </span>
          </h1>
        </div>

        <div className="card p-8 border border-white/10 backdrop-blur-xl bg-surface/80">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl blur-xl opacity-40"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Redefinir Senha</h2>
            <p className="text-zinc-400 text-sm">Crie uma nova senha segura para sua conta</p>
          </div>

          {!validToken ? (
            <div className="space-y-5">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
              <button onClick={() => router.push('/login')} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                <ArrowLeft className="w-5 h-5" />
                Voltar para o Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label className="form-label">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="form-input pl-12 pr-12"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="form-input pl-12 pr-12"
                    placeholder="Digite a senha novamente"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicators */}
              <div className="bg-surface rounded-xl p-4 border border-white/5">
                <p className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Requisitos da senha
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`flex items-center gap-2 text-xs ${hasMinLength ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasMinLength ? 'bg-emerald-500/20' : 'bg-zinc-700'}`}>
                      {hasMinLength && <CheckCircle className="w-3 h-3" />}
                    </div>
                    Mínimo 6 caracteres
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${hasUpperCase ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasUpperCase ? 'bg-emerald-500/20' : 'bg-zinc-700'}`}>
                      {hasUpperCase && <CheckCircle className="w-3 h-3" />}
                    </div>
                    Letra maiúscula
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${hasNumber ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasNumber ? 'bg-emerald-500/20' : 'bg-zinc-700'}`}>
                      {hasNumber && <CheckCircle className="w-3 h-3" />}
                    </div>
                    Contém número
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${passwordsMatch ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordsMatch ? 'bg-emerald-500/20' : 'bg-zinc-700'}`}>
                      {passwordsMatch && <CheckCircle className="w-3 h-3" />}
                    </div>
                    Senhas coincidem
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !hasMinLength || !passwordsMatch}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    Redefinir Senha
                  </>
                )}
              </button>
            </form>
          )}

          {validToken && (
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-zinc-500 hover:text-primary-400 font-semibold transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center relative z-10">
        <p className="text-xs text-zinc-600">
          Desenvolvido por{' '}
          <span className="font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Helgon Henrique
          </span>
        </p>
      </footer>
    </div>
  );
}
