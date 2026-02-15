# 📱 Sistema de Medições para Operadores - MEDLUX Reflective

## 📋 Visão Geral

Sistema completo de medições de retrorrefletância com **adaptação automática** baseada no perfil do usuário e tipo de equipamento vinculado.

---

## 🔐 Perfis de Usuário

### 👨‍💼 Administrador / Admin
- **Acesso Total**: todos os equipamentos e medições
- **Menu**: Dashboard, Equipamentos, Vínculos, Medições, Relatórios, Usuários, Auditoria, Sistema
- **Permissões**: criar, editar, excluir tudo

### 👷 Técnico
- **Acesso**: todos os equipamentos
- **Menu**: Dashboard, Equipamentos, Vínculos, Medições, Relatórios
- **Permissões**: visualizar e criar medições

### 🔧 Operador
- **Acesso**: **apenas equipamentos vinculados**
- **Menu**: Dashboard, **Meus Equipamentos**, **Minhas Medições**
- **Permissões**: visualizar equipamentos vinculados e criar medições
- **Automação**: nome preenchido automaticamente, seleção única se tiver 1 equipamento

---

## 🛠️ Detecção Automática de Equipamentos

O sistema identifica o tipo de equipamento pelo **código** e ajusta automaticamente o formulário:

### Nomenclatura e Configurações

| Código | Tipo | Descrição | Geometrias | Medições | Extras |
|--------|------|-----------|------------|----------|--------|
| **RHxx-H15** | Horizontal 15m | Retrorrefletômetro Horizontal 15m | 15m/1,5° | 10 | - |
| **RHxx-H30** ou **RHxx-HM** | Horizontal 30m | Mini Retrorrefletômetro 30m | 30m/1,0° | 10 | ☂️ Simulador de Chuva |
| **RVxx-V1** | Vertical Único | Retrorrefletômetro Vertical Ângulo Único | 0,2°/-4° | 5 | - |
| **RVxx-VM** | Vertical Multi | Retrorrefletômetro Vertical Multi-Ângulo | 0,2°/-4°, 0,5°/-4°, 1,0°/-4° | 5 | - |
| **RTxx** | Tachas/Tachões | Retrorrefletômetro para Tachas e Tachões | 0,2°/0°, 0,2°/20° | 2 | - |

### Exemplos de Códigos Válidos
- `RH01-H15` → Horizontal 15m
- `RH02-H30` → Horizontal 30m (mini com chuva)
- `RH03-HM` → Horizontal Mini (com chuva)
- `RV01-V1` → Vertical ângulo único
- `RV02-VM` → Vertical multi-ângulo
- `RT01` → Tachas e tachões

---

## 📊 Adaptação Automática do Formulário

### 1️⃣ **Ao Selecionar o Equipamento**

O sistema automaticamente:

✅ **Identifica o tipo** pelo código  
✅ **Mostra alerta informativo** com:
   - Ícone do tipo de equipamento
   - Descrição completa
   - Geometrias disponíveis
   - Quantidade de medições recomendadas
   - Indicador de simulador de chuva (se houver)

✅ **Ajusta a quantidade de medições**:
   - Horizontal: cria 10 campos
   - Vertical: cria 5 campos
   - Tachas: cria 2 campos

✅ **Define geometria padrão**:
   - Seleciona a primeira geometria disponível automaticamente

✅ **Preenche técnico responsável**:
   - Nome do usuário logado (somente leitura para operadores)

✅ **Filtra opções de geometria**:
   - Dropdown mostra apenas geometrias válidas para aquele equipamento

---

### 2️⃣ **Campos Condicionais**

#### 📄 **Tipo de Película** (apenas Vertical)
Exibido apenas para equipamentos RVxx:
- Tipo I, II, III, IV, V, VII, VIII

#### 🎨 **Tipo de Material** (apenas Horizontal)
Exibido apenas para equipamentos RHxx:
- Tinta Convencional
- Termoplástico
- Tinta à Base d'Água
- Tinta à Base Solvente
- Plástico Pré-Fabricado Tipo I
- Plástico Pré-Fabricado Tipo II

#### ☂️ **Condições de Medição** (Simulador de Chuva)
Exibido apenas para equipamentos com código **H30** ou **HM**:
- Seco
- Simulador de Chuva

---

