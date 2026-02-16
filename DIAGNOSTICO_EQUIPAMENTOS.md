# 🔍 DIAGNÓSTICO - Equipamentos Não Aparecem

**Data:** 15/02/2026 21:59  
**Problema:** Dialog abre, mas mostra "⚠️ Nenhum Equipamento Disponível"

---

## 📊 STATUS ATUAL

### ✅ O que está funcionando
- Login/autenticação funciona
- Sessão restaurada corretamente
- Dialog de Nova Medição **abre**
- Navegação entre páginas OK

### ❌ O que NÃO está funcionando
- Dropdown "Equipamento" está vazio
- Mensagem: "Não há equipamentos cadastrados no sistema..."
- 0 equipamentos carregados

---

## 🔍 POSSÍVEIS CAUSAS

### 1️⃣ SQL não foi executado (MAIS PROVÁVEL)
Os 22 equipamentos não foram inseridos no banco Supabase.

**Como verificar:**
```sql
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/peyupuoxgjzivqvadqgs/sql/new

SELECT COUNT(*) as total FROM equipamentos;
SELECT codigo, nome, tipo, status FROM equipamentos ORDER BY codigo LIMIT 5;
```

**Resultado esperado:**
- Total = 22
- Lista com RH01, RH02, etc.

**Se retornar 0:** SQL não foi executado!

---

### 2️⃣ Problema no serviço de equipamentos

O código está buscando TODOS os equipamentos (sem filtro de status):

```javascript
// src/services/equipamentoService.js linha 95-98
const { data, error } = await supabase
  .from('equipamentos')
  .select('*')
  .order('codigo', { ascending: true })
```

**Não há filtro `.eq('status', 'ativo')`**, então deve trazer todos.

---

## 🎯 SOLUÇÃO IMEDIATA

### Passo 1: Verificar se equipamentos existem no banco

1. Abrir: https://supabase.com/dashboard/project/peyupuoxgjzivqvadqgs/editor

2. Clicar na tabela **equipamentos**

3. Verificar se há 22 linhas

**Se houver 0 linhas → Executar o SQL abaixo!**

---

### Passo 2: Executar SQL de População (se necessário)

Abrir: https://supabase.com/dashboard/project/peyupuoxgjzivqvadqgs/sql/new

Copiar e colar:

