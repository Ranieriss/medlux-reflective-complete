import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Configuração Supabase
const supabaseUrl = "https://peyupuoxgjzivqvadqgs.supabase.co";
const supabaseKey = "<SUPABASE_ANON_KEY>";

const supabase = createClient(supabaseUrl, supabaseKey);

async function restaurarEquipamentos() {
  console.log("🔄 Iniciando restauração de equipamentos...");

  try {
    // Ler backup
    const backup = JSON.parse(fs.readFileSync("./medlux-backup.json", "utf8"));

    // Backup pode ter estrutura { data: { equipamentos: [] } } ou { equipamentos: [] }
    const equipamentos = backup.data?.equipamentos || backup.equipamentos || [];

    if (equipamentos.length === 0) {
      console.error("❌ Nenhum equipamento encontrado no backup");
      return;
    }

    console.log(`📦 Encontrados ${equipamentos.length} equipamentos no backup`);

    // Verificar equipamentos existentes
    const { data: existentes, error: errorBusca } = await supabase
      .from("equipamentos")
      .select("codigo");

    if (errorBusca) {
      console.error("❌ Erro ao buscar equipamentos existentes:", errorBusca);
      return;
    }

    const codigosExistentes = new Set(existentes?.map((e) => e.codigo) || []);
    console.log(
      `📊 Equipamentos já existentes no banco: ${codigosExistentes.size}`,
    );

    // Filtrar equipamentos que não existem
    const novosEquipamentos = equipamentos.filter(
      (e) => !codigosExistentes.has(e.codigo),
    );

    if (novosEquipamentos.length === 0) {
      console.log("✅ Todos os equipamentos já estão no banco de dados");
      return;
    }

    console.log(
      `➕ Inserindo ${novosEquipamentos.length} novos equipamentos...`,
    );

    // Inserir em lotes de 10
    const batchSize = 10;
    let inseridos = 0;
    let erros = 0;

    for (let i = 0; i < novosEquipamentos.length; i += batchSize) {
      const lote = novosEquipamentos.slice(i, i + batchSize);

      const { error } = await supabase.from("equipamentos").insert(lote);

      if (error) {
        console.error(
          `❌ Erro ao inserir lote ${i / batchSize + 1}:`,
          error.message,
        );
        erros += lote.length;
      } else {
        inseridos += lote.length;
        console.log(
          `✅ Lote ${i / batchSize + 1} inserido (${inseridos}/${novosEquipamentos.length})`,
        );
      }
    }

    console.log("\n📊 Resumo da restauração:");
    console.log(`  ✅ Inseridos: ${inseridos}`);
    console.log(`  ❌ Erros: ${erros}`);
    console.log(`  📦 Total no backup: ${equipamentos.length}`);
    console.log(`  💾 Total no banco: ${codigosExistentes.size + inseridos}`);

    // Verificar total final
    const { count, error: errorCount } = await supabase
      .from("equipamentos")
      .select("*", { count: "exact", head: true });

    if (!errorCount) {
      console.log(
        `\n🎉 Verificação final: ${count} equipamentos no banco de dados`,
      );
    }
  } catch (error) {
    console.error("❌ Erro geral:", error.message);
  }
}

// Executar
restaurarEquipamentos()
  .then(() => {
    console.log("\n✅ Script finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  });
