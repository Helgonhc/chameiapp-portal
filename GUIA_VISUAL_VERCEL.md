# 🎯 GUIA VISUAL: Adicionar Variáveis no Vercel

## 📍 LOCALIZAÇÃO EXATA

```
vercel.com
    ↓
[Seu Projeto]
    ↓
Settings (menu lateral esquerdo)
    ↓
Environment Variables (scroll down)
    ↓
[Adicionar variáveis aqui]
```

---

## 🖼️ TELA DO VERCEL

### 1. Dashboard Inicial
```
┌─────────────────────────────────────────────┐
│ Vercel                              [User]  │
├─────────────────────────────────────────────┤
│                                             │
│  [+ Add New Project]                        │
│                                             │
│  Your Projects:                             │
│  ┌─────────────────────────────────────┐   │
│  │ chameiapp-portal                    │   │
│  │ https://chameiapp-portal.vercel.app │   │
│  └─────────────────────────────────────┘   │
│       ↑                                     │
│       Clicar aqui                           │
└─────────────────────────────────────────────┘
```

### 2. Página do Projeto
```
┌─────────────────────────────────────────────┐
│ chameiapp-portal                            │
├──────────────┬──────────────────────────────┤
│              │                              │
│ Overview     │  [Production Deployment]     │
│ Deployments  │                              │
│ Analytics    │  Latest Deploy: ✓ Ready      │
│ Logs         │                              │
│ Settings  ←──┼── CLICAR AQUI               │
│              │                              │
└──────────────┴──────────────────────────────┘
```

### 3. Settings → Environment Variables
```
┌─────────────────────────────────────────────┐
│ Settings                                    │
├──────────────┬──────────────────────────────┤
│              │                              │
│ General      │  Environment Variables       │
│ Domains      │                              │
│ Git          │  ┌────────────────────────┐  │
│ Environment  │  │ Add New Variable       │  │
│ Variables ←──┼──│                        │  │
│              │  │ Key:                   │  │
│              │  │ [________________]     │  │
│              │  │                        │  │
│              │  │ Value:                 │  │
│              │  │ [________________]     │  │
│              │  │                        │  │
│              │  │ [Add]                  │  │
│              │  └────────────────────────┘  │
└──────────────┴──────────────────────────────┘
```

---

## ✍️ O QUE ESCREVER

### Variável 1:
```
Key:   NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxx.supabase.co
```

### Variável 2:
```
Key:   NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔑 PEGAR VALORES NO SUPABASE

### Tela do Supabase:
```
┌─────────────────────────────────────────────┐
│ Supabase                                    │
├──────────────┬──────────────────────────────┤
│              │                              │
│ Table Editor │  Project Settings            │
│ SQL Editor   │                              │
│ Database     │  ┌────────────────────────┐  │
│ Auth         │  │ API                    │  │
│ Storage      │  │                        │  │
│ Settings  ←──┼──│ Project URL:           │  │
│   ├─ API  ←──┼──│ https://xxxxx.supabase │  │
│   ├─ Auth    │  │        .co             │  │
│   └─ ...     │  │ [Copy] ← Copiar isto   │  │
│              │  │                        │  │
│              │  │ Project API keys:      │  │
│              │  │                        │  │
│              │  │ anon public            │  │
│              │  │ eyJhbGciOiJIUzI1NiIs.. │  │
│              │  │ [Copy] ← Copiar isto   │  │
│              │  └────────────────────────┘  │
└──────────────┴──────────────────────────────┘
```

---

## 📝 PASSO A PASSO COMPLETO

### PASSO 1: Pegar valores no Supabase
1. Abrir https://supabase.com
2. Clicar no seu projeto
3. Clicar em **Settings** (ícone ⚙️)
4. Clicar em **API**
5. Copiar **Project URL**
6. Copiar **anon public key**

### PASSO 2: Adicionar no Vercel
1. Abrir https://vercel.com
2. Clicar no seu projeto
3. Clicar em **Settings** (menu lateral)
4. Scroll down até **Environment Variables**
5. Clicar em **Add New**

### PASSO 3: Primeira Variável
```
Key:   NEXT_PUBLIC_SUPABASE_URL
Value: [Colar Project URL do Supabase]
Environments: ☑ Production ☑ Preview ☑ Development
[Add]
```

### PASSO 4: Segunda Variável
```
Key:   NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Colar anon public key do Supabase]
Environments: ☑ Production ☑ Preview ☑ Development
[Add]
```

### PASSO 5: Redeploy
1. Ir em **Deployments**
2. Último deploy → **⋮** (três pontinhos)
3. **Redeploy**
4. Desmarcar "Use existing Build Cache"
5. **Redeploy**

---

## ✅ VERIFICAR SE FUNCIONOU

Após o redeploy:

1. Acessar: `https://seu-projeto.vercel.app`
2. Tentar fazer login
3. Se funcionar = ✅ Sucesso!
4. Se não funcionar = Ver logs do deploy

---

## 🎬 RESUMO EM 5 CLIQUES

```
1. vercel.com → Seu Projeto
2. Settings → Environment Variables
3. Add: NEXT_PUBLIC_SUPABASE_URL
4. Add: NEXT_PUBLIC_SUPABASE_ANON_KEY
5. Deployments → Redeploy
```

**Tempo: 3 minutos** ⏱️

---

## 💡 DICA PRO

Salve suas variáveis em um arquivo local (NÃO fazer commit!):

```bash
# Criar arquivo .env.local
cd client-portal
notepad .env.local
```

Colar:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Assim você pode testar localmente antes de fazer deploy!

---

## 🆘 PRECISA DE AJUDA?

Se não encontrar "Environment Variables":
- Você está em **Settings**?
- Scroll down na página
- Está no menu lateral esquerdo

Se as variáveis não funcionam:
- Verificar se copiou corretamente
- Verificar se marcou todos os ambientes
- Fazer redeploy SEM cache

---

**Pronto! Agora é só seguir os passos acima.** 🚀