## 🔄 Fluxo de Trabalho do Operador

### 1. Login
```
Operador acessa com suas credenciais
↓
Sistema carrega apenas equipamentos vinculados ativos
```

### 2. Visualização
```
Menu mostra:
- Dashboard (estatísticas pessoais)
- Meus Equipamentos (vinculados)
- Minhas Medições
```

### 3. Nova Medição
```
Clica em "Nova Medição"
↓
Se tiver apenas 1 equipamento → selecionado automaticamente
Se tiver múltiplos → escolhe da lista
↓
Formulário se adapta ao tipo do equipamento
↓
Preenche dados e valores medidos
↓
Clica em "Calcular Validação"
↓
Sistema valida conforme normas ABNT
↓
Salva e gera laudo em PDF
```

---

## 🔧 Arquitetura Técnica

### Service: `equipamentoService.js`

#### Funções Principais

```javascript
detectarTipoEquipamento(codigo)
// Analisa o código e retorna:
// {
//   tipo: 'horizontal' | 'vertical' | 'tachas',
//   subtipo: '15m' | '30m' | 'angulo-unico' | 'multi-angulo' | 'tachas-tachoes',
//   geometrias: ['15m/1,5°', ...],
//   descricao: 'Retrorrefletômetro Horizontal 15m',
//   quantidadeMedicoes: 10,
//   simuladorChuva: true/false,
//   icon: 'mdi-road'
// }

buscarEquipamentosDoUsuario(usuarioId, perfil)
// Admin: retorna todos os equipamentos
// Operador: retorna apenas vinculados ativos
// Enriquece com tipoDetalhado

validarAcessoEquipamento(usuarioId, equipamentoId, perfil)
// Verifica se operador tem acesso ao equipamento
```

---

### Store: `auth.js`

Novos getters:
```javascript
isOperador  // true se perfil === 'operador'
perfilUsuario  // retorna 'admin' | 'tecnico' | 'operador'
```

Novas permissões:
```javascript
'ver_equipamentos_vinculados'
'criar_medicoes'
'ver_medicoes'
```

---

### View: `CalibracoesLista.vue`

Computeds dinâmicos:
```javascript
geometriasDisponiveis  // Filtradas pelo equipamento
tipoMedicao  // 'vertical' | 'horizontal' | 'tachas'
mostrarCamposPelicula  // true se vertical
mostrarCamposMaterial  // true se horizontal
mostrarSimuladorChuva  // true se H30/HM
```

Watcher:
```javascript
onEquipamentoChange(equipamentoId)
// Detecta tipo
// Ajusta quantidade de medições
// Define geometria padrão
// Preenche técnico
```

---

## 🎯 Exemplos de Uso

### Exemplo 1: Operador com RH01-H15

1. **Login** → sistema detecta 1 equipamento vinculado
2. **Nova Medição** → RH01-H15 já selecionado
3. **Alerta mostra**:
   ```
   🛣️ Retrorrefletômetro Horizontal 15m
   Geometria: 15m/1,5°
   Medições recomendadas: 10
   ```
4. **Formulário**:
   - ✅ Tipo de Material (dropdown)
   - ✅ Cor
   - ✅ Geometria: apenas "15m/1,5°"
   - ✅ 10 campos de medição
   - ❌ Tipo de Película (oculto)
   - ❌ Simulador de Chuva (oculto)

### Exemplo 2: Operador com RV02-VM

1. **Login** → equipamento RV02-VM
2. **Nova Medição**
3. **Alerta mostra**:
   ```
   🚏 Retrorrefletômetro Vertical Multi-Ângulo
   Geometrias: 0,2°/-4°, 0,5°/-4°, 1,0°/-4°
   Medições recomendadas: 5
   ```
4. **Formulário**:
   - ✅ Tipo de Película (dropdown)
   - ✅ Cor
   - ✅ Geometria: 3 opções
   - ✅ 5 campos de medição
   - ❌ Tipo de Material (oculto)
   - ❌ Simulador de Chuva (oculto)

### Exemplo 3: Operador com RH03-HM (Mini + Chuva)

1. **Login** → equipamento RH03-HM
2. **Nova Medição**
3. **Alerta mostra**:
   ```
   🛣️ Retrorrefletômetro Horizontal 30m (Mini)
   Geometria: 30m/1,0°
   Medições recomendadas: 10
   ☂️ Simulador de Chuva
   ```
