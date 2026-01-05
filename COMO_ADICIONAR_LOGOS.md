# 📸 Como Adicionar Logos ao Portal

## Onde Colocar as Logos

Coloque suas logos na pasta:
```
client-portal/public/logos/
```

## Arquivos Necessários

### 1. Logo da Empresa Cliente (Principal)
**Nome do arquivo:** `client-logo.png`
- Tamanho recomendado: 200x200px ou maior
- Formato: PNG com fundo transparente (recomendado)
- Também aceita: JPG, SVG

### 2. Logo do ChameiApp (Powered by)
**Nome do arquivo:** `chameiapp-logo.png`
- Tamanho recomendado: 100x100px ou maior
- Formato: PNG com fundo transparente (recomendado)
- Também aceita: JPG, SVG

## Estrutura de Pastas

```
client-portal/
├── public/
│   └── logos/
│       ├── client-logo.png       ← Logo da empresa cliente (Aec)
│       └── chameiapp-logo.png    ← Logo do ChameiApp
```

## Passo a Passo

1. **Crie a pasta** (se não existir):
   ```
   client-portal/public/logos/
   ```

2. **Adicione suas logos**:
   - Renomeie a logo da empresa cliente para `client-logo.png`
   - Renomeie a logo do ChameiApp para `chameiapp-logo.png`
   - Copie ambas para a pasta `client-portal/public/logos/`

3. **Reinicie o servidor** (se estiver rodando):
   ```bash
   cd client-portal
   npm run dev
   ```

4. **Pronto!** As logos vão aparecer automaticamente na tela de login

## Dicas

- Use imagens com fundo transparente (PNG) para melhor resultado
- Logos quadradas funcionam melhor
- Tamanho máximo recomendado: 500KB por imagem
- Se a logo for muito grande, ela será redimensionada automaticamente

## Exemplo de Nomes

✅ **CORRETO:**
- `client-logo.png`
- `chameiapp-logo.png`

❌ **ERRADO:**
- `logo.png`
- `empresa.png`
- `minha-logo.png`

## Trocar o Nome da Empresa

Para trocar "Aec Serviços Especializados" por outro nome, edite o arquivo:
```
client-portal/app/login/page.tsx
```

Procure por:
```typescript
Portal de Chamados da <span>Aec Serviços Especializados</span>
```

E troque pelo nome desejado.
