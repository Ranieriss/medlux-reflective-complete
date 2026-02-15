# 🔗 GUIA COMPLETO - GESTÃO DE VÍNCULOS

## 📖 O QUE SÃO VÍNCULOS?

Vínculos são **responsabilidades atribuídas** entre um **equipamento** e um **usuário (técnico/operador)**. 

Quando um vínculo é criado:
- ✅ O usuário passa a ter **acesso exclusivo** ao equipamento
- ✅ O equipamento aparece na **lista personalizada** do usuário
- ✅ O sistema registra **data de início** e **data fim** (se aplicável)
- ✅ É possível anexar **documentos de responsabilidade** (termo, assinatura)

---

## 🚀 FUNCIONALIDADES DA TELA

### ✨ Recursos Disponíveis

1. **Criar Novo Vínculo**
   - Associar equipamento a um usuário
   - Definir data de início
   - Adicionar observações

2. **Editar Vínculo Existente**
   - Alterar datas
   - Atualizar observações
   - Modificar status (ativo/inativo)

3. **Visualizar Detalhes**
   - Ver informações completas do vínculo
   - Duração calculada automaticamente
   - Histórico de criação/atualização

4. **Finalizar Vínculo**
   - Define data fim automaticamente (hoje)
   - Marca como inativo
   - Equipamento fica disponível para novo vínculo

5. **Excluir Vínculo**
   - Remove permanentemente do sistema
   - ⚠️ Ação irreversível

6. **Filtros Avançados**
   - Busca por equipamento ou usuário
   - Filtrar por status (Ativo/Finalizado)
   - Filtrar por data de início

7. **Atualizações em Tempo Real**
   - Modificações aparecem automaticamente
   - Sem necessidade de recarregar página

---

## 📝 COMO CRIAR UM VÍNCULO

### Passo 1: Acessar Tela de Vínculos
```
Menu Lateral → Vínculos / Custódia
```

### Passo 2: Clicar em "Novo Vínculo"
Botão azul no canto superior direito

### Passo 3: Preencher Formulário

#### **Campo: Equipamento** (obrigatório)
- Selecione o equipamento na lista suspensa
- Exibe: código, nome, tipo e localização
- 🔍 Use a busca para encontrar rápido
- ⚠️ Equipamentos inativos não aparecem

#### **Campo: Usuário Responsável** (obrigatório)
- Selecione o usuário (técnico ou operador)
- Exibe: nome, email e perfil
- 🔍 Use a busca para filtrar
- ⚠️ Apenas usuários ativos aparecem

#### **Campo: Data Início** (obrigatório)
- Padrão: data de hoje
- Pode ser alterada se necessário
- Formato: dd/mm/yyyy

#### **Campo: Data Fim** (opcional)
- Deixe em branco se o vínculo não tem prazo
- Útil para vínculos temporários
- Não pode ser anterior à data início

#### **Campo: Vínculo Ativo**
- Switch: Ativado (verde) ou Desativado (cinza)
- Padrão: ativado
- Vínculos inativos não dão acesso ao equipamento

#### **Campo: Observações** (opcional)
- Notas adicionais sobre o vínculo
- Ex: "Equipamento para projeto X", "Treinamento realizado em..."

### Passo 4: Salvar
Clique no botão **"Salvar"** (azul) no canto inferior direito

✅ **Sucesso!** Mensagem verde aparecerá no topo da tela

---

## 🔍 COMO BUSCAR VÍNCULOS

### Filtro de Busca Livre
Digite no campo **"Buscar"**:
- Código do equipamento (ex: `RH-1234`)
- Nome do equipamento (ex: `Retrorrefletômetro`)
- Nome do usuário (ex: `João Silva`)
- Email do usuário (ex: `joao@medlux.com`)

### Filtro de Status
Selecione:
- **Ativo**: Vínculos em andamento
- **Finalizado**: Vínculos encerrados

