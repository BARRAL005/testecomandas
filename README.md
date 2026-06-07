# 🏎️ PitStop — Sistema Inteligente de Comandas & Gestão

PitStop é uma plataforma full-stack moderna e de alta performance projetada para automação de bares, restaurantes e estabelecimentos de entretenimento. O sistema permite o fluxo completo de abertura de comandas, adição e atualização de itens em tempo real, liquidação financeira com múltiplos métodos de pagamento e geração automatizada de relatórios.

---

## ✨ Funcionalidades Principais

*   **📊 Painel Estatístico & Relatórios**: Monitoramento unificado do faturamento diário (valores recebidos, valores pendentes em aberto e fluxo geral de consumo).
*   **📄 Exportação de Desempenho em PDF**: Motor interno de geração de documentos em tempo real (`jsPDF`) que cria relatórios executivos altamente refinados e prontos para impressão ou auditoria física.
*   **⏱️ Comandas em Tempo Real**: Fluxo interativo de controle de mesas e comandas integrado com persistência direta em nuvem (Firebase Firestore).
*   **🔒 Autenticação Robusta**: Autenticação nativa com Google Sign-In, login seguro por e-mail/senha e um atalho exclusivo para o operador de caixa administrador (`raphaelmbarral@gmail.com`).
*   **🎨 Experiência Visual Premium**: Interface construída em tema escuro profundo baseada em paleta Slate & Amber com logotipo vetorizado animado, efeitos de flutuação e brilho neon suave (*Gold Glow*).

---

## 🛠️ Tecnologias Utilizadas

*   **React 18 + Vite** — Renderização instantânea de componentes e bundle ultracompacto.
*   **TypeScript** — Tipagem estática rigorosa para máxima estabilidade operacional.
*   **Tailwind CSS** — Design fluido, responsivo e adaptativo baseado em componentes utilitários de alta fidelidade.
*   **Framer Motion** (`motion/react`) — Transições nativas sofisticadas e animações de micro-interação.
*   **Firebase Store / Auth** — Sincronização offline-first e persistência tolerante a falhas na nuvem.
*   **jsPDF** — Layout dinâmico programático para relatórios de faturamento.

---

## 🚀 Como Iniciar Localmente

Caso queira clonar ou exportar este projeto para rodar em seu próprio ambiente local, siga o passo a passo abaixo:

### 1. Pré-requisitos
*   **Node.js** (versão 18 ou superior)
*   **npm** ou **yarn** instalado

### 2. Instalação de Dependências
Clone o repositório em sua máquina local e instale os pacotes necessários:
```bash
# Se exportado via ZIP ou clonado via GitHub
cd pitstop-management

# Instale os módulos do projeto
npm install
```

### 3. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do seu projeto local preenchendo as configurações do Firebase correspondentes às suas credenciais:
```env
VITE_FIREBASE_API_KEY=seu_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### 4. Executando em Desenvolvimento
Para iniciar o servidor local de desenvolvimento com hot-reload ativo:
```bash
npm run dev
```
O servidor estará disponível no endereço mostrado pelo terminal (por padrão em `http://localhost:3000` ou `http://localhost:5173`).

### 5. Compilando para Produção
Cria a build estática otimizada de produção no diretório `/dist`:
```bash
npm run build
```

---

## 📦 Como exportar para o seu próprio GitHub

Para subir as atualizações deste applet diretamente para sua conta do GitHub:

1.  Aponte para o menu **Settings** (Configurações) no menu superior do **Google AI Studio Build**.
2.  Clique no botão **Export to GitHub**.
3.  Conecte sua conta do GitHub para criar automaticamente um novo repositório privado ou público sincronizado com o estado atual de todo o seu código-fonte!
4.  Como alternativa, você pode escolher **Export ZIP**, extrair os arquivos localmente e utilizar os comandos tradicionais do terminal:

```bash
git init
git add .
git commit -m "feat: implementa gerador de relatorios em PDF, login de admin e logo animado"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

---

<div align="center">
  <p>Desenvolvido e mantido na plataforma Google AI Studio.</p>
</div>
