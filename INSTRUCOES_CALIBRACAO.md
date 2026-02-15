# 🚀 INSTRUÇÕES: Implementação do Módulo de Calibração

## PASSO 1: Executar Script SQL no Supabase ⏱️ 2 minutos

1. **Acesse o Supabase**: https://earrnuuvdzawclxsyoxk.supabase.co
2. **Vá no SQL Editor** (menu lateral)
3. **Crie uma New Query**
4. **Copie e cole TODO o conteúdo do arquivo**: `supabase-calibracao-completo.sql`
5. **Clique em RUN** ▶️
6. **Aguarde a mensagem**: "Schema de Calibração criado com sucesso!"

### ✅ O que o script faz:

- ✅ Cria tabela `criterios_retrorrefletancia` (84 registros de valores mínimos)
- ✅ Atualiza tabela `historico_calibracoes` com 18 novos campos
- ✅ Insere TODOS os critérios das normas ABNT:
  - 42 critérios para Placas (Tipos I-VIII, 6 cores cada)
  - 12 critérios para Tintas (4 materiais, 2 cores)
  - 6 critérios para Tachas (3 cores, 2 geometrias)
  - 3 critérios para Tachões
- ✅ Cria 2 views SQL:
  - `vw_calibracoes_status` - Status de cada equipamento
  - `vw_dashboard_calibracoes` - Estatísticas gerais
- ✅ Cria função `calcular_status_calibracao()` - Validação automática

---

## PASSO 2: Aguardar Implementação da View Vue ⏱️ Em progresso...

Estou criando agora:
- `CalibracoesLista.vue` - Interface completa
- `calibracaoService.js` - Lógica de validação
- Integração com Dashboard
- Alertas automáticos

---

## 📊 APÓS A IMPLEMENTAÇÃO, VOCÊ TERÁ:

### 1. Menu "Calibração" com:
- 📋 Lista de equipamentos + status (🟢 EM DIA / 🟡 ATENÇÃO / 🔴 VENCIDA)
- 📊 Dashboard: Total em dia, próximo ao vencimento, vencidas
- 🔍 Filtros: Status, tipo, cor, período
- ➕ Botão "Nova Calibração"

### 2. Formulário de Nova Calibração:
- Selecionar equipamento
- Informar tipo de película/material
- Cor da medição
- Geometria (0,2°/-4°, 15m, etc.)
- Inserir valores medidos (5 pontos para placas, 10+ para tintas)
- Upload de certificado (PDF)
- Fotos da medição
- Técnico responsável
- Condições ambientais

### 3. Validação Automática Inteligente:
```
Sistema busca automaticamente o valor mínimo correto
↓
Compara com suas medições
↓
Status: ✅ APROVADO / ❌ REPROVADO / ⚠️ ATENÇÃO
↓
Calcula próxima calibração (12 meses)
↓
Registra no histórico
```

### 4. Alertas no Dashboard:
- Badge vermelho: "3 equipamentos vencidos!"
- Notificação: "5 equipamentos próximos ao vencimento"

---

## 🎯 EXEMPLO DE USO:

**Cenário**: Medir placa branca Tipo II

1. Abrir "Calibração" → "Nova Calibração"
2. Selecionar: Equipamento "MLX-V1 VERTICAL"
3. Informar:
   - Tipo Película: "Tipo II"
   - Cor: "Branco"
   - Geometria: "0,2°/-4°"
4. Inserir 5 medições:
   ```
   Ponto 1: 152 cd/(lx·m²)
   Ponto 2: 148 cd/(lx·m²)
   Ponto 3: 155 cd/(lx·m²)
   Ponto 4: 145 cd/(lx·m²)  ← REPROVADO! (< 140)
   Ponto 5: 151 cd/(lx·m²)
   ```
5. Sistema calcula:
   - Média: 150.2 cd/(lx·m²) ✅
   - Mínimo: 145 cd/(lx·m²) ❌
   - **STATUS: REPROVADO** (pelo menos 1 ponto < 140)
   - Observação: "Ponto 4 abaixo do mínimo - verificar película"

---

## 📝 PRÓXIMOS PASSOS:

1. ✅ **VOCÊ**: Execute o script SQL no Supabase
2. ⏳ **EU**: Crie a view Vue completa (20-30 min)
3. ✅ **VOCÊ**: Teste o sistema
4. 🎉 **RESULTADO**: Sistema 100% completo!

---

**Aguarde enquanto eu crio a interface...** 🚀
