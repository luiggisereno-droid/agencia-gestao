# Gestão de Contas — Painel da Agência

## Como publicar no Vercel (opção mais fácil)

### Passo 1 — Crie uma conta
Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita (pode entrar com Google).

### Passo 2 — Suba o projeto
1. No painel da Vercel, clique em **"Add New Project"**
2. Clique em **"Import from CLI"** ou use o botão de upload
3. Arraste a pasta inteira `agencia-app` ou faça upload do ZIP

### Passo 3 — Configure e publique
- Framework: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Clique em **Deploy**

Em ~2 minutos você terá um link tipo: `agencia-gestao.vercel.app`

---

## Como publicar no CodeSandbox (sem instalar nada)

1. Acesse [codesandbox.io](https://codesandbox.io)
2. Clique em **"Create Sandbox"** → **"Import from ZIP"**
3. Faça upload do arquivo ZIP desta pasta
4. Aguarde carregar — o link já fica disponível automaticamente

---

## Rodar localmente (opcional)

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173
