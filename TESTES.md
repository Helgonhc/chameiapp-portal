# 🧪 TESTES DO PORTAL DO CLIENTE

## 📋 CHECKLIST DE TESTES

Depois de configurar tudo, teste estas funcionalidades:

### ✅ 1. Login
- [ ] Login com credenciais corretas funciona
- [ ] Login com credenciais erradas mostra erro
- [ ] Apenas usuários com role 'client' conseguem acessar
- [ ] Técnicos/admins são bloqueados

### ✅ 2. Dashboard
- [ ] Nome do cliente aparece no header
- [ ] Estatísticas mostram números corretos
- [ ] Lista de chamados carrega
- [ ] Status dos chamados aparecem com cores corretas

### ✅ 3. Logout
- [ ] Botão de logout funciona
- [ ] Redireciona para tela de login
- [ ] Não consegue acessar dashboard sem login

---

## 🎯 CRIAR DADOS DE TESTE

### Criar Chamados de Teste

Execute no SQL Editor para criar chamados de teste:

```sql
-- Buscar o client_id do João Silva
SELECT id FROM clients WHERE email = 'joao@teste.com';

-- Criar 3 chamados de teste (substitua CLIENT_ID_AQUI)
INSERT INTO service_orders (client_id, title, description, status, priority, created_at)
VALUES 
  ('CLIENT_ID_AQUI', 'Problema na Cabine Primária', 'Disjuntor não está funcionando corretamente', 'pendente', 'alta', NOW()),
  ('CLIENT_ID_AQUI', 'Manutenção Preventiva', 'Realizar manutenção preventiva mensal', 'em_andamento', 'media', NOW() - INTERVAL '2 days'),
  ('CLIENT_ID_AQUI', 'Instalação de Novo Equipamento', 'Instalar novo transformador', 'concluido', 'baixa', NOW() - INTERVAL '7 days');
```

### Criar Equipamentos de Teste

```sql
-- Criar equipamentos (substitua CLIENT_ID_AQUI)
INSERT INTO equipments (client_id, name, type, model, serial_number, location, status)
VALUES 
  ('CLIENT_ID_AQUI', 'Transformador Principal', 'Transformador', 'TR-500', 'SN123456', 'Sala de Máquinas', 'ativo'),
  ('CLIENT_ID_AQUI', 'Cabine Primária 01', 'Cabine', 'CP-100', 'SN789012', 'Entrada Principal', 'ativo');
```

---

## 🔍 VERIFICAR DADOS

### Ver todos os dados do cliente:

```sql
-- Buscar client_id
SELECT id, name, email, portal_enabled 
FROM clients 
WHERE email = 'joao@teste.com';

-- Ver profile do cliente
SELECT id, full_name, email, role, client_id 
FROM profiles 
WHERE email = 'joao@teste.com';

-- Ver chamados do cliente
SELECT 
  so.id,
  so.title,
  so.status,
  so.priority,
  so.created_at,
  c.name as client_name
FROM service_orders so
JOIN clients c ON c.id = so.client_id
WHERE c.email = 'joao@teste.com'
ORDER BY so.created_at DESC;

-- Ver estatísticas
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
  COUNT(*) FILTER (WHERE status = 'em_andamento') as em_andamento,
  COUNT(*) FILTER (WHERE status = 'concluido') as concluidos
FROM service_orders so
JOIN clients c ON c.id = so.client_id
WHERE c.email = 'joao@teste.com';
```

---

## 🐛 TROUBLESHOOTING

### Problema: Dashboard vazio

**Solução 1**: Verificar se o cliente tem chamados
```sql
SELECT COUNT(*) FROM service_orders so
JOIN clients c ON c.id = so.client_id
WHERE c.email = 'joao@teste.com';
```

Se retornar 0, crie chamados de teste (veja acima).

**Solução 2**: Verificar se o client_id está correto no profile
```sql
SELECT p.id, p.client_id, c.name
FROM profiles p
LEFT JOIN clients c ON c.id = p.client_id
WHERE p.email = 'joao@teste.com';
```

Se client_id for NULL, execute:
```sql
UPDATE profiles 
SET client_id = (SELECT id FROM clients WHERE email = 'joao@teste.com')
WHERE email = 'joao@teste.com';
```

### Problema: Erro ao fazer login

**Verificar role**:
```sql
SELECT id, email, role FROM profiles WHERE email = 'joao@teste.com';
```

Se role não for 'client', corrija:
```sql
UPDATE profiles SET role = 'client' WHERE email = 'joao@teste.com';
```

### Problema: "Acesso negado"

Verifique se o usuário foi criado no Supabase Auth:
1. Supabase Dashboard > Authentication > Users
2. Procure por `joao@teste.com`
3. Se não existir, crie novamente

---

## 📊 QUERIES ÚTEIS

### Ver todos os clientes com acesso ao portal:
```sql
SELECT 
  c.id,
  c.name,
  c.email,
  c.portal_enabled,
  p.full_name as profile_name,
  p.role
FROM clients c
LEFT JOIN profiles p ON p.client_id = c.id
WHERE c.portal_enabled = true;
```

### Ver atividade recente:
```sql
SELECT 
  c.name as cliente,
  so.title as chamado,
  so.status,
  so.created_at
FROM service_orders so
JOIN clients c ON c.id = so.client_id
WHERE c.portal_enabled = true
ORDER BY so.created_at DESC
LIMIT 10;
```

### Estatísticas gerais do portal:
```sql
SELECT 
  COUNT(DISTINCT c.id) as total_clientes_portal,
  COUNT(DISTINCT so.id) as total_chamados_portal,
  COUNT(DISTINCT so.id) FILTER (WHERE so.opened_by_type = 'client') as chamados_abertos_por_clientes
FROM clients c
LEFT JOIN service_orders so ON so.client_id = c.id
WHERE c.portal_enabled = true;
```

---

## 🎯 PRÓXIMOS TESTES

Quando implementarmos mais funcionalidades, teste:

### Abrir Novo Chamado:
- [ ] Formulário valida campos obrigatórios
- [ ] Upload de fotos funciona
- [ ] Chamado aparece na lista imediatamente
- [ ] Técnicos recebem notificação

### Ver Detalhes:
- [ ] Todas as informações aparecem
- [ ] Fotos carregam corretamente
- [ ] Status atualiza em tempo real

### Equipamentos:
- [ ] Lista mostra apenas equipamentos do cliente
- [ ] QR Code funciona
- [ ] Histórico carrega

### Orçamentos:
- [ ] Lista mostra orçamentos pendentes
- [ ] Aprovar/Rejeitar funciona
- [ ] Notificação é enviada

---

## 📝 NOTAS

- Todos os testes devem ser feitos com o portal rodando (`npm run dev`)
- Use o console do navegador (F12) para ver erros
- Verifique o terminal onde o portal está rodando para logs
- Use o Supabase Dashboard para verificar dados no banco

---

## ✅ TUDO FUNCIONANDO?

**Me avise e eu adiciono mais funcionalidades!** 🚀
