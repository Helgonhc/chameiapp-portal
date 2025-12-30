# 🔑 ONDE ADICIONAR VARIÁVEIS NO VERCEL

## 📍 PASSO A PASSO VISUAL

### 1️⃣ Acessar o Vercel
```
https://vercel.com
```
- Fazer login com sua conta

---

### 2️⃣ Selecionar o Projeto

**Se é o PRIMEIRO DEPLOY:**
1. Clicar em **"Add New Project"**
2. Clicar em **"Import Git Repository"**
3. Selecionar seu repositório do GitHub
4. Clicar em **"Import"**

**Se o projeto JÁ EXISTE:**
1. Na dashboard, clicar no nome do projeto
2. Ir para **"Settings"** (menu lateral)

---

### 3️⃣ ADICIONAR VARIÁVEIS DE AMBIENTE

#### 📍 Localização no Vercel:

```
Projeto → Settings → Environment Variables
```

**Caminho completo:**
```
Dashboard
  └─ Seu Projeto
      └─ Settings (menu lateral esquerdo)
          └─ Environment Variables (menu lateral)
```

---

### 4️⃣ ADICIONAR AS 2 VARIÁVEIS

#### Variável 1: URL do Supabase

```
┌─────────────────────────────────────────┐
│ Key (Nome)                              │
│ NEXT_PUBLIC_SUPABASE_URL                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Value (Valor)                           │
│ https://xxxxx.supabase.co               │
└─────────────────────────────────────────┘

Environment: ☑ Production ☑ Preview ☑ Development

[Add] ← Clicar aqui
```

#### Variável 2: Chave Anon do Supabase

```
┌─────────────────────────────────────────┐
│ Key (Nome)                              │
│ NEXT_PUBLIC_SUPABASE_ANON_KEY           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Value (Valor)                           │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
└─────────────────────────────────────────┘

Environment: ☑ Production ☑ Preview ☑ Development

[Add] ← Clicar aqui
```

---

## 🔍 ONDE PEGAR ESSES VALORES?

### No Supabase:

1. Ir em https://supabase.com
2. Selecionar seu projeto
3. Clicar em **Settings** (ícone de engrenagem)
4. Clicar em **API** (menu lateral)
5. Copiar:

```
┌─────────────────────────────────────────┐
│ Project URL                             │
│ https://xxxxx.supabase.co               │
│                                         │
│ ↑ Copiar e colar em:                    │
│   NEXT_PUBLIC_SUPABASE_URL              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Project API keys                        │
│                                         │
│ anon public                             │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
│                                         │
│ ↑ Copiar e colar em:                    │
│   NEXT_PUBLIC_SUPABASE_ANON_KEY         │
└─────────────────────────────────────────┘
```

---

## 📸 INTERFACE DO VERCEL

Quando você estiver na página de Environment Variables, vai ver algo assim:

```
┌──────────────────────────────────────────────────────────┐
│ Environment Variables                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Add a new variable                                       │
│                                                          │
│ Key                                                      │
│ ┌──────────────────────────────────────────────────┐   │
│ │ NEXT_PUBLIC_SUPABASE_URL                         │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ Value                                                    │
│ ┌──────────────────────────────────────────────────┐   │
│ │ https://xxxxx.supabase.co                        │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ Environments                                             │
│ ☑ Production  ☑ Preview  ☑ Development                 │
│                                                          │
│                                    [Add]                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST

- [ ] Acessei https://vercel.com
- [ ] Selecionei meu projeto (ou importei do GitHub)
- [ ] Fui em Settings → Environment Variables
- [ ] Adicionei `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Adicionei `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Marquei todos os ambientes (Production, Preview, Development)
- [ ] Cliquei em "Add" para cada variável
- [ ] Fiz deploy (ou redeploy se já existia)

---

## 🚀 DEPOIS DE ADICIONAR

### Se é o PRIMEIRO DEPLOY:
1. Clicar em **"Deploy"**
2. Aguardar 2-3 minutos
3. ✅ Pronto!

### Se o projeto JÁ EXISTE:
1. Ir em **"Deployments"**
2. Clicar nos 3 pontinhos do último deploy
3. Clicar em **"Redeploy"**
4. **DESMARCAR** "Use existing Build Cache"
5. Clicar em **"Redeploy"**
6. Aguardar 2-3 minutos
7. ✅ Pronto!

---

## 🎯 RESUMO RÁPIDO

```
1. vercel.com
2. Seu Projeto
3. Settings
4. Environment Variables
5. Adicionar:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
6. Deploy (ou Redeploy)
```

---

## 🐛 PROBLEMAS COMUNS

### "Não vejo Environment Variables"
- Você está em Settings? (menu lateral esquerdo)
- Scroll down, está mais abaixo na página

### "Adicionei mas não funciona"
- Fazer **Redeploy** sem cache
- Verificar se os valores estão corretos
- Verificar se marcou todos os ambientes

### "Erro ao fazer deploy"
- Ver logs do deploy
- Verificar se as variáveis estão corretas
- Testar no Supabase se o projeto está ativo

---

## 📞 ATALHO DIRETO

Se você já tem o projeto no Vercel:

```
https://vercel.com/seu-usuario/seu-projeto/settings/environment-variables
```

Substitua:
- `seu-usuario` → seu username do Vercel
- `seu-projeto` → nome do projeto

---

**Tempo estimado: 2-3 minutos** ⏱️

