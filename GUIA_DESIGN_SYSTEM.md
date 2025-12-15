# 🎨 Design System - Portal do Cliente

## 📐 Estrutura Visual

### Layout Base
```
┌─────────────────────────────────────┐
│  Header (bg-white, shadow-sm)       │
├─────────────────────────────────────┤
│                                     │
│  Main Content (bg-gradient)         │
│  ┌───────────────────────────────┐  │
│  │  Card (bg-white, rounded-xl)  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  Icon + Title           │  │  │
│  │  ├─────────────────────────┤  │  │
│  │  │  Content                │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 Paleta de Cores

### Gradientes por Seção

#### 1. Informações (Azul/Índigo)
```css
bg-gradient-to-br from-blue-500 to-indigo-600
```
- **Uso**: Título, Descrição
- **Ícone**: FileText
- **Cor do texto**: text-white

#### 2. Prioridade (Laranja/Vermelho)
```css
bg-gradient-to-br from-orange-500 to-red-600
```
- **Uso**: Seleção de prioridade
- **Ícone**: Zap
- **Variações**:
  - 🟢 Baixa: border-green-500, bg-green-50
  - 🟡 Média: border-yellow-500, bg-yellow-50
  - 🔴 Alta: border-red-500, bg-red-50

#### 3. Manutenção (Roxo/Rosa)
```css
bg-gradient-to-br from-purple-500 to-pink-600
```
- **Uso**: Tipo de manutenção
- **Ícone**: Wrench
- **Card info**: border-purple-500, bg-purple-50

#### 4. Equipamento (Ciano/Azul)
```css
bg-gradient-to-br from-cyan-500 to-blue-600
```
- **Uso**: Seleção de equipamento
- **Ícone**: Wrench
- **Hover**: hover:bg-white

#### 5. Fotos (Verde/Teal)
```css
bg-gradient-to-br from-green-500 to-teal-600
```
- **Uso**: Upload de fotos
- **Ícone**: ImageIcon
- **Hover**: hover:border-blue-500, hover:bg-blue-50

#### 6. Sucesso (Verde/Esmeralda)
```css
bg-gradient-to-br from-green-400 to-emerald-500
```
- **Uso**: Tela de confirmação
- **Ícone**: CheckCircle2
- **Background**: from-green-50 via-emerald-50 to-teal-50

---

## 🧩 Componentes

### Card Base
```tsx
<div className="bg-white rounded-xl shadow-lg p-6">
  {/* Conteúdo */}
</div>
```

### Card Header com Ícone
```tsx
<div className="flex items-center gap-3 mb-6">
  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
    <FileText className="w-6 h-6 text-white" />
  </div>
  <div>
    <h2 className="text-xl font-bold">Título</h2>
    <p className="text-sm text-gray-600">Subtítulo</p>
  </div>
</div>
```

### Input Estilizado
```tsx
<input 
  type="text"
  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Digite aqui..."
/>
```

### Select Estilizado
```tsx
<select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors">
  <option>Opção 1</option>
</select>
```

### Botão de Prioridade
```tsx
<button 
  type="button"
  className="p-5 rounded-xl border-2 transition-all transform hover:scale-105 border-green-500 bg-green-50 scale-105 shadow-lg"
>
  <div className="text-3xl mb-2">🟢</div>
  <h3 className="font-bold text-green-700">Baixa</h3>
  <p className="text-xs text-gray-500 mt-1">Não urgente</p>
</button>
```

### Área de Upload
```tsx
<label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group">
  <div className="text-center">
    <Upload className="w-16 h-16 text-gray-400 group-hover:text-blue-500 mb-3 mx-auto transition-colors" />
    <p className="text-base font-medium text-gray-700 group-hover:text-blue-600">Clique para adicionar</p>
  </div>
  <input type="file" className="hidden" />
</label>
```

### Card de Foto
```tsx
<div className="relative group">
  <img src={photo} className="w-full h-32 object-cover rounded-lg border-2 border-gray-200" />
  <button className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg">
    <X className="w-4 h-4" />
  </button>
  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
    Foto 1
  </div>
</div>
```

### Botão Primário
```tsx
<button className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
  ✨ Criar Chamado
