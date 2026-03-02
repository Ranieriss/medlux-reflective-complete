// Script de diagnóstico - testar conexão Supabase e query de equipamentos
import supabase from "./src/services/supabase.js";

async function testarConexao() {
  console.log("🔍 DIAGNÓSTICO COMPLETO - MEDLUX Reflective");
  console.log("=".repeat(60));

  // 1. Testar conexão básica
  console.log("\n1️⃣ TESTANDO CONEXÃO COM SUPABASE...");
  try {
    const { error } = await supabase
      .from("equipamentos")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Erro de conexão:", error);
      return;
    }
    console.log("✅ Conexão OK");
  } catch (error) {
    console.error("❌ Erro fatal de conexão:", error);
    return;
  }

  // 2. Contar equipamentos
  console.log("\n2️⃣ CONTANDO EQUIPAMENTOS...");
  try {
    const { count, error } = await supabase
      .from("equipamentos")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("❌ Erro ao contar:", error);
      return;
    }

    console.log(`📊 Total de equipamentos: ${count}`);

    if (count === 0) {
      console.error("❌ PROBLEMA: Tabela equipamentos está VAZIA!");
      console.log("   Execute o SQL de inserção dos 22 equipamentos.");
      return;
    }
  } catch (error) {
    console.error("❌ Erro ao contar equipamentos:", error);
    return;
  }

  // 3. Buscar todos os equipamentos (como admin)
  console.log("\n3️⃣ BUSCANDO TODOS OS EQUIPAMENTOS (ADMIN)...");
  try {
    const { data, error } = await supabase
      .from("equipamentos")
      .select("*")
      .order("codigo", { ascending: true });

    if (error) {
      console.error("❌ Erro na query:", error);
      return;
    }

    console.log(`✅ ${data.length} equipamentos encontrados:`);

    // Agrupar por tipo
    const porTipo = data.reduce((acc, eq) => {
      acc[eq.tipo] = (acc[eq.tipo] || 0) + 1;
      return acc;
    }, {});

    console.log("📊 Distribuição por tipo:");
    Object.entries(porTipo).forEach(([tipo, count]) => {
      console.log(`   - ${tipo}: ${count}`);
    });

    // Mostrar primeiros 5
    console.log("\n📋 Primeiros 5 equipamentos:");
    data.slice(0, 5).forEach((eq) => {
      console.log(`   ${eq.codigo} - ${eq.nome} (${eq.tipo})`);
    });
  } catch (error) {
    console.error("❌ Erro ao buscar equipamentos:", error);
    return;
  }

  // 4. Testar query específica de admin (como no componente)
  console.log("\n4️⃣ TESTANDO QUERY EXATA DO COMPONENTE...");
  try {
    const { data, error } = await supabase
      .from("equipamentos")
      .select("*")
      .order("codigo", { ascending: true });

    if (error) throw error;

    console.log(`✅ Query retornou: ${data?.length || 0} equipamentos`);

    if (data && data.length > 0) {
      console.log("✅ TUDO FUNCIONANDO! Os equipamentos estão no banco.");
      console.log("\n⚠️ SE O APP AINDA MOSTRA ERRO, O PROBLEMA É:");
      console.log("   1. Cache do navegador (Ctrl+F5)");
      console.log("   2. Deploy do Vercel não sincronizado");
      console.log("   3. Variáveis de ambiente (.env) incorretas");
    } else {
      console.log("❌ Query retornou vazia mesmo com dados no banco!");
      console.log(
        "   Possível problema de RLS (Row Level Security) no Supabase",
      );
    }
  } catch (error) {
    console.error("❌ Erro na query do componente:", error);
  }

  // 5. Verificar estrutura da tabela
  console.log("\n5️⃣ VERIFICANDO ESTRUTURA DA TABELA...");
  try {
    const { data, error } = await supabase
      .from("equipamentos")
      .select("*")
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      console.log("📋 Colunas disponíveis:");
      console.log(Object.keys(data[0]).join(", "));
    }
  } catch (error) {
    console.error("❌ Erro ao verificar estrutura:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ DIAGNÓSTICO COMPLETO!");
}

// Executar
testarConexao()
  .then(() => {
    console.log("\n✅ Script finalizado com sucesso");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });
