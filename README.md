# 🚀 MEDLUX Reflective - Sistema de Gestão de Equipamentos

Sistema completo de gestão de equipamentos refletivos de sinalização viária com controle de calibração, custódia, rastreabilidade e auditoria.

## 📋 Funcionalidades Implementadas

### ✅ Módulo de Equipamentos (CRUD Completo)
- ✅ Cadastro de equipamentos com validação avançada
- ✅ Listagem com filtros inteligentes (tipo, status, calibração)
- ✅ Edição inline via modal
- ✅ Exclusão com confirmação
- ✅ Upload e visualização de foto do equipamento
- ✅ Geração automática de QR Code por equipamento
- ✅ Alertas de calibração vencida/próxima
- ✅ Histórico de alterações (auditoria)
- ✅ Interface responsiva (mobile-first)

### ✅ Sistema de Autenticação
- ✅ Login/Logout funcional
- ✅ Controle de permissões (Admin/Técnico)
- ✅ Rotas protegidas
- ✅ Sessão persistente

### ✅ Dashboard
- ✅ Cards com estatísticas em tempo real
- ✅ Alertas de calibração
- ✅ Resumo visual do sistema

### 🚧 Em Desenvolvimento
- ⏳ Gestão de Vínculos/Custódia
- ⏳ Sistema de Calibração
- ⏳ Relatórios com exportação
- ⏳ Auditoria completa
- ⏳ Configurações do sistema

## 🛠️ Tecnologias

- **Vue 3.4.21** - Framework JavaScript progressivo
- **Vuetify 3.5.10** - UI Material Design
- **Vite 5.4.21** - Build tool ultrarrápido
- **Pinia 2.1.7** - State management
- **Vue Router 4.2.5** - Gerenciamento de rotas
- **Dexie.js 3.2.7** - IndexedDB wrapper
- **date-fns 3.3.1** - Manipulação de datas
- **QRCode 1.5.3** - Geração de QR Codes


## 🔐 Supabase + Vercel (obrigatório para login)

Defina estas variáveis de ambiente no frontend Vite:

- `VITE_SUPABASE_URL` → `https://<project-ref>.supabase.co`
- `VITE_SUPABASE_ANON_KEY` → chave **anon/public** (JWT, normalmente começa com `eyJ...`)

### Onde configurar no Vercel

1. Acesse **Project → Settings → Environment Variables**.
2. Cadastre as duas variáveis para **Production**, **Preview** e **Development**.
3. Faça **Redeploy** do projeto para aplicar as novas vars.


### Edge Function `create-user` (Secrets + Deploy)

- Adicionar Secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` no **Supabase → Edge Functions → Secrets** e depois dar **Deploy updates**.

### Aplicar SQL final de RLS

Execute o arquivo abaixo no **Supabase SQL Editor**:

- `supabase/medlux_rls_final.sql`

Esse script é idempotente e configura:
- Auth por `usuarios.auth_user_id = auth.uid()`
- Policies ADMIN/USER finais
- ownership (`usuario_id`) e trigger nas tabelas de leituras


### Diagnóstico de bootstrap + modo debug completo

- Em caso de falha crítica de inicialização, o app exibe um overlay com o botão **"Gerar Diagnóstico Completo"** (download `.json` + tentativa de cópia para clipboard).
- Para ativar o modo debug em **produção ou dev**, use uma das opções:
  - `?debug=1` na URL.
  - `localStorage.setItem('MEDLUX_DEBUG', '1')` e recarregue a página.
- Quando o debug está ativo, os hooks globais ficam disponíveis no DevTools:
  - `window.supabase` → client Supabase exposto para inspeção.
  - `window.__app__` → objeto com `version`, `env`, `routes`, `stores`, `currentUser`, `session`, `isAdmin`, `lastErrors`, `lastNetwork`, `lastStorageOps`.
  - `window.__medlux_debug_dump()` → gera o dump completo (JSON) do diagnóstico.
- Na tela **Sistema → Logs de Erro**, o botão **"Diagnóstico Completo"** gera o relatório completo e permite copiar/baixar o JSON.

#### Testes rápidos no Console

```js
window.supabase
window.supabase.auth.getSession().then(console.log)
```

### Troubleshooting rápido de login

- Botão de login habilitado, mas erro de configuração: revisar as env vars acima.
- Mensagem `Usuário autenticado, mas sem cadastro em public.usuarios`: criar/ajustar linha na tabela `public.usuarios` com `auth_user_id` correto.
- Mensagem `Perfil ausente/duplicado`: corrigir duplicidade em `public.usuarios` para o mesmo `auth_user_id`.

## 📝 Release Note

### Correções Supabase/RLS + Backup Import
- Corrigida recursão de policies (RLS) com fonte de admin em `public.admins`.
- Ajustadas policies ADMIN/USER para `usuarios`, `equipamentos`, `vinculos` e `leituras_*`.
- Trigger unificada para preencher `usuario_id` nas leituras.
- Importador JSON tolerante a schema antigo, incluindo mapeamento `marca -> fabricante` e preview de contagens.

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Instalação

```bash
# 1. Clonar o repositório (se ainda não clonou)
git clone https://github.com/Ranieriss/medlux-reflective-complete.git
cd medlux-reflective-complete