</button>
```

### Botão Secundário
```tsx
<button className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
  Cancelar
</button>
```

### Card Informativo
```tsx
<div className="mt-3 p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
  <p className="text-sm text-purple-900">
    ℹ️ Informação importante aqui
  </p>
</div>
```

---

## 🎭 Animações

### Fade In
```css
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
```

### Bounce Slow
```css
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}
```

### Hover Scale
```css
.hover:scale-105 {
  transition: transform 0.2s ease-in-out;
}
.hover:scale-105:hover {
  transform: scale(1.05);
}
```

### Transition All
```css
.transition-all {
  transition: all 0.3s ease-in-out;
}
```

---

## 📏 Espaçamentos

### Padding
- **Card**: `p-6` (24px)
- **Card Header**: `mb-6` (24px)
- **Input**: `px-4 py-3` (16px horizontal, 12px vertical)
- **Button**: `px-6 py-4` (24px horizontal, 16px vertical)

### Gap
- **Header Icon + Text**: `gap-3` (12px)
- **Grid de Fotos**: `gap-4` (16px)
- **Botões**: `gap-4` (16px)

### Margin
- **Entre Seções**: `mb-6` (24px)
- **Entre Elementos**: `mb-3` ou `mb-4` (12px ou 16px)

---

## 🔤 Tipografia

### Títulos
```css
/* H1 - Header Principal */
text-3xl font-bold text-gray-900

/* H2 - Título de Seção */
text-xl font-bold text-gray-900

/* H3 - Subtítulo */
text-lg font-semibold text-gray-900
```

### Textos
```css
/* Parágrafo Normal */
text-base text-gray-700

/* Texto Pequeno */
text-sm text-gray-600

/* Texto Extra Pequeno */
text-xs text-gray-500
```

### Labels
```css
/* Label de Input */
text-sm font-medium text-gray-700

/* Label de Info */
text-xs text-gray-400
```

---

## 🎯 Estados

### Focus
```css
focus:ring-2 focus:ring-blue-500 focus:border-transparent
```

### Hover
```css
hover:bg-gray-50
hover:border-blue-500
hover:scale-105
```

### Disabled
```css
disabled:opacity-50
disabled:cursor-not-allowed
```

### Active/Selected
```css
border-green-500 bg-green-50 scale-105 shadow-lg
```

---

## 📱 Breakpoints

### Mobile First
```css
/* Mobile (default) */
grid-cols-2

/* Tablet (768px+) */
md:grid-cols-3

/* Desktop (1024px+) */
lg:grid-cols-4
```

### Responsividade
```css
/* Mobile */
w-full

/* Desktop */
lg:w-auto lg:flex-1
```

---

## 🎨 Ícones (Lucide React)

### Tamanhos
- **Pequeno**: `w-4 h-4` (16px)
- **Médio**: `w-5 h-5` (20px)
- **Grande**: `w-6 h-6` (24px)
- **Extra Grande**: `w-12 h-12` ou `w-16 h-16`

### Cores
- **Branco**: `text-white`
- **Cinza**: `text-gray-400` ou `text-gray-600`
- **Colorido**: Herda do gradiente do container

---

## 🔧 Utilitários

### Sombras
```css
shadow-sm    /* Pequena */
shadow-lg    /* Grande */
shadow-xl    /* Extra Grande */
shadow-2xl   /* Máxima */
```

### Bordas
```css
rounded-lg   /* 8px */
rounded-xl   /* 12px */
rounded-2xl  /* 16px */
rounded-full /* 50% */
```

### Opacidade
```css
opacity-0    /* Invisível */
opacity-50   /* 50% */
opacity-100  /* Visível */
```

---

## 📋 Checklist de Consistência

Ao criar novos componentes, verifique:
- [ ] Usa a paleta de cores definida
- [ ] Tem sombras e bordas arredondadas
- [ ] Inclui animações de hover
- [ ] É responsivo (mobile first)
- [ ] Tem estados de focus/hover/disabled
- [ ] Usa ícones do Lucide React
- [ ] Segue os espaçamentos padrão
- [ ] Tem feedback visual claro

---

**Design System v1.0**  
**Desenvolvido por**: Helgon Henrique  
**Data**: Dezembro 2024
