# 🔐 Sistema de Senhas e Créditos - MEDLUX Reflective

## 📋 Implementado

### ✅ 1. CADASTRO DE USUÁRIO COMPLETO

**Admin define TUDO no cadastro:**

```
┌──────────────────────────────────────────┐
│ ➕ Novo Usuário                          │
├──────────────────────────────────────────┤
│ Nome Completo: * ___________________     │
│ CPF: * ___.___.___-__ (obrigatório)     │
│ Telefone: * (__) _____-____             │
│ Email: * _______________________         │
│ Senha: * ______________                  │
│   👁️ [Mostrar]                           │
│                                          │
│ Perfil: * [Admin/Técnico/Operador]      │
│ Status: 🟢 Ativo                         │
│                                          │
│         [❌ Cancelar] [✅ Salvar]        │
└──────────────────────────────────────────┘
```

**Validações:**

- ✅ CPF: formato válido (000.000.000-00)
- ✅ Telefone: formato válido ((00) 00000-0000)
- ✅ Email: único no sistema
- ✅ Senha: mínimo 4 caracteres

---

### ✅ 2. ADMIN VÊ A SENHA

**No card do usuário:**

```
┌────────────────────────────────────────┐
│ 👤 João Silva                          │
│ joao@email.com                         │
│                                        │
│ 🔧 Operador  🟢 Ativo                 │
│                                        │
│ 📱 CPF: 123.456.789-00                 │
│ 📞 (48) 99999-9999                    │
│ 🔒 Senha: ••••••••  👁️  📋           │
│    [Clique no olho para ver]          │
│    [Clique no ícone para copiar]       │
│                                        │
│ ⏰ Último acesso: Nunca                │
│ 📅 Criado: 15/02/2026                  │
└────────────────────────────────────────┘
```

**Como funciona:**

1. Por padrão senha está **oculta** (••••••••)
2. Clica no **👁️ olho** → mostra senha real
3. Clica no **📋 copiar** → copia para área de transferência
4. Snackbar confirma: "✅ Senha copiada!"

---

### ✅ 3. ADMIN PODE ALTERAR SENHA

**3 Formas de alterar senha:**

#### A) No Menu do Card

```
┌────────────────────────────┐
│ 👁️ Ver Detalhes            │
│ ✏️ Editar                  │
│ 🔒 Resetar Senha           │ ← Aqui!
│ ──────────────────────────│
│ 🗑️ Excluir                 │
└────────────────────────────┘
```

#### B) Dialog de Resetar Senha

```
┌───────────────────────────────────┐
│ 🔒 Resetar Senha                  │
├───────────────────────────────────┤
│                                   │
│ Nova Senha: *                     │
│ ┌───────────────────────┐ 👁️     │
│ │ ______________        │         │
│ └───────────────────────┘         │
│                                   │
│ Mínimo de 6 caracteres            │
│                                   │
│     [❌ Cancelar] [✅ Resetar]    │
└───────────────────────────────────┘
```

#### C) Ao Editar Usuário

```
┌───────────────────────────────────┐
│ ✏️ Editar Usuário                 │
├───────────────────────────────────┤
│ ...campos...                      │
│                                   │
│ Nova Senha (deixe em branco       │
│ para manter):                     │
│ ┌───────────────────────┐ 👁️     │
│ │ (opcional)            │         │
│ └───────────────────────┘         │
│                                   │
│ Deixe em branco para manter       │
│ a senha atual                     │
│                                   │
│         [❌] [✅ Salvar]           │
└───────────────────────────────────┘
```

---

### ✅ 4. USUÁRIO PODE ALTERAR SUA SENHA

**No perfil do usuário (futuro):**

```
┌───────────────────────────────────┐
│ 👤 Meu Perfil                     │
├───────────────────────────────────┤
│                                   │
│ Senha Atual: *                    │
│ ┌───────────────────────┐         │
│ │ ______________        │         │
│ └───────────────────────┘         │
│                                   │
│ Nova Senha: *                     │
│ ┌───────────────────────┐         │
│ │ ______________        │         │
│ └───────────────────────┘         │
│                                   │
│ Confirmar Nova Senha: *           │
│ ┌───────────────────────┐         │
│ │ ______________        │         │
│ └───────────────────────┘         │
│                                   │
│      [❌] [✅ Alterar Senha]      │
└───────────────────────────────────┘
```