### Filtro de Data
- Selecione uma data no calendário
- Mostra vínculos iniciados **a partir desta data**

### Limpar Filtros
Clique no botão **"Limpar"** para resetar todos os filtros

---

## ✏️ COMO EDITAR UM VÍNCULO

1. Localize o vínculo na tabela
2. Clique no ícone de **lápis** (amarelo) na coluna "Ações"
3. Modifique os campos desejados
4. Clique em **"Salvar"**

⚠️ **Nota**: Não é possível alterar **equipamento** ou **usuário** de um vínculo existente. Para isso, é necessário:
1. Finalizar o vínculo atual
2. Criar um novo vínculo

---

## 🛑 COMO FINALIZAR UM VÍNCULO

### Método Rápido (Recomendado)
1. Localize o vínculo ativo na tabela
2. Clique no ícone de **X no círculo** (vermelho) na coluna "Ações"
3. Confirme a finalização

**O que acontece:**
- ✅ Data fim é definida automaticamente (hoje)
- ✅ Status muda para **Finalizado**
- ✅ Equipamento fica disponível para novo vínculo
- ✅ Usuário perde acesso ao equipamento

### Método Manual
1. Clique em **Editar** (lápis amarelo)
2. Preencha a **Data Fim**
3. Desative o switch **"Vínculo Ativo"**
4. Clique em **Salvar**

---

## 🗑️ COMO EXCLUIR UM VÍNCULO

⚠️ **ATENÇÃO**: Esta ação é **irreversível**!

1. Localize o vínculo na tabela
2. Clique no ícone de **lixeira** (vermelho) na coluna "Ações"
3. Leia o aviso: "Esta ação não pode ser desfeita!"
4. Clique em **"Excluir"** para confirmar

**Quando excluir:**
- ❌ Vínculo criado por engano
- ❌ Dados duplicados

**Quando NÃO excluir:**
- ✅ Use **Finalizar** para manter histórico
- ✅ Mantém rastreabilidade e auditoria

---

## 👁️ COMO VISUALIZAR DETALHES

1. Localize o vínculo na tabela
2. Clique no ícone de **olho** (azul) na coluna "Ações"

**Informações exibidas:**
- Status (Ativo/Finalizado)
- Equipamento (código e nome)
- Usuário (nome e email)
- Data início e Data fim
- Duração calculada (em dias)
- Observações
- Data de criação
- Data da última atualização

---

## 📊 ENTENDENDO A TABELA

### Colunas da Tabela

| Coluna | Descrição |
|--------|-----------|
| **Equipamento** | Código e nome do equipamento |
| **Usuário** | Nome e email do responsável |
| **Status** | Chip verde (Ativo) ou vermelho (Finalizado) |
| **Data Início** | Quando o vínculo começou |
| **Data Fim** | Quando o vínculo terminou (ou "-" se ativo) |
| **Duração** | Tempo total em dias |
| **Ações** | Botões: Ver, Editar, Finalizar, Excluir |

### Status Visual

🟢 **Verde** = Vínculo Ativo
🔴 **Vermelho** = Vínculo Finalizado

---

## 🎯 CASOS DE USO COMUNS

### Caso 1: Vincular Equipamento ao Operador
**Cenário**: Operador "João Silva" vai usar equipamento "RH-001" por tempo indeterminado

**Passos:**
1. Novo Vínculo
2. Equipamento: `RH-001`
3. Usuário: `João Silva`
4. Data Início: `hoje`
5. Data Fim: `(deixar vazio)`
6. Observações: `Equipamento para uso diário`
7. Salvar

### Caso 2: Vínculo Temporário para Treinamento
**Cenário**: Técnico "Maria Santos" vai treinar com "RV-005" por 2 semanas

**Passos:**
1. Novo Vínculo
2. Equipamento: `RV-005`
3. Usuário: `Maria Santos`
4. Data Início: `01/03/2026`
5. Data Fim: `15/03/2026`
6. Observações: `Treinamento em sinalização vertical`
7. Salvar