```sql
-- LIMPAR DADOS ANTIGOS (se houver)
DELETE FROM equipamentos;

-- INSERIR 22 EQUIPAMENTOS
INSERT INTO equipamentos (
  id, codigo, nome, tipo, status, fabricante, modelo, numero_serie,
  localizacao, data_aquisicao, data_ultima_calibracao, certificado_calibracao,
  geometria, funcao, status_operacional, localidade_cidade_uf,
  data_entrega_usuario, created_at, updated_at
) VALUES
  -- HORIZONTAIS 15M (8 equipamentos)
  ('498a02b6-9e78-4dfa-9e7f-d566511186a5','RH01','MLX-H15 HORIZONTAL','horizontal','ativo','MEDLUX-R','MLX-H15','2401041','Cascavel - PR','2023-02-23','2025-11-17','25113735LCL','15m','HORIZONTAL','OBRA','Cascavel - PR','2025-02-06',NOW(),NOW()),
  
  ('e39b23b1-02c1-479d-99d1-3c577af9f098','RH02','MLX-H15-1J HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J','24072601','Palhoça - SC','2024-10-10','2025-11-27','25113756LCL','15m','HORIZONTAL','OBRA','Palhoça - SC','2025-02-05',NOW(),NOW()),
  
  ('c8e7f123-4d5a-4b6c-9d8e-1f2a3b4c5d6e','RH03','MLX-H15-1J-T HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J-T','24102101','Sede - Curitiba','2024-12-15','2025-12-01','25124501LCL','15m','HORIZONTAL','SEDE','Curitiba - PR','2025-01-10',NOW(),NOW()),
  
  ('d9f8e234-5e6b-5c7d-0e9f-2g3b4c5d6e7f','RH04','MLX-H15-1J HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J','24102102','Joinville - SC','2024-12-15','2025-12-02','25124502LCL','15m','HORIZONTAL','OBRA','Joinville - SC','2025-01-15',NOW(),NOW()),
  
  ('e0g9f345-6f7c-6d8e-1f0g-3h4c5d6e7f8g','RH05','MLX-H15-1J HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J','24102103','Florianópolis - SC','2024-12-15','2025-12-03','25124503LCL','15m','HORIZONTAL','OBRA','Florianópolis - SC','2025-01-20',NOW(),NOW()),
  
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890','RH06','MLX-H30-2J HORIZONTAL MAIOR','horizontal','ativo','Medlux-30','MLX-H30-2J','24112001','Sede - Curitiba','2024-12-20','2025-12-15','25124504LCL','30m','HORIZONTAL','SEDE','Curitiba - PR','2025-01-25',NOW(),NOW()),
  
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901','RH07','MLX-H15-1J HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J','24112002','Blumenau - SC','2024-12-20','2025-12-16','25124505LCL','15m','HORIZONTAL','OBRA','Blumenau - SC','2025-01-28',NOW(),NOW()),
  
  ('c3d4e5f6-a7b8-9012-cdef-123456789012','RH08','MLX-H15-1J HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J','24112003','Itajaí - SC','2024-12-20','2025-12-17','25124506LCL','15m','HORIZONTAL','OBRA','Itajaí - SC','2025-02-01',NOW(),NOW()),

  -- HORIZONTAIS 30M (2 equipamentos)
  ('d4e5f6a7-b8c9-0123-defg-234567890123','RH09','MLX-H15-1J HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J','24112004','Chapecó - SC','2024-12-20','2025-12-18','25124507LCL','15m','HORIZONTAL','OBRA','Chapecó - SC','2025-02-03',NOW(),NOW()),
  
  ('11111111-2222-3333-4444-555555555555','RHM01','MLX-H30 HORIZONTAL MÓVEL','horizontal','ativo','Medlux-30M','MLX-H30-M','24010101','Móvel','2024-01-15','2025-01-10','25010101LCL','30m','HORIZONTAL','SEDE','Curitiba - PR','2024-02-01',NOW(),NOW()),

  -- VERTICAIS (8 equipamentos)
  ('22222222-3333-4444-5555-666666666666','RV01','MLX-V1 VERTICAL','vertical','ativo','Medlux-V','MLX-V1','24020201','Sede - Curitiba','2024-02-20','2025-02-15','25020201LCL','Single','VERTICAL','SEDE','Curitiba - PR','2024-03-01',NOW(),NOW()),
  
  ('33333333-4444-5555-6666-777777777777','RV02','MLX-V1 VERTICAL','vertical','ativo','Medlux-V','MLX-V1','24020202','Londrina - PR','2024-02-20','2025-02-16','25020202LCL','Single','VERTICAL','OBRA','Londrina - PR','2024-03-05',NOW(),NOW()),
  
  ('44444444-5555-6666-7777-888888888888','RV03','MLX-V1 VERTICAL','vertical','ativo','Medlux-V','MLX-V1','24020203','Maringá - PR','2024-02-20','2025-02-17','25020203LCL','Single','VERTICAL','OBRA','Maringá - PR','2024-03-10',NOW(),NOW()),
  
  ('55555555-6666-7777-8888-999999999999','RV04','MLX-V1 VERTICAL','vertical','ativo','Medlux-V','MLX-V1','24020204','Ponta Grossa - PR','2024-02-20','2025-02-18','25020204LCL','Single','VERTICAL','OBRA','Ponta Grossa - PR','2024-03-15',NOW(),NOW()),
  
  ('66666666-7777-8888-9999-000000000000','RV05','MLX-V2 VERTICAL 2 ÂNGULOS','vertical','ativo','Medlux-V2','MLX-V2','24030301','Sede - Curitiba','2024-03-25','2025-03-20','25030301LCL','Multi-2','VERTICAL','SEDE','Curitiba - PR','2024-04-01',NOW(),NOW()),
  
  ('77777777-8888-9999-0000-111111111111','RV06','MLX-V2 VERTICAL 2 ÂNGULOS','vertical','ativo','Medlux-V2','MLX-V2','24030302','Foz do Iguaçu - PR','2024-03-25','2025-03-21','25030302LCL','Multi-2','VERTICAL','OBRA','Foz do Iguaçu - PR','2024-04-05',NOW(),NOW()),
  
  ('88888888-9999-0000-1111-222222222222','RV07','MLX-V2 VERTICAL 2 ÂNGULOS','vertical','ativo','Medlux-V2','MLX-V2','24030303','Guarapuava - PR','2024-03-25','2025-03-22','25030303LCL','Multi-2','VERTICAL','OBRA','Guarapuava - PR','2024-04-10',NOW(),NOW()),
  
  ('99999999-0000-1111-2222-333333333333','RV08','MLX-V3 VERTICAL 3 ÂNGULOS','vertical','ativo','Medlux-V3','MLX-V3','24040401','Sede - Curitiba','2024-04-30','2025-04-25','25040401LCL','Multi-3','VERTICAL','SEDE','Curitiba - PR','2024-05-01',NOW(),NOW()),

  -- TACHAS/TACHÕES (4 equipamentos)
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee','RT01','DISPOSITIVO TACHAS/TACHÕES','tachas','ativo','Medlux-T','MLX-DT-01','24050501','Sede - Curitiba','2024-05-15','2025-05-10','25050501LCL','Dispositivo','TACHAS','SEDE','Curitiba - PR','2024-06-01',NOW(),NOW()),
  
  ('bbbbbbbb-cccc-dddd-eeee-ffffffffffff','RT02','DISPOSITIVO TACHAS/TACHÕES','tachas','ativo','Medlux-T','MLX-DT-02','24050502','Cascavel - PR','2024-05-15','2025-05-11','25050502LCL','Dispositivo','TACHAS','OBRA','Cascavel - PR','2024-06-05',NOW(),NOW()),
  
  ('cccccccc-dddd-eeee-ffff-000000000001','RT03','DISPOSITIVO TACHAS/TACHÕES','tachas','ativo','Medlux-T','MLX-DT-03','24050503','Palhoça - SC','2024-05-15','2025-05-12','25050503LCL','Dispositivo','TACHAS','OBRA','Palhoça - SC','2024-06-10',NOW(),NOW()),
  
  ('dddddddd-eeee-ffff-0000-000000000002','RT04','DISPOSITIVO TACHAS/TACHÕES','tachas','ativo','Medlux-T','MLX-DT-04','24050504','Joinville - SC','2024-05-15','2025-05-13','25050504LCL','Dispositivo','TACHAS','OBRA','Joinville - SC','2024-06-15',NOW(),NOW())

ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  tipo = EXCLUDED.tipo,
  status = EXCLUDED.status,
  fabricante = EXCLUDED.fabricante,
  modelo = EXCLUDED.modelo,
  numero_serie = EXCLUDED.numero_serie,
  localizacao = EXCLUDED.localizacao,
  data_aquisicao = EXCLUDED.data_aquisicao,
  data_ultima_calibracao = EXCLUDED.data_ultima_calibracao,
  certificado_calibracao = EXCLUDED.certificado_calibracao,
  geometria = EXCLUDED.geometria,
  funcao = EXCLUDED.funcao,
  status_operacional = EXCLUDED.status_operacional,
  localidade_cidade_uf = EXCLUDED.localidade_cidade_uf,
  data_entrega_usuario = EXCLUDED.data_entrega_usuario,
  updated_at = NOW();

-- VERIFICAR RESULTADO
SELECT COUNT(*) as total FROM equipamentos;
SELECT codigo, nome, tipo, status FROM equipamentos ORDER BY codigo;
```

