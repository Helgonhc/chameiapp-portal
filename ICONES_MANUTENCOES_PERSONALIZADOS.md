# 🎨 Ícones Personalizados para Manutenções

## 🎯 Implementação

Cada tipo de manutenção agora tem **ícone, cores e gradientes únicos** que representam visualmente a atividade.

---

## 🔧 Tipos de Manutenção e Seus Ícones

### 1. 🌡️ **Termografia**
```
Ícone: Gráfico de barras (temperatura)
Gradiente: Vermelho → Laranja
Cores: from-red-500 to-orange-600
Hover: border-red-300
```
**Representa**: Medição de temperatura, análise térmica

### 2. ⚡ **Cabine Primária**
```
Ícone: Raio (energia elétrica)
Gradiente: Azul → Ciano
Cores: from-blue-500 to-cyan-600
Hover: border-blue-300
```
**Representa**: Alta tensão, energia elétrica

### 3. 🌩️ **SPDA (Para-raios)**
```
Ícone: Raio com cruz (proteção)
Gradiente: Amarelo → Âmbar
Cores: from-yellow-500 to-amber-600
Hover: border-yellow-300
```
**Representa**: Proteção contra descargas atmosféricas

### 4. 📦 **Caixas de Passagem**
```
Ícone: Cubo 3D (caixa)
Gradiente: Esmeralda → Teal
Cores: from-emerald-500 to-teal-600
Hover: border-emerald-300
```
**Representa**: Estrutura, contenção, passagem

### 5. 🔌 **Quadros Elétricos**
```
Ícone: Painel com grade
Gradiente: Índigo → Roxo
Cores: from-indigo-500 to-purple-600
Hover: border-indigo-300
```
**Representa**: Distribuição elétrica, painéis

### 6. 🔄 **Transformador**
```
Ícone: Ondas conectadas
Gradiente: Violeta → Fúcsia
Cores: from-violet-500 to-fuchsia-600
Hover: border-violet-300
```
**Representa**: Transformação de energia

### 7. 💡 **Gerador**
```
Ícone: Lâmpada com raios
Gradiente: Laranja → Vermelho
Cores: from-orange-500 to-red-600
Hover: border-orange-300
```
**Representa**: Geração de energia

### 8. ⚙️ **Genérico (Padrão)**
```
Ícone: Engrenagem com configurações
Gradiente: Roxo → Rosa
Cores: from-purple-500 to-pink-600
Hover: border-purple-300
```
**Representa**: Manutenção geral

---

## 🎨 Estrutura Visual

### Card de Manutenção
```
┌─────────────────────────────────┐
│  ○ (círculo decorativo)         │
│  ┌───────┐              [Badge] │
│  │  🔧   │  Termografia          │
│  │ Ícone │                       │
│  └───────┘                       │
│  Descrição da manutenção...     │
│                                  │
│  Solicitar manutenção →         │
└─────────────────────────────────┘
```

### Elementos Visuais
1. **Círculo Decorativo**: Gradiente suave no canto
2. **Container do Ícone**: Gradiente forte + sombra
3. **Badge**: Frequência da manutenção
4. **Título**: Muda de cor no hover
5. **Descrição**: 2 linhas com ellipsis
6. **CTA**: Seta animada

---

## 🎯 Lógica de Detecção

O sistema detecta automaticamente o tipo pela palavra-chave no nome:

```typescript
const getMaintenanceIcon = (name: string) => {
  const nameLower = name.toLowerCase()
  
  if (nameLower.includes('termografia')) return termografiaStyle
  if (nameLower.includes('cabine')) return cabineStyle
  if (nameLower.includes('spda')) return spdaStyle
  // ... etc
}
```

### Palavras-chave Detectadas
- **Termografia**: "termografia", "térmica"
- **Cabine**: "cabine", "primária"
- **SPDA**: "spda", "descarga", "para-raios"
- **Caixas**: "caixa", "passagem"
- **Quadros**: "quadro", "elétrico", "painel"
- **Transformador**: "transformador"
- **Gerador**: "gerador"

---

## 💫 Animações

