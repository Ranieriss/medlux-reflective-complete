// Script para importar equipamentos do backup JSON para o Supabase
// Execute: node scripts/importar-backup.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Configuração do Supabase
const supabaseUrl = "https://earrnuuvdzawclxsyoxk.supabase.co";
const supabaseKey = "<SUPABASE_ANON_KEY>";

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("🚀 Iniciando importação de equipamentos...\n");

// Ler arquivo de backup
const backupPath =
  "/home/user/uploaded_files/medlux-backup-2026-02-13 (1).json.txt";
const backupData = JSON.parse(readFileSync(backupPath, "utf8"));

console.log(`📦 Backup carregado: v${backupData.export_version}`);
console.log(
  `📊 Total de equipamentos no backup: ${backupData.data.equipamentos.length}\n`,
);

// Função para normalizar status
function normalizarStatus(status) {
  const statusMap = {
    OBRA: "ativo",
    ALMOXARIFADO: "ativo",
    MANUTENCAO: "manutencao",
    CALIBRACAO: "calibracao",
  };
  return statusMap[status?.toUpperCase()] || "ativo";
}

// Função para normalizar tipo
function normalizarTipo(funcao, geometria) {
  if (funcao?.includes("HORIZONTAL")) return "horizontal";
  if (funcao?.includes("VERTICAL")) return "vertical";
  if (funcao?.includes("TACHA")) return "tachas";
  if (geometria?.includes("15")) return "horizontal";
  if (geometria?.includes("30")) return "vertical";
  return "horizontal";
}

// Função para converter equipamento do backup para formato Supabase
function converterEquipamento(equip) {
  return {
    codigo: equip.id || equip.uuid || `EQ-${Date.now()}`,
    nome: `${equip.modelo || "Retrorrefletômetro"} ${equip.funcao || ""}`.trim(),
    tipo: normalizarTipo(equip.funcao, equip.geometria),
    status: normalizarStatus(
      equip.status || equip.statusOperacional || equip.statusLocal,
    ),
    fabricante: equip.fabricante || "MEDLUX-R",
    modelo: equip.modelo,
    numero_serie: equip.numeroSerie,
    localizacao:
      equip.localidadeCidadeUF || equip.localidade || "Não especificado",
    data_aquisicao: equip.dataAquisicao || null,
    data_ultima_calibracao: equip.dataCalibracao || null,
    proxima_calibracao: null, // Será calculado depois
    certificado_calibracao:
      equip.certificadoNumero || equip.numeroCertificado || null,
    observacoes: equip.observacoes || "",
    geometria: equip.geometria,
    funcao: equip.funcao,
    status_operacional:
      equip.statusOperacional || equip.statusLocal || equip.status,
    localidade_cidade_uf: equip.localidadeCidadeUF,
    data_entrega_usuario: equip.dataEntregaUsuario || null,
  };
}

// Importar equipamentos
async function importarEquipamentos() {
  let sucesso = 0;
  let erros = 0;
  const errosDetalhados = [];

  for (const equip of backupData.data.equipamentos) {
    try {
      const equipamentoConvertido = converterEquipamento(equip);

      // Tentar inserir
      const { data, error } = await supabase
        .from("equipamentos")
        .insert([equipamentoConvertido])
        .select()
        .single();

      if (error) {
        // Se já existe, tentar atualizar
        if (error.code === "23505") {
          // Código de duplicação
          const { data: updateData, error: updateError } = await supabase
            .from("equipamentos")
            .update(equipamentoConvertido)
            .eq("codigo", equipamentoConvertido.codigo)
            .select()
            .single();

          if (updateError) {
            console.error(
              `❌ Erro ao atualizar ${equip.id}:`,
              updateError.message,
            );
            errosDetalhados.push({ id: equip.id, erro: updateError.message });
            erros++;
          } else {
            console.log(
              `🔄 Atualizado: ${updateData.codigo} - ${updateData.nome}`,
            );
            sucesso++;
          }
        } else {
          console.error(`❌ Erro ao importar ${equip.id}:`, error.message);
          errosDetalhados.push({ id: equip.id, erro: error.message });
          erros++;
        }
      } else {
        console.log(`✅ Importado: ${data.codigo} - ${data.nome}`);
        sucesso++;
      }
    } catch (err) {
      console.error(`❌ Erro ao processar ${equip.id}:`, err.message);
      errosDetalhados.push({ id: equip.id, erro: err.message });
      erros++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO DA IMPORTAÇÃO");
  console.log("=".repeat(60));
  console.log(`✅ Sucesso: ${sucesso}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📦 Total processado: ${backupData.data.equipamentos.length}`);
  console.log("=".repeat(60));

  if (errosDetalhados.length > 0) {
    console.log("\n⚠️ Detalhes dos erros:");
    errosDetalhados.forEach(({ id, erro }) => {
      console.log(`  - ${id}: ${erro}`);
    });
  }
}

// Executar importação
importarEquipamentos()
  .then(() => {
    console.log("\n🎉 Importação concluída com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro fatal na importação:", error);
    process.exit(1);
  });
