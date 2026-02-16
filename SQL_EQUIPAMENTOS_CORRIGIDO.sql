-- LIMPAR DADOS ANTIGOS (se houver)
DELETE FROM equipamentos;

-- INSERIR 22 EQUIPAMENTOS COM UUIDs VÁLIDOS
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
  
  ('d9f8e234-5e6b-5c7d-0e9f-2a3b4c5d6e7f','RH04','MLX-H15-1J HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J','24102102','Joinville - SC','2024-12-15','2025-12-02','25124502LCL','15m','HORIZONTAL','OBRA','Joinville - SC','2025-01-15',NOW(),NOW()),
  
  ('e0f9a345-6f7c-6d8e-1f0a-3b4c5d6e7f8a','RH05','MLX-H15-1J HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J','24102103','Florianópolis - SC','2024-12-15','2025-12-03','25124503LCL','15m','HORIZONTAL','OBRA','Florianópolis - SC','2025-01-20',NOW(),NOW()),
  
  ('a1b2c3d4-e5f6-4890-abcd-ef1234567890','RH06','MLX-H30-2J HORIZONTAL MAIOR','horizontal','ativo','Medlux-30','MLX-H30-2J','24112001','Sede - Curitiba','2024-12-20','2025-12-15','25124504LCL','30m','HORIZONTAL','SEDE','Curitiba - PR','2025-01-25',NOW(),NOW()),
  
  ('b2c3d4e5-f6a7-4901-bcde-f12345678901','RH07','MLX-H15-1J HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J','24112002','Blumenau - SC','2024-12-20','2025-12-16','25124505LCL','15m','HORIZONTAL','OBRA','Blumenau - SC','2025-01-28',NOW(),NOW()),
  
  ('c3d4e5f6-a7b8-4012-cdef-123456789012','RH08','MLX-H15-1J HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J','24112003','Itajaí - SC','2024-12-20','2025-12-17','25124506LCL','15m','HORIZONTAL','OBRA','Itajaí - SC','2025-02-01',NOW(),NOW()),

  -- HORIZONTAIS 30M (2 equipamentos)
  ('d4e5f6a7-b8c9-4123-defa-234567890123','RH09','MLX-H15-1J HORIZONTAL','horizontal','ativo','Medlux-T','MLX-H15-1J','24112004','Chapecó - SC','2024-12-20','2025-12-18','25124507LCL','15m','HORIZONTAL','OBRA','Chapecó - SC','2025-02-03',NOW(),NOW()),
  
  ('11111111-2222-4333-4444-555555555555','RHM01','MLX-H30 HORIZONTAL MÓVEL','horizontal','ativo','Medlux-30M','MLX-H30-M','24010101','Móvel','2024-01-15','2025-01-10','25010101LCL','30m','HORIZONTAL','SEDE','Curitiba - PR','2024-02-01',NOW(),NOW()),

  -- VERTICAIS (8 equipamentos)
  ('22222222-3333-4444-5555-666666666666','RV01','MLX-V1 VERTICAL','vertical','ativo','Medlux-V','MLX-V1','24020201','Sede - Curitiba','2024-02-20','2025-02-15','25020201LCL','Single','VERTICAL','SEDE','Curitiba - PR','2024-03-01',NOW(),NOW()),
  
  ('33333333-4444-5555-6666-777777777777','RV02','MLX-V1 VERTICAL','vertical','ativo','Medlux-V','MLX-V1','24020202','Londrina - PR','2024-02-20','2025-02-16','25020202LCL','Single','VERTICAL','OBRA','Londrina - PR','2024-03-05',NOW(),NOW()),
  
  ('44444444-5555-6666-7777-888888888888','RV03','MLX-V1 VERTICAL','vertical','ativo','Medlux-V','MLX-V1','24020203','Maringá - PR','2024-02-20','2025-02-17','25020203LCL','Single','VERTICAL','OBRA','Maringá - PR','2024-03-10',NOW(),NOW()),
  
  ('55555555-6666-7777-8888-999999999999','RV04','MLX-V1 VERTICAL','vertical','ativo','Medlux-V','MLX-V1','24020204','Ponta Grossa - PR','2024-02-20','2025-02-18','25020204LCL','Single','VERTICAL','OBRA','Ponta Grossa - PR','2024-03-15',NOW(),NOW()),
  
  ('66666666-7777-8888-9999-aaaaaaaaaaaa','RV05','MLX-V2 VERTICAL 2 ÂNGULOS','vertical','ativo','Medlux-V2','MLX-V2','24030301','Sede - Curitiba','2024-03-25','2025-03-20','25030301LCL','Multi-2','VERTICAL','SEDE','Curitiba - PR','2024-04-01',NOW(),NOW()),
  
  ('77777777-8888-9999-aaaa-bbbbbbbbbbbb','RV06','MLX-V2 VERTICAL 2 ÂNGULOS','vertical','ativo','Medlux-V2','MLX-V2','24030302','Foz do Iguaçu - PR','2024-03-25','2025-03-21','25030302LCL','Multi-2','VERTICAL','OBRA','Foz do Iguaçu - PR','2024-04-05',NOW(),NOW()),
  
  ('88888888-9999-aaaa-bbbb-cccccccccccc','RV07','MLX-V2 VERTICAL 2 ÂNGULOS','vertical','ativo','Medlux-V2','MLX-V2','24030303','Guarapuava - PR','2024-03-25','2025-03-22','25030303LCL','Multi-2','VERTICAL','OBRA','Guarapuava - PR','2024-04-10',NOW(),NOW()),
  
  ('99999999-aaaa-bbbb-cccc-dddddddddddd','RV08','MLX-V3 VERTICAL 3 ÂNGULOS','vertical','ativo','Medlux-V3','MLX-V3','24040401','Sede - Curitiba','2024-04-30','2025-04-25','25040401LCL','Multi-3','VERTICAL','SEDE','Curitiba - PR','2024-05-01',NOW(),NOW()),

  -- TACHAS/TACHÕES (4 equipamentos)
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee','RT01','DISPOSITIVO TACHAS/TACHÕES','tachas','ativo','Medlux-T','MLX-DT-01','24050501','Sede - Curitiba','2024-05-15','2025-05-10','25050501LCL','Dispositivo','TACHAS','SEDE','Curitiba - PR','2024-06-01',NOW(),NOW()),
  
  ('bbbbbbbb-cccc-dddd-eeee-ffffffffffff','RT02','DISPOSITIVO TACHAS/TACHÕES','tachas','ativo','Medlux-T','MLX-DT-02','24050502','Cascavel - PR','2024-05-15','2025-05-11','25050502LCL','Dispositivo','TACHAS','OBRA','Cascavel - PR','2024-06-05',NOW(),NOW()),
  
  ('cccccccc-dddd-eeee-ffff-aaaaaaaaaaab','RT03','DISPOSITIVO TACHAS/TACHÕES','tachas','ativo','Medlux-T','MLX-DT-03','24050503','Palhoça - SC','2024-05-15','2025-05-12','25050503LCL','Dispositivo','TACHAS','OBRA','Palhoça - SC','2024-06-10',NOW(),NOW()),
  
  ('dddddddd-eeee-ffff-aaaa-bbbbbbbbbbc2','RT04','DISPOSITIVO TACHAS/TACHÕES','tachas','ativo','Medlux-T','MLX-DT-04','24050504','Joinville - SC','2024-05-15','2025-05-13','25050504LCL','Dispositivo','TACHAS','OBRA','Joinville - SC','2024-06-15',NOW(),NOW());

-- VERIFICAR RESULTADO
SELECT COUNT(*) as total FROM equipamentos;
SELECT codigo, nome, tipo, status FROM equipamentos ORDER BY codigo;
