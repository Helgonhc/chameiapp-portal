'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    LayoutDashboard,
    Ticket,
    Users,
    ArrowRight,
    Check,
    X,
    Rocket,
    Calendar,
    FileText
} from 'lucide-react';

interface WelcomeWizardProps {
    onCheck: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const steps = [
    {
        id: 1,
        title: 'Nossa Missão: O Fim do Caos',
        description: 'Criamos este portal com um objetivo único: trazer transparência total para sua operação. Chega de mensagens perdidas no WhatsApp ou "achismos". Aqui, você tem controle e dados reais.',
        icon: Rocket,
        color: 'text-orange-500',
        bg: 'bg-orange-50'
    },
    {
        id: 2,
        title: 'O Cockpit da Sua Empresa',
        description: 'Seu Dashboard não é apenas um enfeite. Ele é um painel de controle em tempo real. Acompanhe gráficos financeiros, status de manutenções e alertas críticos assim que fizer login.',
        icon: LayoutDashboard,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
    },
    {
        id: 3,
        title: 'Adeus, Surpresas Desagradáveis',
        description: 'Com o Calendário Inteligente, você prevê manutenções e vistorias antes que problemas aconteçam. A previsibilidade é a chave para uma operação barata e eficiente.',
        icon: Calendar,
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    {
        id: 4,
        title: 'Chamados que Resolvem',
        description: 'O "telefone sem fio" acabou. Abra chamados técnicos detalhados, anexe fotos e acompanhe cada etapa da resolução. Tudo fica registrado para auditoria e histórico.',
        icon: Ticket,
        color: 'text-pink-600',
        bg: 'bg-pink-50'
    },
    {
        id: 5,
        title: 'Documentação Blindada',
        description: 'PGR, PCMSO, Laudos Técnicos... Sua papelada de segurança está centralizada aqui. Download em 1 clique, sempre atualizado e seguro contra perdas.',
        icon: FileText,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
    },
    {
        id: 6,
        title: 'Gestão de Acesso Granular',
        description: 'Você define quem entra. Convide sua equipe, crie perfis (Financeiro, Operacional) e tenha certeza de que cada um vê apenas o necessário.',
        icon: Users,
        color: 'text-purple-600',
        bg: 'bg-purple-50'
    }
];

export default function WelcomeWizard({ onCheck, isOpen, onClose }: WelcomeWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Reset step when opened
        if (isOpen) setCurrentStep(0);
    }, [isOpen]);

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        onClose();
    };

    // Logic to handle the final "Conclusion" step which is dynamic (index === steps.length)
    const isFinalStep = currentStep === steps.length;

    const currentData = isFinalStep ? {
        title: 'Pronto para Decolar?',
        description: 'Agora você tem o poder de uma gestão profissional nas mãos. Explore, use e abuse das ferramentas. Estamos aqui para garantir sua tranquilidade.',
        icon: Sparkles,
        color: 'text-yellow-500',
        bg: 'bg-yellow-50'
    } : steps[currentStep];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        key="modal-content"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className={`absolute top-0 left-0 w-full h-32 ${currentData.bg} transition-colors duration-500`} />

                        <button
                            onClick={handleComplete}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 z-10 hover:bg-white/50 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative pt-12 px-8 pb-8 flex flex-col items-center text-center">

                            <motion.div
                                key={isFinalStep ? 'final' : steps[currentStep].id}
                                initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                transition={{ type: 'spring', duration: 0.5 }}
                                className={`w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-6 border-4 border-white ${currentData.color}`}
                            >
                                <currentData.icon size={40} strokeWidth={1.5} />
                            </motion.div>

                            <motion.div
                                key={`text-${isFinalStep ? 'final' : steps[currentStep].id}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-3 mb-8 min-h-[140px]"
                            >
                                <h2 className="text-2xl font-black text-slate-800 leading-tight">{currentData.title}</h2>
                                <p className="text-slate-500 text-lg leading-relaxed">{currentData.description}</p>
                            </motion.div>

                            <div className="flex gap-2 mb-8">
                                {/* Dots for step + 1 final step */}
                                {[...steps, {}].map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? `w-8 ${currentData.color.replace('text-', 'bg-')}` : 'w-2 bg-slate-200'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group transition-all transform active:scale-95 ${isFinalStep ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                            >
                                {isFinalStep ? (
                                    <>Começar Agora <Check size={20} /></>
                                ) : (
                                    <>Próximo <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