4. **Formulário**:
   - ✅ Tipo de Material
   - ✅ Cor
   - ✅ Geometria: apenas "30m/1,0°"
   - ✅ 10 campos de medição
   - ✅ **Condições de Medição** (Seco/Simulador de Chuva)
   - ❌ Tipo de Película (oculto)

---

## ✅ Checklist de Implementação

### Concluído ✅

- [x] Service de detecção de tipo por código
- [x] Busca de equipamentos por perfil
- [x] Validação de acesso
- [x] Store com getter isOperador
- [x] Menu adaptado por perfil
- [x] Formulário com campos condicionais
- [x] Alertas informativos
- [x] Geometrias dinâmicas
- [x] Quantidade de medições dinâmica
- [x] Técnico responsável automático
- [x] Seleção única para 1 equipamento
- [x] Indicador de simulador de chuva

---

## 🔄 Próximas Melhorias

### Sugeridas para Futuro

1. **Dashboard personalizado** por operador
   - Estatísticas apenas dos seus equipamentos
   - Gráficos de performance individual
   - Histórico de medições

2. **Notificações push** quando:
   - Novo equipamento vinculado
   - Medição vencida
   - Equipamento com problema

3. **App mobile** para operadores
   - Medições offline
   - Sincronização automática
   - Captura de fotos direto do celular

4. **QR Code** nos equipamentos
   - Scan para iniciar medição
   - Acesso rápido ao histórico

5. **Modo offline**
   - Salvar medições localmente
   - Sincronizar quando conectar

---

## 📱 Interface Mobile-Friendly

O sistema já está preparado para dispositivos móveis:

- ✅ Layout responsivo (Vuetify)
- ✅ Campos otimizados para touch
- ✅ Alertas visuais claros
- ✅ Navegação simplificada
- ✅ Formulários adaptativos

---

## 🐛 Tratamento de Erros

### Cenários Cobertos

1. **Equipamento sem código válido**
   - Usa configuração genérica
   - Exibe aviso ao usuário

2. **Operador sem vínculos**
   - Lista vazia
   - Mensagem: "Nenhum equipamento vinculado. Contate o administrador."

3. **Vínculo expirado**
   - Não aparece na lista
   - Sistema filtra apenas ativos

4. **Acesso não autorizado**
   - Redirect para login
   - Mensagem de erro

---

## 📊 Banco de Dados

### Tabela: `vinculos`

```sql
CREATE TABLE vinculos (
  id UUID PRIMARY KEY,
  equipamento_id UUID REFERENCES equipamentos(id),
  usuario_id UUID REFERENCES usuarios(id),
  data_inicio TIMESTAMP,
  data_fim TIMESTAMP,  -- NULL = vínculo ativo
  termo_pdf_url TEXT,
  assinatura_digital TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Lógica de Vínculo Ativo

```sql
WHERE usuario_id = $1
  AND ativo = true
  AND data_fim IS NULL
```

---

## 🎓 Treinamento de Operadores

### Passo a Passo

1. **Login**
   - Usuário: email fornecido
   - Senha: definida pelo admin

2. **Verificar Equipamento**
   - Menu "Meus Equipamentos"
   - Confirmar código correto

3. **Criar Medição**
   - Clicar "Nova Medição"
   - Verificar informações do equipamento
   - Preencher todos os campos obrigatórios (*)
   - Inserir valores medidos (com 2 casas decimais)
   - Clicar "Calcular Validação"
   - Verificar resultado (Aprovado/Reprovado)
   - Salvar

4. **Gerar Laudo**
   - Na lista, clicar no ícone PDF
   - Baixar documento

---

## 📞 Suporte

Para dúvidas sobre o sistema:

- **Email**: suporte@icdvias.com.br
- **Telefone**: (48) 2106-3022
- **Documentação**: https://docs.medlux.com.br

---

## 📄 Licença e Propriedade

© 2024-2026 I.C.D. Indústria, Comércio e Distribuição de Materiais para Infraestrutura Viária Ltda.  
CNPJ 10.954.989/0001-26  
Todos os direitos reservados.

**MEDLUX Reflective** é uma marca registrada do Grupo SMI.

---

*Última atualização: 2026-02-15*
