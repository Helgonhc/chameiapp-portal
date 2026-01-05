# ⚡ Dicas de Otimização - Portal do Cliente

## 🚀 Performance

### 1. Imagens
```typescript
// ✅ BOM: Comprimir antes de enviar
const compressImage = async (file: File) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  }
  return await imageCompression(file, options)
}

// ❌ RUIM: Enviar imagens grandes sem compressão
```

### 2. Lazy Loading
```typescript
// ✅ BOM: Carregar componentes sob demanda
const OrderDetails = dynamic(() => import('./OrderDetails'), {
  loading: () => <LoadingSpinner />
})

// ❌ RUIM: Importar tudo de uma vez
```

### 3. Memoização
```typescript
// ✅ BOM: Memorizar cálculos pesados
const filteredOrders = useMemo(() => {
  return orders.filter(order => /* filtros */)
}, [orders, filters])

// ❌ RUIM: Recalcular a cada render
```

---

## 🎨 CSS e Tailwind

### 1. Evitar Classes Dinâmicas
```typescript
// ❌ RUIM: Classes dinâmicas não funcionam com Tailwind
className={`bg-${color}-500`}

// ✅ BOM: Usar classes completas
className={color === 'blue' ? 'bg-blue-500' : 'bg-red-500'}
```

### 2. Reutilizar Estilos
```typescript
// ✅ BOM: Criar componentes reutilizáveis
const Card = ({ children }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    {children}
  </div>
)

// ❌ RUIM: Repetir classes em todo lugar
```

### 3. Purge CSS
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // Isso remove CSS não utilizado
}
```

---

## 🔄 Estado e Dados

### 1. Debounce em Buscas
```typescript
// ✅ BOM: Esperar usuário parar de digitar
const debouncedSearch = useMemo(
  () => debounce((value) => setSearchTerm(value), 300),
  []
)

// ❌ RUIM: Buscar a cada tecla
```

### 2. Paginação
```typescript
// ✅ BOM: Carregar dados em páginas
const { data, fetchNextPage } = useInfiniteQuery(...)

// ❌ RUIM: Carregar tudo de uma vez
```

### 3. Cache de Dados
```typescript
// ✅ BOM: Usar React Query ou SWR
const { data } = useQuery('orders', fetchOrders, {
  staleTime: 5 * 60 * 1000, // 5 minutos
})

// ❌ RUIM: Buscar sempre do servidor
```

---

## 📱 Mobile e Responsividade

### 1. Touch Targets
```css
/* ✅ BOM: Botões grandes para mobile */
.button {
  min-height: 44px;
  min-width: 44px;
}

/* ❌ RUIM: Botões pequenos */
```

### 2. Viewport Units
```css
/* ✅ BOM: Usar vh com cuidado */
min-height: calc(100vh - 64px);

/* ❌ RUIM: 100vh em mobile (barra de endereço) */
min-height: 100vh;
```

### 3. Imagens Responsivas
```typescript
// ✅ BOM: Usar srcset
<img 
  src="image.jpg"
  srcSet="image-small.jpg 480w, image-large.jpg 1080w"
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// ❌ RUIM: Uma imagem para todos os tamanhos
```

---

## 🔐 Segurança

### 1. Validação de Inputs
```typescript
// ✅ BOM: Validar no cliente E servidor
const schema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
})

// ❌ RUIM: Confiar apenas no cliente
```

### 2. Sanitização
```typescript
// ✅ BOM: Limpar dados antes de salvar
const sanitized = DOMPurify.sanitize(userInput)

// ❌ RUIM: Salvar input direto
```

### 3. Rate Limiting
```typescript
// ✅ BOM: Limitar requisições
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requisições
})

// ❌ RUIM: Sem limite
```

---

## 🎯 UX e Acessibilidade

### 1. Loading States
```typescript
// ✅ BOM: Mostrar feedback visual
{loading ? <Spinner /> : <Content />}

// ❌ RUIM: Tela congelada sem feedback
```

### 2. Error Boundaries
```typescript
// ✅ BOM: Capturar erros
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>

// ❌ RUIM: Deixar app quebrar
```

### 3. Aria Labels
```typescript
// ✅ BOM: Acessibilidade
<button aria-label="Fechar modal">
  <X />
</button>

// ❌ RUIM: Sem labels
```

---

## 📊 Monitoramento

### 1. Analytics
```typescript
// ✅ BOM: Rastrear eventos importantes
trackEvent('ticket_created', {
  priority: 'alta',
  type: 'maintenance'
})