# 2. Instalar dependências
npm install

# 3. Rodar em modo desenvolvimento
npm run dev

# 4. Abrir navegador em http://localhost:3000
```

### Credenciais de Acesso

| Perfil | Email | Senha | Permissões |
|--------|-------|-------|------------|
| **ADMIN** | admin@medlux.com | 2308 | Acesso total ao sistema |
| **TÉCNICO** | joao.silva@medlux.com | 1234 | Visualizar equipamentos vinculados |

## 📁 Estrutura do Projeto

```
medlux-reflective-complete/
├── node_modules/
├── public/
├── src/
│   ├── main.js                 # Bootstrap da aplicação
│   ├── App.vue                 # Componente raiz
│   ├── router/
│   │   └── index.js            # Configuração de rotas
│   ├── stores/
│   │   └── auth.js             # Store de autenticação
│   ├── services/
│   │   └── db.js               # IndexedDB com Dexie
│   ├── views/
│   │   ├── Login.vue           # Tela de login
│   │   ├── Layout.vue          # Layout principal
│   │   ├── Dashboard.vue       # Dashboard
│   │   ├── EquipamentosLista.vue  # ⭐ CRUD de equipamentos
│   │   ├── UsuariosLista.vue   # Gestão de usuários
│   │   ├── VinculosLista.vue   # Vínculos/custódia
│   │   ├── RelatoriosLista.vue # Relatórios
│   │   ├── AuditoriaView.vue   # Auditoria
│   │   └── SistemaView.vue     # Configurações
│   └── styles/
│       ├── variables.css       # Variáveis CSS
│       └── main.css            # Estilos globais
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🗄️ Banco de Dados (IndexedDB)

### Tabelas

1. **equipamentos**
   - ID, código, tipo, marca, modelo, numero_serie
   - data_aquisicao, ultima_calibracao, proxima_calibracao
   - status, localizacao, observacoes, foto

2. **usuarios**
   - ID, nome, email, senha (hash), perfil, ativo, data_cadastro

3. **vinculos**
   - ID, equipamento_id, usuario_id, data_vinculo, data_desvinculo
   - termo_responsabilidade, status

4. **historico_calibracoes**
   - ID, equipamento_id, data_calibracao, certificado
   - validade, laboratorio, resultado, observacoes

5. **auditoria**
   - ID, usuario_id, acao, tabela, registro_id, timestamp, detalhes

6. **logs_erro**
   - ID, tipo, mensagem, stack, timestamp, usuario_id

### Dados Demo

O sistema já vem com dados de demonstração:

- **3 equipamentos** (H-2024-001, V-2023-045, T-2024-003)
- **3 usuários** (1 admin + 2 técnicos)
- **Dados de calibração** com diferentes status

## 🎨 Design System

### Paleta de Cores

```css
--color-primary: #0074D9    /* Azul */
--color-secondary: #001F3F  /* Navy */
--color-accent: #39CCCC     /* Cyan */
--color-success: #2ECC40    /* Verde */
--color-warning: #FFDC00    /* Amarelo */
--color-error: #FF4136      /* Vermelho */
```

