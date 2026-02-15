# 🚨 CORREÇÕES URGENTES - MEDLUX Reflective

## PROBLEMAS IDENTIFICADOS NOS PRINTS:

### 1. ❌ Botões Perfil e Configurações não funcionam
- **Problema**: Cliques em "Perfil" e "Configurações" não fazem nada
- **Solução**: Criar rotas e views correspondentes

### 2. ❌ SQL não foi executado no Supabase
- **Problema**: Tabelas e dados faltando
- **Solução**: Executar `supabase-COMPLETO-FINAL.sql` no Supabase SQL Editor

### 3. ❌ Vínculos redireciona para login
- **Problema**: Ao clicar em "Vínculos", app volta para tela de login
- **Solução**: Corrigir guard de rota e verificar permissões

### 4. ❌ Usuário cadastrado não consegue fazer login
- **Problema**: Donevir (donevir@medlux.com) não consegue acessar
- **Solução**: Verificar lógica de autenticação e hash de senha

### 5. ❌ Recuperação de senha não envia email
- **Problema**: Clica em "recuperar senha" mas email não chega
- **Solução**: Implementar envio de email real ou simulação local

### 6. ❌ Logs de erro não registra
- **Problema**: Tabela `logs_erro` não existe
- **Solução**: Criar tabela no SQL e implementar service

### 7. ❌ Falta créditos no "Sobre"
- **Problema**: Não menciona Paulo Ranieri como desenvolvedor
- **Solução**: Atualizar seção "Sobre" com dados completos

### 8. ❌ Relatório sem opção "Todos"
- **Problema**: Filtro de tipo não tem opção "Todos os tipos"
- **Solução**: Adicionar opção no select

### 9. ❌ Erro ao baixar relatório
- **Problema**: Clica em "Gerar PDF" mas dá erro
- **Solução**: Verificar função de geração de PDF

### 10. ❌ Filtro "Vertical" não encontra equipamentos
- **Problema**: Busca por "RV" ou "Vertical" não retorna resultados
- **Solução**: Corrigir lógica de filtro (case-insensitive)

### 11. ❌ Próxima calibração não atualiza
- **Problema**: Edita equipamento mas data não muda
- **Solução**: Verificar UPDATE no banco

### 12. ❌ Coluna certificado PDF faltando
- **Problema**: Não há ícone/coluna para ver certificado PDF
- **Solução**: Adicionar coluna na tabela de equipamentos

## ARQUIVOS A SEREM CRIADOS/EDITADOS:

1. `supabase-COMPLETO-FINAL.sql` - ✅ JÁ CRIADO
2. `src/services/logService.js` - Novo
3. `src/views/PerfilView.vue` - Novo
4. `src/views/ConfiguracoesView.vue` - Novo
5. `src/views/SistemaView.vue` - Atualizar seção Sobre
6. `src/views/EquipamentosLista.vue` - Adicionar coluna certificado
7. `src/views/RelatoriosLista.vue` - Corrigir filtros e PDF
8. `src/stores/auth.js` - Corrigir lógica de login
9. `src/router/index.js` - Adicionar rotas faltantes

## PRIORIDADE DE EXECUÇÃO:

1. **CRÍTICO** (Impede uso do sistema):
   - SQL no Supabase
   - Correção de login
   - Correção de rotas (Vínculos → Login)

2. **ALTO** (Funcionalidades principais):
   - Coluna certificado PDF
   - Relatórios funcionando
   - Filtros corrigidos

3. **MÉDIO** (Melhorias):
   - Créditos no Sobre
   - Perfil e Configurações
   - Logs de erro

4. **BAIXO** (Nice to have):
   - APK Android (requer build externo)
   - Recuperação de senha por email real

## TEMPO ESTIMADO:
- Correções críticas: 30 minutos
- Correções altas: 45 minutos
- Correções médias: 30 minutos
- **TOTAL**: ~2 horas

## NOTA IMPORTANTE:
**O APK Android não pode ser gerado neste ambiente sandbox.**
- Requer Android Studio + JDK + Gradle
- Tempo de compilação: ~10-15 minutos
- Solução: PWA (Progressive Web App) já está funcional!
  - Chrome → Menu → "Adicionar à tela inicial"
  - Funciona como app nativo
