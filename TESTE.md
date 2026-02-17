# 🧪 GUIA DE TESTE - MEDLUX Reflective

## ✅ O QUE FOI IMPLEMENTADO

### **OPÇÃO A - CRUD COMPLETO DE EQUIPAMENTOS** ✅

Funcionalidade **100% implementada e testada**!

## 🌐 ACESSO AO SISTEMA

**URL do Sistema**: https://3000-ie4tc4um27gylss7lvwlv-d0b9e1e2.sandbox.novita.ai

### Credenciais de Login

| Perfil | Email | Senha | Permissões |
|--------|-------|-------|------------|
| **ADMIN** | admin@medlux.com | 2308 | Acesso total |
| **TÉCNICO** | joao.silva@medlux.com | 1234 | Visualização |

## 📝 PASSO A PASSO PARA TESTAR

### 1️⃣ LOGIN
1. Acesse a URL acima
2. Digite: `admin@medlux.com`
3. Senha: `2308`
4. Clique em "Entrar"

✅ **Resultado esperado**: Redirecionar para Dashboard

---

### 2️⃣ DASHBOARD
**O que verificar**:
- ✅ Cards com estatísticas (Total, Vencidas, Vínculos, Manutenção)
- ✅ Alertas de calibração em destaque
- ✅ Visual glassmorphism/neon

---

### 3️⃣ CRIAR NOVO EQUIPAMENTO

1. No menu lateral, clique em **"Equipamentos"**
2. Clique no botão **"+ Novo Equipamento"** (canto superior direito)

**Preencher formulário**:

#### Informações Básicas
- **Código**: `H-2024-999` (único, não pode repetir)
- **Tipo**: Selecione "Horizontal"
- **Marca**: `Zehntner`
- **Modelo**: `ZRM 6014`
- **Número de Série**: `ZRM-TEST-999`
- **Data de Aquisição**: Selecione qualquer data

#### Calibração
- **Última Calibração**: Data passada (ex: 01/01/2024)
- **Próxima Calibração**: Data futura (ex: 01/12/2025)

#### Status e Localização
- **Status**: Selecione "Ativo"
- **Localização**: `Laboratório de Testes`

#### Foto (OPCIONAL)
- Clique em "Selecionar foto"
- Escolha qualquer imagem do seu computador
- ✅ Preview aparecerá automaticamente

#### Observações (OPCIONAL)
- Digite: `Equipamento de teste para demonstração`

3. Clique em **"Salvar"**

✅ **Resultado esperado**:
- Snackbar verde: "Equipamento cadastrado com sucesso!"
- Equipamento aparece na listagem
- Auditoria registrada automaticamente

---

### 4️⃣ VISUALIZAR EQUIPAMENTO

1. Na listagem, localize o equipamento criado
2. Clique no ícone **👁️ (olho)** na coluna "Ações"

✅ **Resultado esperado**:
- Modal com todos os detalhes
- Foto exibida (se foi enviada)
- Todas as informações formatadas

---

### 5️⃣ VER QR CODE

1. Na listagem, clique no ícone **QR Code** ao lado do código
2. Observe o QR Code gerado

✅ **Resultado esperado**:
- Modal com QR Code em azul/branco
- Código do equipamento abaixo do QR

---

### 6️⃣ EDITAR EQUIPAMENTO

1. Na listagem, clique no ícone **✏️ (lápis)** na coluna "Ações"
2. Modifique alguns campos:
   - **Localização**: Altere para `Sala de Calibração`
   - **Observações**: Adicione `Equipamento atualizado em [data]`
3. Clique em **"Salvar"**

✅ **Resultado esperado**:
- Snackbar verde: "Equipamento atualizado com sucesso!"
- Dados atualizados na listagem
- Auditoria registrada

---

### 7️⃣ FILTROS E BUSCA

#### Busca Textual
1. No campo "Buscar", digite: `H-2024`
2. Observe a filtragem em tempo real

#### Filtro por Tipo
1. No select "Tipo", escolha "Horizontal"
2. Apenas equipamentos horizontais aparecem

#### Filtro por Status
1. No select "Status", escolha "Ativo"
2. Apenas equipamentos ativos aparecem

#### Filtro por Calibração
1. No select "Calibração", escolha "Vencida"
2. Apenas equipamentos com calibração vencida aparecem
3. Note o **ícone de alerta vermelho** ⚠️

✅ **Resultado esperado**: Filtragem instantânea e visual

---

### 8️⃣ ALERTAS DE CALIBRAÇÃO

**Observe os ícones visuais**:

- ❌ **Vermelho** (círculo com X): Calibração VENCIDA
- ⚠️ **Amarelo** (relógio): Calibração vencendo em 30 dias
- ✅ **Verde** (sem ícone): Calibração em dia

✅ **Equipamento T-2024-003** já vem com calibração vencida!

---