// ❌ RUIM: Não saber como usuários usam
```

### 2. Error Tracking
```typescript
// ✅ BOM: Usar Sentry ou similar
Sentry.captureException(error)

// ❌ RUIM: Apenas console.log
```

### 3. Performance Monitoring
```typescript
// ✅ BOM: Medir Core Web Vitals
export function reportWebVitals(metric) {
  console.log(metric)
}

// ❌ RUIM: Não medir performance
```

---

## 🗄️ Banco de Dados

### 1. Índices
```sql
-- ✅ BOM: Criar índices em colunas filtradas
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_client ON tickets(client_id);

-- ❌ RUIM: Sem índices
```

### 2. Select Específico
```typescript
// ✅ BOM: Buscar apenas o necessário
.select('id, title, status')

// ❌ RUIM: Buscar tudo
.select('*')
```

### 3. Paginação no Banco
```typescript
// ✅ BOM: Limitar no banco
.range(0, 9) // Primeiros 10

// ❌ RUIM: Buscar tudo e filtrar no cliente
```

---

## 🔄 Real-time

### 1. Subscriptions Específicas
```typescript
// ✅ BOM: Ouvir apenas o necessário
supabase
  .channel('tickets')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'tickets',
    filter: `client_id=eq.${clientId}`
  }, handleNewTicket)

// ❌ RUIM: Ouvir tudo
```

### 2. Debounce em Updates
```typescript
// ✅ BOM: Agrupar updates
const debouncedUpdate = debounce(updateServer, 1000)

// ❌ RUIM: Update a cada mudança
```

---

## 📦 Build e Deploy

### 1. Code Splitting
```typescript
// ✅ BOM: Dividir código
const Dashboard = lazy(() => import('./Dashboard'))

// ❌ RUIM: Bundle único gigante
```

### 2. Variáveis de Ambiente
```bash
# ✅ BOM: Usar .env
NEXT_PUBLIC_SUPABASE_URL=...

# ❌ RUIM: Hardcoded
```

### 3. Otimização de Build
```javascript
// next.config.js
module.exports = {
  swcMinify: true,
  images: {
    domains: ['supabase.co'],
  },
  compress: true,
}
```

---

## 🧪 Testes

### 1. Testes Unitários
```typescript
// ✅ BOM: Testar lógica crítica
test('should filter orders by status', () => {
  const filtered = filterOrders(orders, 'aberto')
  expect(filtered).toHaveLength(2)
})

// ❌ RUIM: Sem testes
```

### 2. Testes E2E
```typescript
// ✅ BOM: Testar fluxos principais
test('should create ticket', async () => {
  await page.goto('/new-order')
  await page.fill('[name="title"]', 'Test')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})

// ❌ RUIM: Testar apenas manualmente
```

---

## 📈 Métricas Importantes

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Performance
- **Time to Interactive**: < 3.8s
- **First Contentful Paint**: < 1.8s
- **Speed Index**: < 3.4s

### Bundle Size
- **JavaScript**: < 200KB (gzipped)
- **CSS**: < 50KB (gzipped)
- **Images**: Otimizadas e lazy loaded

---

## 🎯 Checklist de Otimização

### Antes de Deploy
- [ ] Imagens otimizadas
- [ ] CSS purgado
- [ ] JavaScript minificado
- [ ] Lazy loading implementado
- [ ] Cache configurado
- [ ] Error tracking ativo
- [ ] Analytics configurado
- [ ] Testes passando
- [ ] Lighthouse score > 90
- [ ] Acessibilidade verificada

### Monitoramento Contínuo
- [ ] Core Web Vitals
- [ ] Taxa de erro
- [ ] Tempo de resposta
- [ ] Taxa de conversão
- [ ] Feedback dos usuários

---

## 🔧 Ferramentas Recomendadas

### Performance
- **Lighthouse**: Auditoria de performance
- **WebPageTest**: Teste de velocidade
- **Bundle Analyzer**: Análise de bundle

### Monitoramento
- **Sentry**: Error tracking
- **Google Analytics**: Analytics
- **Vercel Analytics**: Performance

### Desenvolvimento
- **React DevTools**: Debug
- **Redux DevTools**: Estado
- **Network Tab**: Requisições

---

**Otimize sempre! 🚀**

**Desenvolvido por**: Helgon Henrique  
**Data**: Dezembro 2024