### Caso 3: Transferir Equipamento
**Cenário**: Equipamento "RH-002" vai ser transferido de "Pedro" para "Ana"

**Passos:**
1. Localizar vínculo atual (Pedro + RH-002)
2. Clicar em **Finalizar** (X vermelho)
3. Criar **Novo Vínculo**
4. Equipamento: `RH-002`
5. Usuário: `Ana Costa`
6. Data Início: `hoje`
7. Observações: `Transferência de Pedro para Ana`
8. Salvar

---

## ⚠️ REGRAS DE NEGÓCIO

### Restrições
1. ❌ **Não é possível** ter múltiplos vínculos ativos para o mesmo equipamento
2. ❌ **Data Fim** não pode ser anterior à **Data Início**
3. ❌ **Equipamento** e **Usuário** são obrigatórios
4. ❌ Apenas usuários **ativos** podem receber vínculos
5. ❌ Apenas equipamentos **ativos** podem ser vinculados

### Permissões
- 👤 **Operador**: Visualiza apenas seus vínculos
- 🔧 **Técnico**: Visualiza todos os vínculos
- 👨‍💼 **Admin**: Visualiza e gerencia todos os vínculos

---

## 🔄 ATUALIZAÇÕES EM TEMPO REAL

A tela de vínculos possui **sincronização automática**:

✨ Se outro usuário:
- Criar um vínculo → Aparece automaticamente na sua tela
- Editar um vínculo → Atualiza automaticamente
- Excluir um vínculo → Desaparece automaticamente

**Não é necessário recarregar a página!**

---

## 🐛 PROBLEMAS COMUNS

### ❌ "Não há vínculos para exibir"
**Causa**: Nenhum vínculo foi criado ainda
**Solução**: Clique em "Novo Vínculo" para criar o primeiro

### ❌ Equipamento não aparece na lista
**Possíveis causas:**
1. Equipamento está **inativo**
   - Solução: Ativar equipamento na tela de Equipamentos
2. Equipamento já possui vínculo ativo
   - Solução: Finalizar vínculo existente primeiro

### ❌ Usuário não aparece na lista
**Possíveis causas:**
1. Usuário está **inativo**
   - Solução: Ativar usuário na tela de Usuários
2. Usuário não foi cadastrado
   - Solução: Cadastrar usuário primeiro

### ❌ Não consigo editar equipamento/usuário
**Causa**: Campo desabilitado por design
**Solução**: Finalizar vínculo atual e criar novo

---

## 💡 DICAS PRO

1. **Use observações**: Documente o motivo do vínculo
2. **Finalize em vez de excluir**: Mantém histórico para auditoria
3. **Defina datas fim**: Para vínculos temporários
4. **Use filtros**: Para encontrar vínculos rapidamente
5. **Monitore duração**: Identifique vínculos antigos que podem precisar revisão

---

## 📋 CHECKLIST DE VÍNCULO

Antes de criar um vínculo, verifique:
- [ ] Equipamento está **ativo** e **disponível**
- [ ] Usuário está **ativo** e **cadastrado**
- [ ] Data início está **correta**
- [ ] Data fim está **vazia** (se vínculo indeterminado) ou **correta**
- [ ] Observações foram **preenchidas** (se aplicável)
- [ ] Status está **ativo** (verde)

---

## 🔐 SEGURANÇA

### Auditoria Automática
Todos os vínculos registram:
- 📅 Data/hora de criação
- 📅 Data/hora da última atualização
- 👤 Usuário que criou (implícito)

### Rastreabilidade
- Vínculos finalizados permanecem no histórico
- Possível gerar relatórios de vínculos por período
- Útil para auditorias e comprovações

---

**Última atualização**: 2026-02-15  
**Versão**: 1.0.0  
**Sistema**: MEDLUX Reflective - Gestão de Equipamentos
