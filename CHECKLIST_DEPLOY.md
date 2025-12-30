# ✅ CHECKLIST: Deploy no Vercel

## 📋 ANTES DO DEPLOY

- [x] Erros de tipos corrigidos
- [x] Build local testado
- [x] Código commitado no Git
- [ ] Variáveis do Supabase em mãos

---

## 🔑 VARIÁVEIS NECESSÁRIAS

Você vai precisar destas informações do Supabase:

### Como pegar no Supabase:
1. Ir em https://supabase.com
2. Selecionar seu projeto
3. **Settings** → **API**
4. Copiar:

```
NEXT_PUBLIC_SUPABASE_URL
└─ Project URL: https://xxxxx.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
└─ anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 PASSO A PASSO

### 1. Fazer Push para GitHub
```bash
cd client-portal
git add .
git commit -m "Deploy: Portal pronto para Vercel"
git push origin main
```

**Ou use o script:**
```bash
deploy.bat
```

- [ ] Push realizado com sucesso

---

### 2. Configurar no Vercel

#### A. Criar Projeto
1. [ ] Acessar https://vercel.com
2. [ ] Clicar em **"Add New Project"**
3. [ ] Importar repositório do GitHub
4. [ ] Selecionar o repositório

#### B. Configurações
```
Framework Preset: Next.js ✓
Root Directory: client-portal
Build Command: npm run build
Output Directory: .next
```

- [ ] Configurações preenchidas

#### C. Variáveis de Ambiente
Adicionar estas 2 variáveis:

```
Nome: NEXT_PUBLIC_SUPABASE_URL
Valor: [colar URL do Supabase]

Nome: NEXT_PUBLIC_SUPABASE_ANON_KEY
Valor: [colar chave anon do Supabase]
```

- [ ] Variáveis adicionadas

#### D. Deploy
1. [ ] Clicar em **"Deploy"**
2. [ ] Aguardar 2-3 minutos
3. [ ] Ver logs do build

---

### 3. Verificar Deploy

#### A. Ver Logs
- [ ] Build completou sem erros
- [ ] Mensagem: "✓ Compiled successfully"
- [ ] Deploy finalizado

#### B. Testar Portal
URL: `https://seu-projeto.vercel.app`

- [ ] Portal abre
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Ordens de serviço aparecem
- [ ] Notificações funcionam

---

## 🎉 DEPLOY CONCLUÍDO!

Se todos os itens acima estão marcados, seu portal está no ar! 🚀

---

## 🐛 SE ALGO DEU ERRADO

### Build falhou?
1. Ver logs no Vercel
2. Verificar variáveis de ambiente
3. Fazer **Redeploy**

### Portal não abre?
1. Verificar URL do Supabase
2. Verificar chave anon
3. Limpar cache do navegador

### Erro de conexão?
1. Verificar se projeto Supabase está ativo
2. Verificar se variáveis estão corretas
3. Testar no Supabase Dashboard

---

## 📞 COMANDOS ÚTEIS

### Redeploy no Vercel:
1. Vercel Dashboard
2. Deployments
3. Três pontinhos → **Redeploy**
4. Desmarcar "Use existing Build Cache"

### Ver logs:
```bash
vercel logs
```

### Limpar cache:
1. Vercel → Settings → General
2. **Clear Build Cache**
3. Fazer redeploy

---

## 🎯 PRÓXIMOS PASSOS

Após deploy bem-sucedido:

- [ ] Configurar domínio personalizado
- [ ] Testar com clientes reais
- [ ] Configurar monitoramento
- [ ] Configurar email de boas-vindas

---

**Tempo total estimado: 10-15 minutos**