### Estilo Visual

- ✨ **Dark mode** obrigatório
- 🔮 **Glassmorphism** (backdrop-filter: blur)
- 💫 **Neon glow effects**
- ✨ **Shimmer animations**
- 📱 **Mobile-first responsive**

## ⚙️ Funcionalidades do CRUD de Equipamentos

### 1. Cadastro de Equipamento

Campos obrigatórios:
- Código único (ex: H-2024-001)
- Tipo (Horizontal/Vertical/Tachas)
- Marca e Modelo
- Número de Série
- Data de Aquisição
- Status

Campos opcionais:
- Calibrações (última e próxima)
- Localização
- Foto do equipamento
- Observações

### 2. Listagem com Filtros

- **Busca textual**: Código, marca ou modelo
- **Filtro por tipo**: Horizontal, Vertical, Tachas
- **Filtro por status**: Ativo, Manutenção, Inativo
- **Filtro por calibração**: Vencida, Próxima (30 dias), Em dia

### 3. Alertas Visuais

- ❌ **Vermelho**: Calibração vencida
- ⚠️ **Amarelo**: Calibração vencendo em 30 dias
- ✅ **Verde**: Calibração em dia

### 4. QR Code

Cada equipamento possui um QR Code único gerado automaticamente com seu código, facilitando a identificação e rastreamento.

### 5. Auditoria Automática

Todas as ações são registradas:
- Criação de equipamento
- Edição de dados
- Exclusão

## 🧪 Como Testar

### 1. Login
1. Acesse `http://localhost:3000`
2. Use as credenciais de admin ou técnico
3. Clique em "Entrar"

### 2. Dashboard
1. Visualize os cards com estatísticas
2. Observe os alertas de calibração

### 3. Equipamentos (CRUD Completo)

#### Criar Novo
1. Clique em "Novo Equipamento"
2. Preencha o formulário
3. (Opcional) Faça upload de uma foto
4. Clique em "Salvar"
5. ✅ Equipamento criado e auditoria registrada

#### Listar e Filtrar
1. Use os filtros no topo da página
2. Busque por código, marca ou modelo
3. Filtre por tipo, status ou calibração

#### Visualizar
1. Clique no ícone de olho (👁️)
2. Veja todos os detalhes do equipamento

#### Editar
1. Clique no ícone de lápis (✏️)
2. Modifique os campos desejados
3. Clique em "Salvar"
4. ✅ Equipamento atualizado e auditoria registrada

#### Ver QR Code
1. Clique no ícone de QR Code
2. Visualize o código gerado

#### Excluir
1. Clique no ícone de lixeira (🗑️)
2. Confirme a exclusão
3. ✅ Equipamento excluído e auditoria registrada


## ✅ Plano de testes (ADMIN e USER)

### ADMIN
1. Login com usuário ADMIN.
2. Confirmar leitura de todas as medições e cadastros.
3. Confirmar escrita em `trechos_medicao`, `segmentos_medicao`, `estacoes_medicao` (se UI disponível).

### USER (`teste@medlux.com`)
1. Login com usuário USER.
2. Confirmar leitura de `trechos_medicao`, `segmentos_medicao`, `estacoes_medicao`.
3. Inserir leituras sem enviar `usuario_id` (trigger deve preencher automaticamente).
4. Confirmar listagem apenas das próprias leituras.

### Sanidade no banco
```sql
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname='public'
order by tablename, policyname;

select relname, relrowsecurity
from pg_class
where relname in (
  'usuarios','trechos_medicao','segmentos_medicao','estacoes_medicao',
  'leituras_medicao','leituras_vertical','leituras_dispositivos'
);
```

## 📊 Próximos Passos

### Funcionalidades Prioritárias

1. **Gestão de Vínculos** (Alta Prioridade)
   - Vincular equipamento a técnico
   - Upload de termo de responsabilidade
   - Assinatura digital
   - Desvincular equipamento

2. **Sistema de Calibração** (Alta Prioridade)
   - Registrar nova calibração
   - Upload de certificado
   - Alertas automáticos
   - Dashboard de calibrações

