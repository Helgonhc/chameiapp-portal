import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthState {
    user: any | null;
    profile: Profile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    loadProfile: () => Promise<void>;
    checkAuth: () => Promise<void>;
    setProfile: (profile: Profile) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => {
            // Setup listener for auth changes
            if (typeof window !== 'undefined') {
                supabase.auth.onAuthStateChange(async (event, session) => {
                    console.log('Auth event change:', event);

                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                        if (session?.user) {
                            // If we don't have a profile yet or the user changed, load it
                            const currentProfile = get().profile;
                            if (!currentProfile || currentProfile.id !== session.user.id) {
                                const { data: profile } = await supabase
                                    .from('profiles')
                                    .select('*')
                                    .eq('id', session.user.id)
                                    .single();

                                if (profile && profile.role === 'client') {
                                    set({
                                        user: session.user,
                                        profile,
                                        isAuthenticated: true,
                                        isLoading: false
                                    });
                                } else if (profile && profile.role !== 'client') {
                                    // Not a client, sign out
                                    await supabase.auth.signOut();
                                }
                            }
                        }
                    } else if (event === 'SIGNED_OUT') {
                        set({
                            user: null,
                            profile: null,
                            isAuthenticated: false,
                            isLoading: false
                        });
                        // Clear storage on sign out
                        localStorage.removeItem('client-auth-storage');
                    } else if (event === 'INITIAL_SESSION') {
                        if (session?.user) {
                            // Profile loading is handled by checkAuth or the listener above
                        } else {
                            set({ isLoading: false });
                        }
                    }
                });
            }

            return {
                user: null,
                profile: null,
                isLoading: true,
                isAuthenticated: false,

                login: async (email: string, password: string) => {
                    set({ isLoading: true });
                    try {
                        const { data, error } = await supabase.auth.signInWithPassword({
                            email,
                            password,
                        });

                        if (error) {
                            set({ isLoading: false });
                            return { error: error.message };
                        }

                        if (data.user) {
                            // Profile will be set by the onAuthStateChange listener
                            // But we check role here for immediate feedback/denial
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', data.user.id)
                                .single();

                            if (!profile || profile.role !== 'client') {
                                await supabase.auth.signOut();
                                return { error: 'Acesso permitido apenas para clientes.' };
                            }

                            if (profile.is_active === false) {
                                await supabase.auth.signOut();
                                return { error: 'Sua conta está desativada.' };
                            }

                            if (profile.client_id) {
                                const { data: client } = await supabase
                                    .from('clients')
                                    .select('portal_blocked, portal_blocked_reason')
                                    .eq('id', profile.client_id)
                                    .single();

                                if (client?.portal_blocked) {
                                    await supabase.auth.signOut();
                                    return { error: client.portal_blocked_reason || 'Acesso ao portal bloqueado.' };
                                }
                            }

                            set({
                                user: data.user,
                                profile,
                                isAuthenticated: true,
                                isLoading: false
                            });
                            return {};
                        }

                        return { error: 'Erro ao fazer login' };
                    } catch (error: any) {
                        set({ isLoading: false });
                        return { error: error.message };
                    }
                },

                logout: async () => {
                    set({ isLoading: true });
                    try {
                        await supabase.auth.signOut();
                    } catch (error) {
                        console.error('Error during Supabase signOut:', error);
                    } finally {
                        localStorage.removeItem('client-auth-storage');
                        sessionStorage.clear();

                        // Clear all Supabase related keys in localStorage
                        if (typeof window !== 'undefined') {
                            const keysToRemove = [];
                            for (let i = 0; i < localStorage.length; i++) {
                                const key = localStorage.key(i);
                                if (key && (
                                    key.includes('supabase') ||
                                    key.includes('sb-') ||
                                    key.includes('auth-token')
                                )) {
                                    keysToRemove.push(key);
                                }
                            }
                            keysToRemove.forEach(key => localStorage.removeItem(key));
                        }

                        set({
                            user: null,
                            profile: null,
                            isAuthenticated: false,
                            isLoading: false
                        });
                    }
                },

                loadProfile: async () => {
                    const { user } = get();
                    if (!user) return;

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (profile) {
                        set({ profile });
                    }
                },

                checkAuth: async () => {
                    // Check local state first (fast)
                    const { isAuthenticated, user, profile } = get();

                    // Always re-verify with Supabase to be sure
                    const { data: { session } } = await supabase.auth.getSession();

                    if (session?.user) {
                        if (!profile || profile.id !== session.user.id) {
                            const { data: profileData } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', session.user.id)
                                .single();

                            if (profileData && profileData.role === 'client') {
                                set({
                                    user: session.user,
                                    profile: profileData,
                                    isAuthenticated: true,
                                    isLoading: false
                                });
                                return;
                            } else {
                                await supabase.auth.signOut();
                            }
                        } else {
                            set({ isLoading: false });
                            return;
                        }
                    }

                    set({ user: null, profile: null, isAuthenticated: false, isLoading: false });
                },

                setProfile: (profile: Profile) => {
                    set({ profile });
                },
            };
        },
        {
            name: 'client-auth-storage',
            partialize: (state) => ({
                user: state.user,
                profile: state.profile,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);
