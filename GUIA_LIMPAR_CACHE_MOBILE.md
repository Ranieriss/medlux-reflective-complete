# 📱 GUIA: Como Limpar Cache no Celular Android

**Data:** 15/02/2026 22:56  
**Problema:** Equipamentos existem no banco, mas app não mostra

---

## ✅ CONFIRMADO

A ferramenta de teste provou que:
- ✅ **22 equipamentos** estão no Supabase
- ✅ Conexão funciona perfeitamente
- ✅ Query retorna todos os dados

**Conclusão:** O problema é **CACHE DO NAVEGADOR**

---

## 🎯 SOLUÇÃO RÁPIDA (30 SEGUNDOS)

### **Método 1: Modo Anônimo (Mais Fácil)**

1. **Abrir Chrome** no celular
2. Tocar nos **3 pontos** (canto superior direito)
3. Selecionar **"Nova guia anônima"**
4. Digitar: `medlux-reflective-complete.vercel.app`
5. Fazer **login**
6. Testar **"Nova Medição"**

**Resultado esperado:** Dropdown mostra 22 equipamentos! ✅

---

### **Método 2: Limpar Cache Completo**

#### 📱 **Chrome Android:**

1. **Abrir Chrome**
2. Tocar nos **3 pontos** (⋮) → **Configurações**
3. **Privacidade e segurança**
4. **Limpar dados de navegação**
5. Selecionar período: **"Todo o período"**
6. Marcar:
   - ✅ **Cookies e dados do site**
   - ✅ **Imagens e arquivos em cache**
7. **NÃO marcar:** "Histórico de navegação" (opcional)
8. Tocar em **"Limpar dados"**
9. Aguardar conclusão
10. **Fechar Chrome completamente**
11. **Reabrir Chrome**
12. Acessar o app

---

### **Método 3: Limpar Site Específico**

#### 📱 **Chrome Android (mais rápido):**

1. Acessar: `medlux-reflective-complete.vercel.app`
2. Tocar no **cadeado** 🔒 (antes da URL)
3. Tocar em **"Permissões"**
4. Rolar até **"Limpar e redefinir"**
5. Tocar em **"Limpar dados do site"**
6. Confirmar
7. **Recarregar a página**

---

## 🚀 NOVO DEPLOY ACIONADO

**Acabei de forçar um novo deploy no Vercel!**

**O que vai acontecer:**
- Código mais recente será enviado
- Vercel vai recompilar tudo
- Cache do servidor será limpo

**Tempo estimado:** 2-3 minutos

---

## 📋 PASSO A PASSO COMPLETO

### **1️⃣ Aguardar Deploy (2-3 min)**
⏱️ Aguarde até 22:59 para garantir que o deploy terminou

### **2️⃣ Limpar Cache**
Escolher um dos métodos acima (recomendo Modo Anônimo)

### **3️⃣ Acessar o App**
URL: https://medlux-reflective-complete.vercel.app

### **4️⃣ Fazer Login**
- Email: ranieri.santos16@gmail.com
- Senha: sua senha

### **5️⃣ Testar Nova Medição**
- Menu lateral → **"Medições de Retrorrefletância"**
- Clicar no botão verde **"Nova Medição"**
- Abrir dropdown **"Equipamento"**

### **6️⃣ Verificar Resultado**
Deve aparecer **22 opções**:
- RH01 - MLX-H15 HORIZONTAL
- RH02 - MLX-H15-1J HORIZONTAL
- RH03 - MLX-H15-1J-T HORIZONTAL
- ...
- RV08 - MLX-V3 VERTICAL 3 ÂNGULOS
- RT01 - DISPOSITIVO TACHAS/TACHÕES
- RT02 - DISPOSITIVO TACHAS/TACHÕES
- RT03 - DISPOSITIVO TACHAS/TACHÕES
- RT04 - DISPOSITIVO TACHAS/TACHÕES

---

## 🔍 CONSOLE DO NAVEGADOR (Debug)

Se quiser ver o que está acontecendo:

**Desktop:**
1. Abrir o app
2. Pressionar **F12**
3. Ir na aba **Console**
4. Clicar em "Nova Medição"
5. Procurar por:
```
✅ Sessão restaurada: ranieri.santos16@gmail.com
📦 Equipamentos encontrados: 22
✅ 22 equipamentos carregados para administrador
```

**Mobile (Chrome):**
1. No computador, abrir Chrome
2. Ir em `chrome://inspect`
3. Conectar celular via USB
4. Selecionar o app
5. Ver console

---

## ⚠️ SE AINDA NÃO FUNCIONAR

**Significa que o problema é outro. Neste caso:**

1. **Tirar screenshot** do dropdown vazio
2. **Abrir console** (F12) e tirar screenshot
3. **Me enviar** as imagens
4. Vou identificar o problema real

---

## 🎯 CHECKLIST FINAL

- [ ] Aguardar 2-3 min (deploy Vercel)
- [ ] Limpar cache OU usar modo anônimo
- [ ] Recarregar app completamente
- [ ] Fazer login
- [ ] Ir em "Medições"
- [ ] Clicar "Nova Medição"
- [ ] Verificar dropdown "Equipamento"
- [ ] Confirmar se aparece 22 opções

---

## 📊 RESUMO

| Item | Status |
|------|--------|
| **Equipamentos no banco** | ✅ 22 confirmados |
| **Query Supabase** | ✅ Funciona 100% |
| **Teste de diagnóstico** | ✅ Passou |
| **Deploy Vercel** | 🟡 Em andamento (2-3 min) |
| **Cache limpo** | ❓ Aguardando você fazer |
| **Dropdown funciona** | ❓ Aguardando teste |

---

## 💡 DICA IMPORTANTE

**Use modo anônimo primeiro!** É a forma mais rápida de confirmar que o problema é só cache.

Se funcionar no modo anônimo, confirma que é cache. Aí você limpa o cache normal e pronto!

---

**Aguarde 2-3 minutos e teste!** Estou 99% confiante que agora vai funcionar! 🚀