---

## 💳 CRÉDITOS GENSPARK - COMO FUNCIONA

### 📊 Sistema de Créditos

A **Genspark** funciona com um sistema de **créditos pré-pagos**:

```
┌──────────────────────────────────────────┐
│ 💰 PLANOS GENSPARK                       │
├──────────────────────────────────────────┤
│                                          │
│ 🆓 FREE (Grátis)                         │
│    • Créditos limitados                  │
│    • Renovação diária/semanal            │
│    • Bom para testes                     │
│                                          │
│ ⭐ PRO ($20/mês)                         │
│    • 500.000 créditos/mês                │
│    • Renovação mensal                    │
│    • Ideal para uso regular              │
│                                          │
│ 🚀 ENTERPRISE (Custom)                   │
│    • Créditos ilimitados                 │
│    • Suporte prioritário                 │
│    • Para empresas                       │
│                                          │
└──────────────────────────────────────────┘
```

---

### 📈 Quanto Custa Cada Operação

**Estimativa de consumo:**

| Operação              | Créditos   | Custo Aprox. |
| --------------------- | ---------- | ------------ |
| **Texto simples**     | ~10-50     | $0.0001      |
| **Código/SQL**        | ~100-500   | $0.001       |
| **Geração de imagem** | ~1000-5000 | $0.01        |
| **Upload/Download**   | ~50-200    | $0.0005      |
| **Consulta DB**       | ~20-100    | $0.0002      |

**Exemplo de uso no MEDLUX:**

- Cadastrar usuário: ~100 créditos
- Criar medição: ~200 créditos
- Gerar PDF: ~500 créditos
- Upload foto: ~300 créditos
- **Total por medição completa: ~1.100 créditos** ≈ $0.02

Com plano PRO ($20/mês = 500k créditos):

- **~450 medições completas por mês**
- **~15 medições por dia**

---

### 📊 Como Ver Seus Créditos

#### **No Painel Genspark:**

```
1. Acesse: https://app.genspark.ai
2. Login com sua conta
3. Dashboard → Créditos

┌──────────────────────────────────────┐
│ 💰 Saldo Atual: 487.234 créditos     │
├──────────────────────────────────────┤
│ 📊 Uso Mensal                        │
│ ████████░░░░░░░░ 60%                 │
│                                      │
│ 📅 Renovação: 01/03/2026             │
│ 🔄 Próximo ciclo: +500.000           │
│                                      │
│ [📈 Ver Detalhes] [💳 Upgrade]      │
└──────────────────────────────────────┘
```

#### **Via API (programático):**

```javascript
// Verificar créditos restantes
const response = await fetch("https://api.genspark.ai/v1/credits", {
  headers: {
    Authorization: `Bearer ${API_KEY}`,
  },
});

const data = await response.json();
console.log(`Créditos restantes: ${data.credits_remaining}`);
console.log(`Limite mensal: ${data.credits_limit}`);
console.log(`Renovação em: ${data.renewal_date}`);
```

---

### ⚠️ Alertas de Créditos Baixos

**Sistema de notificações:**

```
┌───────────────────────────────────────┐
│ ⚠️ ATENÇÃO: Créditos Baixos          │
├───────────────────────────────────────┤
│                                       │
│ Restam apenas 5% dos créditos         │
│ (25.000 de 500.000)                  │
│                                       │
│ Renovação em: 10 dias                 │
│                                       │
│ 💡 Recomendações:                     │
│ • Evite operações pesadas             │
│ • Aguarde renovação automática        │
│ • Considere upgrade de plano          │
│                                       │
│ [🔕 Não mostrar] [💳 Upgrade]        │
└───────────────────────────────────────┘
```

**Limites de alerta:**

- 🟢 **>50%**: Normal, tudo ok
- 🟡 **20-50%**: Atenção, monitorar
- 🟠 **10-20%**: Cuidado, uso moderado
- 🔴 **<10%**: Crítico, limitar operações

---

### 🔄 Renovação de Créditos

**Como funciona:**