### Hover no Card
```css
- shadow-sm → shadow-xl
- border-slate-200 → border-[cor específica]
- Ícone: scale-100 → scale-110
- Título: text-slate-900 → text-[cor específica]
- Seta: translate-x-0 → translate-x-1
```

### Transições
```css
transition-all duration-300
```

---

## 🎨 Paleta de Cores por Tipo

### Quentes (Energia/Calor)
- 🔴 Termografia: Vermelho/Laranja
- 🟠 Gerador: Laranja/Vermelho
- 🟡 SPDA: Amarelo/Âmbar

### Frias (Estrutura/Elétrica)
- 🔵 Cabine: Azul/Ciano
- 🟣 Quadros: Índigo/Roxo
- 🟢 Caixas: Esmeralda/Teal

### Especiais
- 🟣 Transformador: Violeta/Fúcsia
- 🟣 Genérico: Roxo/Rosa

---

## 📱 Responsividade

### Mobile
- Ícone: 28px (w-7 h-7)
- Padding: 24px (p-6)
- Grid: 1 coluna

### Tablet
- Ícone: 28px (w-7 h-7)
- Padding: 24px (p-6)
- Grid: 2 colunas

### Desktop
- Ícone: 28px (w-7 h-7)
- Padding: 24px (p-6)
- Grid: 3 colunas

---

## ✨ Detalhes Premium

### Container do Ícone
```css
- Gradiente específico por tipo
- Sombra: shadow-lg
- Hover: scale-110
- Rounded: rounded-xl
- Padding: p-3
```

### Badge de Frequência
```css
- Background: bg-slate-100
- Texto: text-slate-700
- Border: border-slate-200
- Rounded: rounded-full
- Padding: px-2 py-1
```

### Círculo Decorativo
```css
- Gradiente com 10% opacidade
- Posição: top-right
- Tamanho: 96px (w-24 h-24)
- Overflow: -mr-12 -mt-12
```

---

## 🔄 Integração com App Mobile

### Quando o Cliente Solicita
1. ✅ Chamado criado com `maintenance_type_id`
2. ✅ Campo `opened_by_type` = 'client'
3. ✅ Status inicial = 'aberto'
4. ✅ Prioridade = 'media'

### No App Mobile
O chamado aparece automaticamente na **área de Manutenções** porque:
- Tem `maintenance_type_id` preenchido
- Sistema filtra por esse campo
- Técnico vê na lista de manutenções periódicas

---

## 🎯 Vantagens dos Ícones Personalizados

### Visual
- ✅ Identificação rápida
- ✅ Profissional e moderno
- ✅ Cores intuitivas
- ✅ Hierarquia clara

### UX
- ✅ Fácil de encontrar
- ✅ Memorável
- ✅ Atrativo
- ✅ Confiável

### Técnico
- ✅ Detecção automática
- ✅ Extensível (fácil adicionar novos)
- ✅ Fallback para genérico
- ✅ Performance otimizada

---

## 🚀 Como Adicionar Novo Tipo

### 1. Criar no Banco
```sql
INSERT INTO maintenance_types (name, description, default_frequency)
VALUES ('Novo Tipo', 'Descrição', 'Mensal');
```

### 2. Adicionar Ícone no Código
```typescript
if (nameLower.includes('novo')) {
  return {
    gradient: 'from-cor1 to-cor2',
    bgGradient: 'from-cor1/10 to-cor2/10',
    hoverBorder: 'hover:border-cor1-300',
    textColor: 'group-hover:text-cor1-600',
    icon: (
      <svg>...</svg>
    )
  }
}
```

### 3. Pronto!
O sistema detecta automaticamente e aplica o estilo.

---

## 📊 Resultado Final

Cada manutenção agora tem:
- ✅ Ícone único e representativo
- ✅ Cores específicas e intuitivas
- ✅ Animações suaves
- ✅ Visual premium
- ✅ Fácil identificação
- ✅ Integração com app mobile

**Design profissional que impressiona! 🎨**

---

**Desenvolvido por**: Helgon Henrique  
**Data**: Dezembro 2024  
**Feature**: Ícones Personalizados para Manutenções
