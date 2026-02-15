# Como Popular Equipamentos no Supabase

## Problema
O banco de dados Supabase não tem equipamentos cadastrados, causando o erro "Nenhum equipamento disponível".

## Solução

### Opção 1: Via SQL Editor no Supabase Dashboard

1. **Acesse**: https://supabase.com/dashboard/project/peyupuoxgjzivqvadqgs/sql/new
2. **Cole o SQL abaixo** e execute:

```sql
-- Inserir os 22 equipamentos do backup
INSERT INTO equipamentos (
  id, codigo, nome, tipo, status, fabricante, modelo, numero_serie,
  localizacao, data_aquisicao, data_ultima_calibracao, certificado_calibracao,
  geometria, funcao, status_operacional, localidade_cidade_uf,
  data_entrega_usuario, created_at, updated_at
) VALUES
('498a02b6-9e78-4dfa-9e7f-d566511186a5', 'RH01', 'MLX-H15 HORIZONTAL', 'horizontal', 'ativo', 'MEDLUX-R', 'MLX-H15', '2401041', 'Cascavel - PR', '2023-02-23', '2025-11-17', '25113735LCL', '15m', 'HORIZONTAL', 'OBRA', 'Cascavel - PR', '2025-02-06', NOW(), NOW()),
('e39b23b1-02c1-479d-99d1-3c577af9f098', 'RH02', 'MLX-H15-1J HORIZONTAL', 'horizontal', 'ativo', 'Medlux-T', 'MLX-H15-1J', '24072601', 'Palhoça - SC', '2024-10-10', '2025-11-27', '25113756LCL', '15m', 'HORIZONTAL', 'OBRA', 'Palhoça - SC', '2025-02-05', NOW(), NOW()),
('7d1e4a9f-3b2c-4d5e-8f6a-1c7b9e0d2a3f', 'RH03', 'MLX-H15 HORIZONTAL', 'horizontal', 'ativo', 'MEDLUX-R', 'MLX-H15', '2401062', 'Palmas - TO', '2023-02-23', '2025-11-17', '25113736LCL', '15m', 'HORIZONTAL', 'OBRA', 'Palmas - TO', '2025-02-07', NOW(), NOW()),
('2b5c8d6e-4f7a-3e1d-9c2b-8a0f1e4d7c6b', 'RH04', 'MLX-H15 HORIZONTAL', 'horizontal', 'ativo', 'MEDLUX-R', 'MLX-H15', '2401031', 'Chapecó - SC', '2023-02-23', '2025-11-17', '25113737LCL', '15m', 'HORIZONTAL', 'OBRA', 'Chapecó - SC', '2025-02-05', NOW(), NOW()),
('9e3f1c7b-5d8a-4e2f-7b6c-3a1e9d0f2c4b', 'RH05', 'MLX-H15 HORIZONTAL', 'horizontal', 'ativo', 'MEDLUX-R', 'MLX-H15', '2401032', 'Itajaí - SC', '2023-02-23', '2025-11-17', '25113738LCL', '15m', 'HORIZONTAL', 'OBRA', 'Itajaí - SC', '2025-02-04', NOW(), NOW()),
('4d7e2b9f-6c3a-5f1e-8d4c-2b0f9e7a3c1d', 'RH06', 'MLX-H15 HORIZONTAL', 'horizontal', 'ativo', 'MEDLUX-R', 'MLX-H15', '2401033', 'Volta Redonda - RJ', '2023-02-23', '2025-11-17', '25113734LCL', '15m', 'HORIZONTAL', 'OBRA', 'Volta Redonda - RJ', '2025-02-10', NOW(), NOW()),
('8f1c5e7a-3d9b-4f2e-6c8a-1e0d9b7f3c5a', 'RH07', 'MLX-H15 HORIZONTAL', 'horizontal', 'ativo', 'MEDLUX-R', 'MLX-H15', '2401040', 'Salvador - BA', '2023-02-23', '2025-11-27', '25113769LCL', '15m', 'HORIZONTAL', 'SEDE', 'Salvador - BA', NULL, NOW(), NOW()),
('1c9e4f7b-2d6a-5f3e-8c7b-4a1e0d9f2c8b', 'RH08', 'MLX-H15 HORIZONTAL', 'horizontal', 'ativo', 'MEDLUX-R', 'MLX-H15', '2401034', 'Feira de Santana - BA', '2023-02-23', '2025-11-27', '25113770LCL', '15m', 'HORIZONTAL', 'OBRA', 'Feira de Santana - BA', '2025-02-08', NOW(), NOW()),
('6e2d9f4c-8b5a-3e7f-1c9b-4d0a7e2f8c1b', 'RH09', 'MLX-H30 HORIZONTAL 30M', 'horizontal', 'ativo', 'MEDLUX-R', 'MLX-H30', '2401051', 'Salvador - BA', '2023-02-23', '2025-11-27', '25113771LCL', '30m', 'HORIZONTAL', 'SEDE', 'Salvador - BA', NULL, NOW(), NOW()),
('3f8c1e9d-7b4a-2e6f-5c9b-1d0a8e7f4c2b', 'RHM01', 'MLX-HM HORIZONTAL MÓVEL', 'horizontal', 'ativo', 'MEDLUX-R', 'MLX-HM', '2401052', 'Salvador - BA', '2023-02-23', '2025-11-27', '25113772LCL', '30m', 'HORIZONTAL', 'SEDE', 'Salvador - BA', NULL, NOW(), NOW()),
('5d9e2f8c-4b7a-1e3f-6c9b-2d0a7e8f1c3b', 'RV01', 'MLX-V1A VERTICAL', 'vertical', 'ativo', 'MEDLUX-R', 'MLX-V1A', '2401020', 'Cascavel - PR', '2023-02-23', '2025-11-17', '25113739LCL', '0,2° / -4°', 'VERTICAL', 'OBRA', 'Cascavel - PR', '2025-02-06', NOW(), NOW()),
('7f1c9e4d-8b6a-2e5f-3c9b-4d0a1e7f8c2b', 'RV02', 'MLX-VM3 VERTICAL', 'vertical', 'ativo', 'MEDLUX-R', 'MLX-VM3', '2401021', 'Chapecó - SC', '2023-02-23', '2025-11-17', '25113747LCL', 'multi-ângulo', 'VERTICAL', 'OBRA', 'Chapecó - SC', '2025-02-05', NOW(), NOW()),
('2e9f4c7b-5d6a-1e8f-3c9b-7d0a4e1f8c2b', 'RV03', 'MLX-VM3 VERTICAL', 'vertical', 'ativo', 'MEDLUX-R', 'MLX-VM3', '2401022', 'Itajaí - SC', '2023-02-23', '2025-11-17', '25113749LCL', 'multi-ângulo', 'VERTICAL', 'OBRA', 'Itajaí - SC', '2025-02-04', NOW(), NOW()),
('8c1f9e7d-4b3a-2e6f-5c9b-1d0a7e4f8c2b', 'RV04', 'MLX-V1A VERTICAL', 'vertical', 'ativo', 'MEDLUX-R', 'MLX-V1A', '2401023', 'Palhoça - SC', '2023-02-23', '2025-11-27', '25113765LCL', '0,2° / -4°', 'VERTICAL', 'OBRA', 'Palhoça - SC', '2025-02-05', NOW(), NOW()),
('4d7e9f2c-8b6a-1e5f-3c9b-2d0a7e1f8c4b', 'RV05', 'MLX-VM3 VERTICAL', 'vertical', 'ativo', 'MEDLUX-R', 'MLX-VM3', '2401024', 'Volta Redonda - RJ', '2023-02-23', '2025-11-17', '25113748LCL', 'multi-ângulo', 'VERTICAL', 'OBRA', 'Volta Redonda - RJ', '2025-02-10', NOW(), NOW()),
('9e2f4c7b-5d8a-1e6f-3c9b-4d0a7e2f1c8b', 'RV06', 'MLX-V1A VERTICAL', 'vertical', 'ativo', 'MEDLUX-R', 'MLX-V1A', '2401025', 'Palmas - TO', '2023-02-23', '2025-11-17', '25113746LCL', '0,2° / -4°', 'VERTICAL', 'OBRA', 'Palmas - TO', '2025-02-07', NOW(), NOW()),
('1f8c9e4d-7b5a-2e6f-3c9b-4d0a8e7f1c2b', 'RV07', 'MLX-VM3 VERTICAL', 'vertical', 'ativo', 'MEDLUX-R', 'MLX-VM3', '2401026', 'Feira de Santana - BA', '2023-02-23', '2025-11-27', '25113773LCL', 'multi-ângulo', 'VERTICAL', 'OBRA', 'Feira de Santana - BA', '2025-02-08', NOW(), NOW()),
('6d9e2f8c-4b7a-1e5f-3c9b-2d0a7e8f4c1b', 'RV08', 'MLX-VM3 VERTICAL', 'vertical', 'ativo', 'MEDLUX-R', 'MLX-VM3', '2401027', 'Salvador - BA', '2023-02-23', '2025-11-27', '25113774LCL', 'multi-ângulo', 'VERTICAL', 'SEDE', 'Salvador - BA', NULL, NOW(), NOW()),
('3f1c8e9d-7b4a-2e6f-5c9b-1d0a8e7f2c4b', 'RT01', 'MLX-T TACHAS', 'tachas', 'ativo', 'MEDLUX-R', 'MLX-T', '2401010', 'Cascavel - PR', '2023-02-23', '2025-11-17', '25113744LCL', '0,2° / 0° e 20°', 'TACHAS', 'OBRA', 'Cascavel - PR', '2025-02-06', NOW(), NOW()),
('8e2f9c4d-5b7a-1e6f-3c9b-4d0a7e2f8c1b', 'RT02', 'MLX-T TACHAS', 'tachas', 'ativo', 'MEDLUX-R', 'MLX-T', '2401011', 'Chapecó - SC', '2023-02-23', '2025-11-17', '25113743LCL', '0,2° / 0° e 20°', 'TACHAS', 'OBRA', 'Chapecó - SC', '2025-02-05', NOW(), NOW()),
('4c9e7f2d-8b6a-1e5f-3c9b-2d0a7e1f4c8b', 'RT03', 'MLX-T TACHAS', 'tachas', 'ativo', 'MEDLUX-R', 'MLX-T', '2401012', 'Salvador - BA', '2023-02-23', '2025-11-27', '25113775LCL', '0,2° / 0° e 20°', 'TACHAS', 'SEDE', 'Salvador - BA', NULL, NOW(), NOW()),
('7d1e9f4c-2b8a-5e6f-3c9b-1d0a4e7f8c2b', 'RT04', 'MLX-T TACHAS', 'tachas', 'ativo', 'MEDLUX-R', 'MLX-T', '2401013', 'Feira de Santana - BA', '2023-02-23', '2025-11-27', '25113776LCL', '0,2° / 0° e 20°', 'TACHAS', 'OBRA', 'Feira de Santana - BA', '2025-02-08', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verificar quantos foram inseridos
SELECT COUNT(*) as total_equipamentos FROM equipamentos;

-- Listar todos os equipamentos
SELECT codigo, nome, tipo, status, fabricante, modelo FROM equipamentos ORDER BY codigo;
```

### Opção 2: Via API REST

Se preferir usar a API REST do Supabase:

```bash
# URL: https://peyupuoxgjzivqvadqgs.supabase.co/rest/v1/equipamentos
# Headers:
#   apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
#   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
#   Content-Type: application/json
#   Prefer: return=representation

# Body: ver medlux-backup.json → data.equipamentos (array de 22 objetos)
```

## Verificação

Depois de executar, acesse a aplicação:
- URL: https://medlux-reflective-complete.vercel.app
- Usuário: ranieri.santos16@gmail.com
- Abra "Nova Medição de Retrorrefletância"
- O dropdown deve mostrar os 22 equipamentos

## Equipamentos a serem inseridos

- **Horizontal 15m** (RH01-RH08): 8 equipamentos
- **Horizontal 30m** (RH09, RHM01): 2 equipamentos
- **Vertical** (RV01-RV08): 8 equipamentos
- **Tachas** (RT01-RT04): 4 equipamentos

**Total**: 22 equipamentos

## Status Atual

✅ Auth Store corrigido (usuario.value)  
✅ Script SQL gerado  
⏳ Aguardando execução SQL no Supabase Dashboard  
⏳ Teste na aplicação após inserção
