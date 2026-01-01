# 💎 Lux Brasil - Premium Rewards Platform

> Uma plataforma de recompensas gamificada de última geração, apresentando uma UI de luxo, mecânicas de roleta em tempo real e um sistema exclusivo de convites VIP.

![Project Status](https://img.shields.io/badge/Status-Development-gold?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-1a1a1a?style=for-the-badge)
![Tech](https://img.shields.io/badge/Built%20With-React%20%7C%20Supabase%20%7C%20MUI-000000?style=for-the-badge)

---

## ✨ Visão Geral

**Lux Brasil** é uma aplicação web projetada para oferecer uma experiência de cassino e luxo, onde usuários podem girar a roleta, gerenciar uma carteira digital e participar de desafios exclusivos. Construído com foco em estética ("Dark & Gold"), segurança e performance.

### 🎨 Identidade Visual
O projeto segue estritamente um sistema de design **Premium Dark**:
- **Cores Primárias:** `#050510` (Deep Black), `#D4AF37` (Metallic Gold).
- **Tipografia:** Montserrat (Títulos) & Inter (Corpo).
- **Efeitos:** Glassmorphism, Brilhos Dourados, Partículas 3D.
- **Estilização:** Material UI (MUI v5) com CSS-in-JS. **Zero Tailwind**.

---

## 🚀 Funcionalidades Principais

### 🎰 A Roleta (The Wheel)
- **Animação Baseada em Física:** Desaceleração suave e geração de resultados aleatórios utilizando SVG e animações CSS.
- **Backgrounds 3D:** Renderização de partículas imersivas com `@react-three/fiber`.
- **Fair Play:** Lógica de RNG verificada via Supabase RPCs.

### 🤝 Sistema de Convite VIP
- **Experiência Golden Ticket:** Códigos de referência apresentados como "Passes VIP" com efeito visual de destaque.
- **Recompensas Progressivas:** Barras de progresso visuais para metas de convite (ex: "Convide 5 amigos").
- **Compartilhamento Social:** Integração nativa com WhatsApp, Telegram e E-mail.

### 🛡️ Admin & Segurança
- **Controle de Acesso:** Painel Administrativo dedicado para gestão de usuários, prêmios e logs de auditoria.
- **Anti-Fraude:** Rastreamento de IP, timers de cooldown (roulette timer) e campos honeypot no registro.
- **Logs de Auditoria:** Rastreabilidade completa de ações administrativas (Banimentos, Edição de Prêmios).

### 🌍 Internacionalização
- **Suporte Multi-idioma:** Suporte nativo para Português (PT), Inglês (EN) e Chinês (ZH).

---

## 🛠️ Stack Tecnológica

| Domínio | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript | Framework principal. |
| **UI Library** | Material UI (MUI v5) | Componentes customizados via propriedade `sx`. |
| **Roteamento** | React Router DOM v6 | Navegação client-side. |
| **Backend/State** | Supabase JS Client | Autenticação, Banco de Dados e Realtime. |
| **Validação** | Zod + React Hook Form | Schemas de validação robustos. |
| **Animações** | Framer Motion & Three.js | Animações de alta fidelidade. |

---

## 📦 Instalação e Configuração

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/sua-org/lux-brasil.git
   cd lux-brasil
   ```

2. **Instalar Dependências**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configuração de Ambiente**
   Certifique-se de que as chaves do Supabase estejam configuradas corretamente em `services/api.ts` ou via variáveis de ambiente (`.env`).

4. **Executar Servidor de Desenvolvimento**
   ```bash
   npm run dev
   ```

---

## 📂 Estrutura do Projeto

```text
src/
├── components/       # Componentes de UI Reutilizáveis (Roulette, InviteSystem, etc.)
├── constants/        # Configuração de Tema, Traduções, Constantes do App
├── hooks/            # Custom hooks (useLanguage, usePushNotifications)
├── pages/            # Visões principais (Dashboard, Admin, Landing)
├── services/         # Integração com API (Supabase client)
├── types/            # Interfaces TypeScript e definições de Enums
├── App.tsx           # Ponto de entrada da aplicação
└── index.tsx         # Renderização React DOM
```

---

## 👑 Funcionalidades de Admin

Para acessar o painel administrativo, a conta do usuário deve possuir `role: 'admin'` na tabela `profiles` do Supabase.
- **Gestão de Usuários:** Banir/Desbanir, visualizar IPs, adicionar giros manualmente.
- **Configuração da Roleta:** Criar, editar ou excluir prêmios (Probabilidade, Cor, Tipo).
- **Auditoria:** Visualizar linha do tempo de todas as alterações no sistema.

---

## 📝 Licença

Copyright © 2024 **BRAILLUX ENTERTAINMENT LTDA**.
Todos os direitos reservados. Cópia ou distribuição não autorizada é estritamente proibida.

---
*Desenvolvido com precisão e luxo.*