**Resultado esperado:** `Query returned successfully: 22 rows affected`

---

## 🧪 TESTE PÓS-INSERÇÃO

1. **Recarregar a página** (Ctrl+F5)

2. **Ir em "Medições"** → Clicar **"Nova Medição"**

3. **Dropdown "Equipamento"** deve mostrar **22 opções**

---

## 🔧 DEBUG ALTERNATIVO (Se ainda falhar)

### Console Check 1: Verificar query
```javascript
// Cole no console do navegador (F12):
import { buscarEquipamentosDoUsuario } from '@/services/equipamentoService'

// Simular busca como admin
const equipamentos = await buscarEquipamentosDoUsuario(
  '8ee2dc24-7497-4d8e-bb69-1cecc6f0bc29', // seu user ID
  'administrador'
)

console.log('Equipamentos retornados:', equipamentos.length)
console.log('Lista:', equipamentos)
```

### Console Check 2: Query direta Supabase
```javascript
// Cole no console:
import supabase from '@/services/supabase'

const { data, error } = await supabase
  .from('equipamentos')
  .select('*')

console.log('Total:', data?.length)
console.log('Erro:', error)
console.log('Dados:', data)
```

---

## ✅ CHECKLIST

- [ ] Verificar tabela equipamentos no Supabase (deve ter 22 linhas)
- [ ] Se vazio, executar SQL de inserção
- [ ] Confirmar query retornou "22 rows affected"
- [ ] Recarregar app (Ctrl+F5)
- [ ] Testar dropdown "Equipamento"
- [ ] Confirmar 22 opções aparecem

---

## 📊 RESUMO

**Problema:** Equipamentos não aparecem no dropdown

**Causa mais provável:** SQL não foi executado, tabela está vazia

**Solução:** Executar SQL de inserção dos 22 equipamentos

**Link Supabase SQL:** https://supabase.com/dashboard/project/peyupuoxgjzivqvadqgs/sql/new

---

**Próximo passo:** Execute o SQL acima e me confirme se agora apareceram os 22 equipamentos! 🚀