3. **Relatórios** (Média Prioridade)
   - Equipamentos por status
   - Calibrações vencidas
   - Vínculos ativos
   - Exportar PDF/Excel

4. **Auditoria Avançada** (Baixa Prioridade)
   - Logs detalhados
   - Filtros avançados
   - Diff antes/depois

## 🐛 Troubleshooting

### Problema: Localhost bloqueado

**Solução**: Use o Ngrok para criar um túnel público

```powershell
# Terminal 1 - Vite
npm run dev

# Terminal 2 - Ngrok
ngrok http 3000
```

### Problema: Banco vazio após reload

**Solução**: Os dados demo são carregados automaticamente no primeiro acesso. Se o banco foi limpo:

```javascript
// No console do navegador
import { popularDadosDemo } from './services/db'
await popularDadosDemo()
```

### Problema: Erro de validação no formulário

**Solução**: Certifique-se de que todos os campos obrigatórios (*) estão preenchidos.

## 📝 Licença

© 2024 MEDLUX Reflective - Todos os direitos reservados

## 👨‍💻 Desenvolvedor

Sistema desenvolvido para gestão profissional de equipamentos refletivos de sinalização viária.

---

**Status do Projeto**: ✅ CRUD de Equipamentos 100% funcional

**Próxima Feature**: 🚧 Gestão de Vínculos/Custódia
<!-- trigger new checks -->

## Supabase env vars

Para evitar erros de login e deploy no Vercel, configure **sempre** estas variáveis:

- `VITE_SUPABASE_URL=https://<project-ref>.supabase.co`
- `VITE_SUPABASE_ANON_KEY=eyJ...` (**obrigatório: anon/public JWT**)

Regras importantes:

- O frontend usa **somente** `VITE_SUPABASE_ANON_KEY`.
- A chave deve ser JWT anon/public (`header.payload.signature`, normalmente iniciando com `eyJ...`).
- ⚠️ `sb_publishable_...`, `prj_...` e `service_role` **não** devem ser usados no frontend.
- Configure as variáveis na Vercel em **Production / Preview / Development** e faça **Redeploy** após alterar qualquer env.

Exemplo para Vercel:

```bash
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...<anon-jwt>
```

Configuração de Auth para recuperação de senha:

- Em **Supabase > Auth > URL Configuration**, defina:
  - Site URL: `https://medlux-reflective-complete.vercel.app`
  - Redirect URL: `https://medlux-reflective-complete.vercel.app/redefinir-senha`
- Em desenvolvimento, o app usa o hostname atual para `redirectTo`; em produção, usa a URL oficial do projeto.

### SQL mínimo (public.usuarios + RLS)

```sql
-- coluna canônica de vínculo com auth.users
alter table public.usuarios
  add column if not exists user_id uuid;

-- opcional: compatibilidade com schema antigo
alter table public.usuarios
  add column if not exists auth_user_id uuid;

-- unicidade para evitar duplicidades de perfil
create unique index if not exists usuarios_user_id_unique
  on public.usuarios (user_id)
  where user_id is not null;

create unique index if not exists usuarios_email_lower_unique
  on public.usuarios (lower(email))
  where email is not null;

alter table public.usuarios enable row level security;

create policy if not exists usuarios_select_own
on public.usuarios
for select
using (user_id = auth.uid());

create policy if not exists usuarios_insert_own
on public.usuarios
for insert
with check (user_id = auth.uid());

create policy if not exists usuarios_update_own
on public.usuarios
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

> Opcional: criar trigger em `auth.users` para inserir automaticamente em `public.usuarios` no signup.
> Mesmo sem trigger, o app agora usa `maybeSingle()` + autocreate de perfil para não quebrar o login.

## ⚙️ Observações de build (Sass)

A build foi ajustada para usar a API moderna do Dart Sass no Vite (`css.preprocessorOptions.{scss,sass}.api = "modern-compiler"`).

Checklist aplicado:

- `npm ls sass node-sass` → somente `sass` (Dart Sass) no projeto.
- `node-sass` não é utilizado.
- Build validada sem `DEPRECATION WARNING [legacy-js-api]`.

Referência oficial do deprecation: https://sass-lang.com/documentation/breaking-changes/legacy-js-api/