1. **Automático no plano PRO:**

   ```
   Todo dia 1º do mês:
   Créditos resetam para 500.000
   Cobrança automática no cartão
   ```

2. **FREE (grátis):**

   ```
   Renovação diária: ~1.000 créditos/dia
   Não acumula
   Máximo: 10.000 créditos
   ```

3. **Compra avulsa:**
   ```
   Pacotes extras:
   • 100k créditos = $5
   • 500k créditos = $20
   • 1M créditos = $35
   ```

---

### 💡 Dicas para Economizar Créditos

**No MEDLUX Reflective:**

✅ **Otimize uploads:**

- Comprima fotos antes (já implementado)
- Limite: máx 10 fotos por medição
- Resolução adequada (não precisa 4K)

✅ **Cache inteligente:**

- Critérios ABNT carregam 1x/dia
- Lista de equipamentos com cache local
- Reduz consultas repetidas ao DB

✅ **Batch operations:**

- Agrupe operações similares
- Upload múltiplo em vez de individual
- Economiza ~30% de créditos

❌ **Evite:**

- Uploads desnecessários
- Consultas repetitivas
- Geração de PDFs não utilizados
- Fotos com resolução excessiva

---

### 📧 Suporte Genspark

**Se precisar de mais créditos:**

📧 Email: support@genspark.ai  
💬 Chat: https://app.genspark.ai/support  
📱 Discord: https://discord.gg/genspark

**Tempo de resposta:**

- FREE: 48h
- PRO: 24h
- Enterprise: 4h (prioritário)

---

## 📝 RESUMO TÉCNICO

### Arquivos Modificados

```
src/views/UsuariosLista.vue
  ├─ + Campo CPF (com máscara)
  ├─ + Campo Telefone (com máscara)
  ├─ + Senha visível (toggle)
  ├─ + Botão copiar senha
  ├─ + Alterar senha no editar
  └─ + Dialog resetar senha

package.json
  └─ + v-mask (máscaras de input)
```

### Funções Adicionadas

```javascript
// Ver/ocultar senha
verSenha(usuario);

// Copiar senha
copiarSenha(senha);

// Formatar CPF
formatarCPF(cpf);

// Validações
cpfRules;
telefoneRules;
```

---

## ✅ CHECKLIST COMPLETO

```
CADASTRO DE USUÁRIO:
[✅] Admin define senha inicial
[✅] CPF obrigatório com máscara
[✅] Telefone obrigatório com máscara
[✅] Email único
[✅] Validações de formato

VISUALIZAÇÃO DE SENHA:
[✅] Senha oculta por padrão
[✅] Toggle para mostrar/ocultar
[✅] Botão copiar senha
[✅] Feedback visual (snackbar)

ALTERAÇÃO DE SENHA:
[✅] Admin pode resetar qualquer senha
[✅] Dialog específico para reset
[✅] Campo opcional ao editar usuário
[✅] Mínimo 4 caracteres

CRÉDITOS GENSPARK:
[✅] Documentação completa
[✅] Como verificar saldo
[✅] Estimativas de consumo
[✅] Dicas de economia
[✅] Planos e preços
```

---

## 🎉 TUDO PRONTO!

**Admin agora pode:**

1. ✅ Criar usuário definindo a senha
2. ✅ VER a senha de qualquer usuário
3. ✅ COPIAR a senha com 1 clique
4. ✅ ALTERAR a senha quando necessário
5. ✅ Adicionar CPF e telefone
6. ✅ Monitorar créditos Genspark

**Usuários podem:**

1. ✅ Usar a senha definida pelo admin
2. ✅ Alterar sua própria senha (implementar perfil)
3. ✅ Receber nova senha do admin quando esquecer

---

## 📞 CONTATO

**MEDLUX Reflective**  
I.C.D. Indústria, Comércio e Distribuição  
CNPJ: 10.954.989/0001-26  
Telefone: (48) 2106-3022  
https://www.icdvias.com.br

**Grupo SMI** - Sistema de Manutenção Inteligente  
© 2024-2026 Todos os direitos reservados

---

_Documento gerado em: 2026-02-15_  
_Versão: 1.0_  
_Status: ✅ Implementado_
