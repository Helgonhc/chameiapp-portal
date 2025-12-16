# ⚡ CONFIGURAR VARIÁVEIS DE AMBIENTE - RÁPIDO

## 🚨 ERRO: "supabaseUrl is required"

Esse erro acontece porque o portal precisa das credenciais do Supabase.

---

## ✅ SOLUÇÃO RÁPIDA (3 PASSOS)

### **PASSO 1: Criar o arquivo `.env.local`**

Na pasta `client-portal`, crie um arquivo chamado `.env.local` (sem nada antes do ponto)

### **PASSO 2: Copiar suas credenciais do Supabase**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** (URL do projeto)
   - **anon public** (Chave pública anon)

### **PASSO 3: Colar no arquivo `.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**⚠️ IMPORTANTE:**
- Substitua `https://seu-projeto.supabase.co` pela sua URL real
- Substitua `sua-chave-anon-aqui` pela sua chave real
- **NÃO** coloque aspas nas variáveis
- **NÃO** deixe espaços antes ou depois do `=`

---

## 🔄 PASSO 4: Reiniciar o servidor

Depois de criar o arquivo `.env.local`:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente:
npm run dev
```

---

## ✅ EXEMPLO COMPLETO

Seu arquivo `.env.local` deve ficar assim:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.exemplo-de-chave-muito-longa
```

---

## 📍 ONDE ESTÁ O ARQUIVO?

```
chameiapp/
├── client-portal/
│   ├── .env.local          ← CRIAR ESTE ARQUIVO AQUI
│   ├── .env.local.example  ← Exemplo (não usar)
│   ├── app/
│   ├── components/
│   └── ...
```

---

## 🔍 VERIFICAR SE FUNCIONOU

Depois de criar o `.env.local` e reiniciar:

1. Acesse: http://localhost:3001
2. Se aparecer a tela de login → **FUNCIONOU!** ✅
3. Se ainda der erro → Verifique se copiou as credenciais corretas

---

## ❓ DÚVIDAS COMUNS

### **"Onde pego as credenciais?"**
- Supabase Dashboard → Settings → API
- Copie a **Project URL** e a chave **anon public**

### **"O arquivo .env.local não aparece?"**
- Arquivos que começam com `.` são ocultos
- No Windows: Ative "Mostrar arquivos ocultos"
- Ou crie pelo terminal: `echo. > .env.local`

### **"Ainda dá erro depois de criar?"**
- Reinicie o servidor (Ctrl+C e `npm run dev`)
- Verifique se não tem espaços extras
- Verifique se as credenciais estão corretas

---

## 🎯 RESUMO

1. Crie `client-portal/.env.local`
2. Cole suas credenciais do Supabase
3. Reinicie o servidor
4. Pronto! ✅

---

**Precisa de ajuda? Me chame!**