### 9️⃣ EXCLUIR EQUIPAMENTO

1. Na listagem, clique no ícone **🗑️ (lixeira)** na coluna "Ações"
2. Leia o alerta de confirmação
3. Clique em **"Excluir"**

✅ **Resultado esperado**:
- Modal de confirmação com alerta vermelho
- Após confirmar: Snackbar verde "Equipamento excluído com sucesso!"
- Equipamento removido da listagem
- Auditoria registrada

---

### 🔟 AUDITORIA (ADMIN APENAS)

1. No menu lateral, clique em **"Auditoria"**
2. (Funcionalidade em desenvolvimento, mostra placeholder)

**Nota**: Todas as ações (criar, editar, excluir) estão sendo registradas no IndexedDB na tabela `auditoria`.

---

## 🎨 FUNCIONALIDADES EXTRAS IMPLEMENTADAS

### ✅ Validações Avançadas
- Código único (não permite duplicatas)
- Campos obrigatórios com mensagens claras
- Validação em tempo real

### ✅ Upload de Foto
- Suporta imagens (jpg, png, etc.)
- Preview automático
- Armazenamento em Base64 no IndexedDB

### ✅ QR Code Dinâmico
- Gerado automaticamente por equipamento
- Cores personalizadas (azul/branco)
- Pode ser escaneado por apps QR

### ✅ Sistema de Auditoria
- Registra: create, update, delete
- Armazena: usuário, timestamp, dados completos
- Pronto para visualização futura

### ✅ Interface Responsiva
- Mobile-first
- Funciona em telas pequenas
- Menu lateral colapsável

### ✅ Design Glassmorphism
- Efeito de vidro (backdrop-filter: blur)
- Neon glow em botões e cards
- Animações suaves
- Tema dark obrigatório

---

## 🐛 TROUBLESHOOTING

### Erro: Página em branco
**Solução**: Abra o console (F12) e recarregue (Ctrl+R)

### Erro: Login não funciona
**Solução**: 
- Verifique se usou as credenciais corretas
- Email: `admin@medlux.com`
- Senha: `2308`

### Erro: Foto não carrega
**Solução**: Use imagens menores (max 2MB recomendado)

---

## 📊 DADOS DEMO PRÉ-CARREGADOS

O sistema já vem com:

### Equipamentos
1. **H-2024-001** - Horizontal (Calibração OK)
2. **V-2023-045** - Vertical (Calibração OK)
3. **T-2024-003** - Tachas (⚠️ **CALIBRAÇÃO VENCIDA**)

### Usuários
1. **admin@medlux.com** (Admin)
2. **joao.silva@medlux.com** (Técnico)
3. **maria.santos@medlux.com** (Técnico)

---

## ✅ CHECKLIST DE TESTES

Use este checklist para validar:

- [ ] Login funciona
- [ ] Dashboard mostra estatísticas
- [ ] Criar equipamento funciona
- [ ] Upload de foto funciona
- [ ] Editar equipamento funciona
- [ ] Visualizar equipamento funciona
- [ ] Ver QR Code funciona
- [ ] Filtros funcionam (busca, tipo, status, calibração)
- [ ] Alertas de calibração aparecem
- [ ] Excluir equipamento funciona
- [ ] Interface é responsiva
- [ ] Visual glassmorphism está bonito

---

## 🚀 PRÓXIMAS FUNCIONALIDADES

Recomendo implementar nesta ordem:

1. **Opção C** - Sistema de Calibração (registrar, certificado, alertas)
2. **Opção B** - Vínculos/Custódia (termo de responsabilidade)
3. **Opção E** - Dashboard melhorado (gráficos Chart.js)
4. **Opção D** - Relatórios (exportar PDF/Excel)

---

## 📞 SUPORTE

Se encontrar algum bug ou tiver sugestões, documente:
- O que estava fazendo
- O erro que apareceu
- Prints de tela

---

**Status**: ✅ CRUD de Equipamentos 100% funcional!

**Desenvolvido por**: AI Developer
**Data**: 2024

---

## ✅ CHECKLIST SUPABASE + RLS (CAMINHO B)

- [ ] ADMIN cria equipamento `RH01` sem erro 403.
- [ ] USER não vê botão **Novo Equipamento**.
- [ ] USER não consegue criar/editar/excluir equipamento (mensagem: "Somente ADMIN").
- [ ] USER vê apenas equipamentos vinculados.
- [ ] Importar backup JSON mostra preview antes de importar.
- [ ] Importar backup JSON ignora tabelas desconhecidas sem quebrar.
- [ ] Importar backup JSON mapeia campos legados (ex.: `marca -> fabricante`).
- [ ] Erro `23505` em usuários mostra "E-mail já cadastrado".
- [ ] Evitar `406` em consultas que podem retornar 0 linhas (`maybeSingle` + tratamento de `null`).
- [ ] Erro `403` mostra mensagem útil de permissão.
