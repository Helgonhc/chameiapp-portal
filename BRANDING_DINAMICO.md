# 🎨 Branding Dinâmico do Portal

## Como Funciona

O portal agora busca as informações de branding (logo, cores, nome, endereço, etc) **diretamente do banco de dados** na tabela `clients`.

### Antes (Estático)
```env
# .env.local
NEXT_PUBLIC_CLIENT_NAME=Aec Serviços
NEXT_PUBLIC_CLIENT_COLOR=0066cc
NEXT_PUBLIC_CLIENT_LOGO=client-logo.png
```

### Agora (Dinâmico)
As informações são buscadas do banco de dados automaticamente!

## 📋 Passo a Passo

### 1. Executar SQL
Execute o arquivo no Supabase:
```
database/add_client_branding.sql
```

Este SQL:
- ✅ Cria/atualiza a tabela `clients` com campos de branding
- ✅ Adiciona campos: `logo_url`, `primary_color`, `portal_welcome_message`, etc
- ✅ Insere um cliente exemplo (Aec Serviços)
- ✅ Configura RLS para segurança

### 2. Cadastrar Cliente no Banco

```sql
INSERT INTO clients (
  name,
  company_name,
  email,
  phone,
  address,
  city,
  state,
  zip_code,
  logo_url,
  primary_color,
  portal_welcome_message,
  portal_enabled,
  portal_subdomain,
  contact_person
) VALUES (
  'VHN Tecnologia',
  'VHN Tecnologia LTDA',
  'contato@vhn.com.br',
  '(11) 99999-8888',
  'Av. Paulista, 1000',
  'São Paulo',
  'SP',
  '01310-100',
  '/logos/vhn-logo.png',
  '#FF6B00',
  'Bem-vindo ao Portal de Suporte da VHN Tecnologia',
  true,
  'vhn',
  'Maria Santos'
);
```

### 3. Upload da Logo

Coloque a logo do cliente em:
```
client-portal/public/logos/vhn-logo.png
```

### 4. Pronto!

O portal automaticamente:
- ✅ Busca os dados do banco
- ✅ Exibe a logo do cliente
- ✅ Aplica a cor primária
- ✅ Mostra a mensagem de boas-vindas personalizada
- ✅ Exibe informações de contato

## 🗄️ Campos da Tabela `clients`

### Informações Básicas
- `name` - Nome da empresa
- `company_name` - Razão social
- `cnpj_cpf` - CNPJ ou CPF
- `email` - Email principal
- `phone` - Telefone fixo
- `mobile` - Celular

### Endereço
- `address` - Endereço completo
- `city` - Cidade
- `state` - Estado (UF)
- `zip_code` - CEP
- `website` - Site da empresa

### Branding
- `logo_url` - Caminho da logo (ex: `/logos/empresa.png`)
- `primary_color` - Cor principal (hex: `#0066cc`)
- `secondary_color` - Cor secundária
- `portal_welcome_message` - Mensagem de boas-vindas personalizada

### Portal
- `portal_enabled` - Habilitar portal (true/false)
- `portal_subdomain` - Subdomínio único (ex: `vhn`, `aec`)

### Contato
- `contact_person` - Pessoa de contato
- `contact_email` - Email do contato
- `contact_phone` - Telefone do contato

### Configurações
- `timezone` - Fuso horário (padrão: `America/Sao_Paulo`)
- `language` - Idioma (padrão: `pt-BR`)
- `currency` - Moeda (padrão: `BRL`)

## 🎯 Onde os Dados Aparecem

### Página de Login
- ✅ Logo da empresa (grande, centralizada)
- ✅ Mensagem de boas-vindas personalizada
- ✅ Nome da empresa com cor personalizada

### Dashboard
- ✅ Nome da empresa no header
- ✅ Dados do cliente disponíveis para uso futuro
- ✅ Cor primária aplicada nos botões

### Futuro (Sugestões)
- Footer com endereço e contato da empresa
- Página "Sobre" com informações da empresa
- Email de notificações com logo da empresa
- PDFs com logo e dados da empresa

## 🔄 Fallback

Se houver erro ao buscar do banco, o sistema usa os valores do `.env.local` como backup:

```typescript
// Fallback automático
setBranding({
  name: process.env.NEXT_PUBLIC_CLIENT_NAME || 'Portal do Cliente',
  logo_url: `/logos/${process.env.NEXT_PUBLIC_CLIENT_LOGO}`,
  primary_color: `#${process.env.NEXT_PUBLIC_CLIENT_COLOR}`,
  portal_welcome_message: null
})
```

## 🚀 Vantagens

### Antes (Estático)
- ❌ Precisa editar código para cada cliente
- ❌ Precisa recompilar e fazer deploy
- ❌ Difícil de gerenciar múltiplos clientes
- ❌ Não tem dados de endereço/contato

### Agora (Dinâmico)
- ✅ Cadastra cliente direto no banco
- ✅ Sem necessidade de recompilar
- ✅ Fácil gerenciar múltiplos clientes
- ✅ Todos os dados da empresa disponíveis
- ✅ Admin pode editar pelo painel
- ✅ Suporte a múltiplos portais (subdomínios)

## 📝 Exemplo de Uso

### Cadastrar Novo Cliente

```sql
-- 1. Inserir cliente
INSERT INTO clients (
  name,
  company_name,
  email,
  phone,
  address,
  city,
  state,
  logo_url,
  primary_color,
  portal_welcome_message,
  portal_enabled,
  portal_subdomain
) VALUES (
  'Eletricom',
  'Eletricom Instalações Elétricas',
  'contato@eletricom.com.br',
  '(11) 3333-4444',
  'Rua das Flores, 456',
  'São Paulo',
  'SP',
  '/logos/eletricom-logo.png',
  '#FFD700',
  'Bem-vindo ao Portal da Eletricom - Soluções em Elétrica',
  true,
  'eletricom'
) RETURNING id;

-- 2. Associar usuários ao cliente
UPDATE profiles 
SET client_id = 'ID_DO_CLIENTE_ACIMA'
WHERE email IN ('cliente1@eletricom.com.br', 'cliente2@eletricom.com.br');
```

### Atualizar Branding

```sql
UPDATE clients
SET 
  logo_url = '/logos/nova-logo.png',
  primary_color = '#FF0000',
  portal_welcome_message = 'Nova mensagem de boas-vindas'
WHERE id = 'ID_DO_CLIENTE';
```

## 🔐 Segurança

- ✅ RLS ativo na tabela `clients`
- ✅ Clientes só veem seus próprios dados
- ✅ Staff (admin/técnico) vê todos os clientes
- ✅ Apenas admin pode editar clientes

## 🎨 Personalização Avançada

No futuro, você pode adicionar mais campos:

```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_js TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS social_media JSONB;
```

## 📞 Suporte

Agora você tem todas as informações da empresa no banco:
- Nome, endereço, telefone
- Logo e cores
- Mensagens personalizadas
- Dados de contato

Tudo dinâmico e fácil de gerenciar! 🎉

---

**Desenvolvido por Helgon Henrique**
**Powered by ChameiApp**
