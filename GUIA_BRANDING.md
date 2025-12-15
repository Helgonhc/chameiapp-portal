# 🎨 Guia de Branding - White Label

## Como Personalizar para Cada Cliente

Você **NÃO precisa editar código**! Basta editar o arquivo `.env.local`

### Passo a Passo

#### 1. Edite o arquivo `.env.local`

Abra o arquivo `client-portal/.env.local` e edite estas linhas:

```env
# NOME DA EMPRESA CLIENTE
NEXT_PUBLIC_CLIENT_NAME="Aec Serviços Especializados"

# COR PRINCIPAL (hex sem #)
NEXT_PUBLIC_CLIENT_COLOR="9333ea"

# LOGO DA EMPRESA (arquivo em public/logos/)
NEXT_PUBLIC_CLIENT_LOGO="client-logo.png"
```

#### 2. Adicione a Logo

Coloque a logo da empresa em:
```
client-portal/public/logos/client-logo.png
```

Ou use outro nome e atualize no `.env.local`

#### 3. Reinicie o Servidor

```bash
cd client-portal
npm run dev
```

Pronto! O portal está personalizado!

---

## Exemplos de Configuração

### Para VHN Tecnologia

```env
NEXT_PUBLIC_CLIENT_NAME="VHN Tecnologia"
NEXT_PUBLIC_CLIENT_COLOR="ef4444"
NEXT_PUBLIC_CLIENT_LOGO="vhn-logo.png"
```

Logo: `client-portal/public/logos/vhn-logo.png`

### Para Eletricom

```env
NEXT_PUBLIC_CLIENT_NAME="Eletricom"
NEXT_PUBLIC_CLIENT_COLOR="8b5cf6"
NEXT_PUBLIC_CLIENT_LOGO="eletricom-logo.png"
```

Logo: `client-portal/public/logos/eletricom-logo.png`

### Para Aec Serviços

```env
NEXT_PUBLIC_CLIENT_NAME="Aec Serviços Especializados"
NEXT_PUBLIC_CLIENT_COLOR="9333ea"
NEXT_PUBLIC_CLIENT_LOGO="aec-logo.png"
```

Logo: `client-portal/public/logos/aec-logo.png`

---

## Cores Sugeridas

| Cor | Hex | Exemplo |
|-----|-----|---------|
| Azul | `3b82f6` | Tecnologia |
| Roxo | `9333ea` | Criativo |
| Verde | `10b981` | Sustentável |
| Vermelho | `ef4444` | Energia |
| Laranja | `f97316` | Dinâmico |
| Rosa | `ec4899` | Moderno |

---

## Estrutura de Arquivos

```
client-portal/
├── .env.local              ← EDITE AQUI!
├── public/
│   └── logos/
│       ├── client-logo.png       ← Logo do cliente
│       └── chameiapp-logo.png    ← Logo do ChameiApp
```

---

## Checklist de Deploy

Quando for fazer deploy para um novo cliente:

- [ ] Editar `.env.local` com nome e cor
- [ ] Adicionar logo em `public/logos/`
- [ ] Reiniciar servidor
- [ ] Testar tela de login
- [ ] Verificar se nome e cor estão corretos

---

## Dúvidas Comuns

**P: Preciso editar código?**
R: NÃO! Só edite o `.env.local`

**P: A logo não aparece?**
R: Verifique se o nome do arquivo está correto no `.env.local` e se está em `public/logos/`

**P: Como escolher a cor?**
R: Use um color picker online e copie o código hex sem o #

**P: Posso usar SVG?**
R: Sim! Basta colocar `.svg` no nome do arquivo

---

## Suporte

Criado por: Helgon Henrique
Sistema: ChameiApp
