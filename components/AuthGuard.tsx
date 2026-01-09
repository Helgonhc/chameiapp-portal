'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

const publicPaths = ['/login', '/register', '/reset-password'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            await checkAuth();
            setChecked(true);
        };
        initAuth();
    }, []);

    useEffect(() => {
        if (checked && !isLoading) {
            if (!isAuthenticated && !publicPaths.includes(pathname)) {
                router.push('/login');
            } else if (isAuthenticated && publicPaths.includes(pathname)) {
                router.push('/dashboard');
            }
        }
    }, [checked, isLoading, isAuthenticated, pathname, router]);

    if (!checked || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    // Se não está autenticado e tenta acessar rota protegida, não renderiza nada enquanto redireciona
    if (!isAuthenticated && !publicPaths.includes(pathname)) {
        return null;
    }

    return <>{children}</>;
}
