// Script para importar equipamentos do backup para o Supabase
// Execute com: node scripts/importar-backup.js

import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Configuração do Supabase
const supabaseUrl = "https://earrnuuvdzawclxsyoxk.supabase.co";
const supabaseKey = "sb_publishable_rzwQgvBWTXDKRunAIWQDkA_9_lOtHSl";

const supabase = createClient(supabaseUrl, supabaseKey);

// Ler arquivo de backup
const backupPath =
  "/home/user/uploaded_files/medlux-backup-2026-02-13 (1).json.txt";
const backupData = JSON.parse(fs.readFileSync(backupPath, "utf8"));

console.log("📦 Backup carregado:", backupData.export_version);
console.log("📊 Total de equipamentos:", backupData.data.equipamentos.length);

// Função para converter dados do backup para o formato do Supabase
function converterEquipamento(equipamento) {
  // Função auxiliar para converter data (retorna null se vazia ou inválida)
  const converterData = (data) => {
    if (!data || data === "" || data === "null") return null;
    return data;
  };

  return {
    codigo: equipamento.id || equipamento.uuid,
    nome: equipamento.modelo || "Equipamento",
    tipo: equipamento.funcao || equipamento.geometria || "Horizontal",
    status: equipamento.status || equipamento.statusOperacional || "ativo",
    fabricante: equipamento.fabricante || "MEDLUX-R",
    modelo: equipamento.modelo,
    numero_serie: equipamento.numeroSerie,
    localizacao: equipamento.localidadeCidadeUF || equipamento.localidade,
    data_aquisicao: converterData(equipamento.dataAquisicao),
    data_ultima_calibracao: converterData(equipamento.dataCalibracao),
    proxima_calibracao: null, // Calcular depois
    certificado_calibracao:
      equipamento.certificadoNumero || equipamento.numeroCertificado,
    observacoes: equipamento.observacoes || "",
    geometria: equipamento.geometria,
    funcao: equipamento.funcao,
    status_operacional:
      equipamento.statusOperacional || equipamento.statusLocal,
    localidade_cidade_uf: equipamento.localidadeCidadeUF,
    data_entrega_usuario: converterData(equipamento.dataEntregaUsuario),
  };
}

// Importar equipamentos
async function importarEquipamentos() {
  console.log("\n🚀 Iniciando importação...\n");

  let sucesso = 0;
  let erros = 0;

  for (const equip of backupData.data.equipamentos) {
    try {
      const equipamentoConvertido = converterEquipamento(equip);

      const { data, error } = await supabase
        .from("equipamentos")
        .insert([equipamentoConvertido])
        .select();

      if (error) {
        console.error(`❌ Erro ao importar ${equip.id}:`, error.message);
        erros++;
      } else {
        console.log(`✅ Importado: ${data[0].codigo} - ${data[0].nome}`);
        sucesso++;
      }
    } catch (err) {
      console.error(`❌ Erro ao processar ${equip.id}:`, err.message);
      erros++;
    }
  }

  console.log("\n📊 Resumo da Importação:");
  console.log(`✅ Sucesso: ${sucesso}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📦 Total: ${backupData.data.equipamentos.length}`);
}

// Executar importação
importarEquipamentos()
  .then(() => {
    console.log("\n🎉 Importação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal:", error);
    process.exit(1);
  });
