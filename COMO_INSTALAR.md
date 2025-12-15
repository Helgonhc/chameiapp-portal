# 🚀 Como Instalar o Portal do Cliente

## ✅ PASSO 1: Banco de Dados (5 min)

### 1.1 Executar SQL

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `../database/add_client_portal.sql`
4. Copie TODO o conteúdo
5. Cole e clique em **RUN**

### 1.2 Criar Cliente de Teste

No SQL Editor, execute:

```sql
-- Inserir cliente
INSERT INTO clients (name, email, phone, address)
VALUES ('João Silva', 'joao@teste.com', '11999999999', 'Rua Teste, 123')
RETURNING id;
```

**Anote o ID retornado!**

### 1.3 Criar Usuário no Supabase

1. No Supabase: **Authentication** > **Users** > **Add User**
2. Email: `joao@teste.com`
3. Password: `123456`
4. Auto Confirm User: ✅ **MARQUE ESTA OPÇÃO**
5. Clique em **Create User**
6. **Anote o User ID** (UUID)

### 1.4 Vincular Usuário com Cliente

No SQL Editor (substitua os IDs):

```sql
-- Atualizar cliente
UPDATE clients 
SET 
  portal_enabled = true,
  portal_user_id = 'COLE_USER_ID_AQUI'
WHERE id = 'COLE_CLIENT_ID_AQUI';

-- Criar profile
INSERT INTO profiles (
  id,
  full_name,
  email,
  role,
  client_id,
  is_active
) VALUES (
  'COLE_USER_ID_AQUI',
  'João Silva',
  'joao@teste.com',
  'client',
  'COLE_CLIENT_ID_AQUI',
  true
);
```

---

## ✅ PASSO 2: Configurar Portal (5 min)

### 2.1 Abrir Terminal

```bash
cd client-portal
```

### 2.2 Instalar Dependências

```bash
npm install
```

### 2.3 Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.local.example` para `.env.local`
2. Abra `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

**Onde encontrar:**
- Supabase Dashboard > Settings > API
- Copie a **URL** e a **anon/public key**

---

## ✅ PASSO 3: Rodar o Portal (1 min)

```bash
npm run dev
```

Acesse: **http://localhost:3001**

---

## 🎉 TESTAR

1. Acesse http://localhost:3001
2. Faça login:
   - Email: `joao@teste.com`
   - Senha: `123456`
3. Você verá o dashboard!

---

## 🚀 DEPLOY GRATUITO (Vercel)

### Quando estiver pronto:

1. Crie conta em https://vercel.com (grátis)
2. Clique em **New Project**
3. Importe seu repositório GitHub
4. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique em **Deploy**

**Pronto!** Seu portal estará online em: `https://seu-portal.vercel.app`

---

## ❓ Problemas?

### Erro ao fazer login:
- Verifique se executou o SQL corretamente
- Verifique se marcou "Auto Confirm User"
- Verifique se o role é 'client'

### Erro "Cannot find module":
```bash
npm install
```

### Porta 3001 ocupada:
Edite `package.json` e mude `-p 3001` para outra porta.

---

## 📝 Próximos Passos

Agora você tem:
- ✅ Login funcionando
- ✅ Dashboard com estatísticas
- ✅ Lista de chamados

**Quer adicionar mais funcionalidades?**
- Formulário para abrir novos chamados
- Ver detalhes de cada chamado
- Upload de fotos
- Chat com técnicos

**Me avise que eu adiciono!** 🚀
