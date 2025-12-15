# 🌐 Portal do Cliente

Portal web para clientes abrirem e acompanharem chamados.

## 🚀 Como Rodar

### 1. Instalar Dependências

```bash
cd client-portal
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 3. Rodar em Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3001

### 4. Build para Produção

```bash
npm run build
npm start
```

## 📦 Deploy Gratuito

### Vercel (Recomendado)

1. Crie conta em https://vercel.com
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente
4. Deploy automático!

## 🔐 Login de Teste

- Email: joao@teste.com
- Senha: 123456

(Configure no Supabase conforme guia)
