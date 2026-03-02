<template>
  <div>
    <!-- Header -->
    <h1 class="text-h4 font-weight-bold mb-6">
      <v-icon
        class="mr-2"
        color="primary"
      >
        mdi-file-chart
      </v-icon>
      Relatórios
    </h1>

    <!-- Cards de Relatórios -->
    <v-row>
      <!-- Relatório de Equipamentos -->
      <v-col
        cols="12"
        md="6"
      >
        <v-card
          class="glass report-card"
          hover
        >
          <v-card-text>
            <div class="d-flex align-center mb-4">
              <v-icon
                size="48"
                color="primary"
                class="mr-4"
              >
                mdi-devices
              </v-icon>
              <div>
                <div class="text-h5 font-weight-bold">
                  Relatório de Equipamentos
                </div>
                <div class="text-caption text-secondary">
                  Listagem completa de todos os equipamentos
                </div>
              </div>
            </div>

            <v-divider class="mb-4" />

            <v-form>
              <v-row dense>
                <v-col cols="12">
                  <v-select
                    v-model="filtrosEquipamentos.tipo"
                    label="Tipo"
                    :items="tiposEquipamento"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="filtrosEquipamentos.status"
                    label="Status"
                    :items="statusEquipamento"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
              </v-row>
            </v-form>

            <v-btn
              color="primary"
              block
              prepend-icon="mdi-file-pdf-box"
              :loading="gerandoEquipamentos"
              class="mb-2"
              @click="gerarRelatorioEquipamentos('pdf')"
            >
              Gerar PDF
            </v-btn>
            <v-btn
              color="success"
              block
              prepend-icon="mdi-file-excel"
              :loading="gerandoEquipamentos"
              @click="gerarRelatorioEquipamentos('excel')"
            >
              Exportar para Excel
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Relatório de Vínculos -->
      <v-col
        cols="12"
        md="6"
      >
        <v-card
          class="glass report-card"
          hover
        >
          <v-card-text>
            <div class="d-flex align-center mb-4">
              <v-icon
                size="48"
                color="secondary"
                class="mr-4"
              >
                mdi-link-variant
              </v-icon>
              <div>
                <div class="text-h5 font-weight-bold">
                  Relatório de Vínculos
                </div>
                <div class="text-caption text-secondary">
                  Histórico de vínculos e custódias
                </div>
              </div>
            </div>

            <v-divider class="mb-4" />

            <v-form>
              <v-row dense>
                <v-col cols="12">
                  <v-text-field
                    v-model="filtrosVinculos.dataInicio"
                    label="Data Início"
                    type="date"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="filtrosVinculos.dataFim"
                    label="Data Fim"
                    type="date"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="filtrosVinculos.status"
                    label="Status"
                    :items="[
                      { title: 'Ativo', value: true },
                      { title: 'Finalizado', value: false },
                    ]"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
              </v-row>
            </v-form>

            <v-btn
              color="primary"
              block
              prepend-icon="mdi-file-pdf-box"
              :loading="gerandoVinculos"
              class="mb-2"
              @click="gerarRelatorioVinculos('pdf')"
            >
              Gerar PDF
            </v-btn>
            <v-btn
              color="success"
              block
              prepend-icon="mdi-file-excel"
              :loading="gerandoVinculos"
              @click="gerarRelatorioVinculos('excel')"
            >
              Exportar para Excel
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Relatório de Calibração -->
      <v-col
        cols="12"
        md="6"
      >
        <v-card
          class="glass report-card"
          hover
        >
          <v-card-text>
            <div class="d-flex align-center mb-4">
              <v-icon
                size="48"
                color="warning"
                class="mr-4"
              >
                mdi-clipboard-check
              </v-icon>
              <div>
                <div class="text-h5 font-weight-bold">
                  Relatório de Calibração
                </div>
                <div class="text-caption text-secondary">
                  Status e alertas de calibração
                </div>
              </div>
            </div>

            <v-divider class="mb-4" />

            <v-form>
              <v-row dense>
                <v-col cols="12">
                  <v-select
                    v-model="filtrosCalibracao.status"
                    label="Status"
                    :items="statusCalibracao"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="filtrosCalibracao.dataInicio"
                    label="Data Início"
                    type="date"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="filtrosCalibracao.dataFim"
                    label="Data Fim"
                    type="date"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
              </v-row>
            </v-form>

            <v-btn
              color="primary"
              block
              prepend-icon="mdi-file-pdf-box"
              :loading="gerandoCalibracao"
              class="mb-2"
              @click="gerarRelatorioCalibracao('pdf')"
            >
              Gerar PDF
            </v-btn>
            <v-btn
              color="success"
              block
              prepend-icon="mdi-file-excel"
              :loading="gerandoCalibracao"
              @click="gerarRelatorioCalibracao('excel')"
            >
              Exportar para Excel
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Relatório de Auditoria -->
      <v-col
        cols="12"
        md="6"
      >
        <v-card
          class="glass report-card"
          hover
        >
          <v-card-text>
            <div class="d-flex align-center mb-4">
              <v-icon
                size="48"
                color="info"
                class="mr-4"
              >
                mdi-history
              </v-icon>
              <div>
                <div class="text-h5 font-weight-bold">
                  Relatório de Auditoria
                </div>
                <div class="text-caption text-secondary">
                  Logs de ações do sistema
                </div>
              </div>
            </div>

            <v-divider class="mb-4" />

            <v-form>
              <v-row dense>
                <v-col cols="12">
                  <v-select
                    v-model="filtrosAuditoria.entidade"
                    label="Entidade"
                    :items="entidades"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="filtrosAuditoria.acao"
                    label="Ação"
                    :items="acoes"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="filtrosAuditoria.dataInicio"
                    label="Data Início"
                    type="date"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="filtrosAuditoria.dataFim"
                    label="Data Fim"
                    type="date"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
              </v-row>
            </v-form>

            <v-btn
              color="primary"
              block
              prepend-icon="mdi-file-pdf-box"
              :loading="gerandoAuditoria"
              class="mb-2"
              @click="gerarRelatorioAuditoria('pdf')"
            >
              Gerar PDF
            </v-btn>
            <v-btn
              color="success"
              block
              prepend-icon="mdi-file-excel"
              :loading="gerandoAuditoria"
              @click="gerarRelatorioAuditoria('excel')"
            >
              Exportar para Excel
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/services/supabase";

// State
const gerandoEquipamentos = ref(false);
const gerandoVinculos = ref(false);
const gerandoCalibracao = ref(false);
const gerandoAuditoria = ref(false);

// Filtros
const filtrosEquipamentos = ref({
  tipo: null,
  status: null,
});

const filtrosVinculos = ref({
  dataInicio: null,
  dataFim: null,
  status: null,
});

const filtrosCalibracao = ref({
  status: null,
  dataInicio: null,
  dataFim: null,
});

const filtrosAuditoria = ref({
  entidade: null,
  acao: null,
  dataInicio: null,
  dataFim: null,
});

// Options
const tiposEquipamento = ["Horizontal", "Vertical", "Tachas"];
const statusEquipamento = ["Ativo", "Manutenção", "Inativo"];
const statusCalibracao = ["Em dia", "Próximo ao vencimento", "Vencida"];
const entidades = [
  { title: "Equipamentos", value: "equipamentos" },
  { title: "Usuários", value: "usuarios" },
  { title: "Vínculos", value: "vinculos" },
];
const acoes = [
  { title: "Criação", value: "INSERT" },
  { title: "Atualização", value: "UPDATE" },
  { title: "Exclusão", value: "DELETE" },
];

// Snackbar
const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

// Methods
const gerarRelatorioEquipamentos = async (formato) => {
  try {
    gerandoEquipamentos.value = true;

    // Query base
    let query = supabase.from("equipamentos").select("*");

    // Aplicar filtros
    if (filtrosEquipamentos.value.tipo) {
      query = query.eq("tipo", filtrosEquipamentos.value.tipo.toLowerCase());
    }
    if (filtrosEquipamentos.value.status) {
      query = query.eq(
        "status",
        filtrosEquipamentos.value.status.toLowerCase(),
      );
    }

    const { data, error } = await query.order("codigo", { ascending: true });
    if (error) throw error;

    if (formato === "pdf") {
      gerarPDFEquipamentos(data);
    } else {
      exportarExcelEquipamentos(data);
    }

    mostrarSnackbar(
      `Relatório de equipamentos gerado com sucesso (${formato.toUpperCase()})!`,
      "success",
    );
  } catch (error) {
    console.error("❌ Erro ao gerar relatório:", error);
    mostrarSnackbar("Erro ao gerar relatório", "error");
  } finally {
    gerandoEquipamentos.value = false;
  }
};

const gerarRelatorioVinculos = async (formato) => {
  try {
    gerandoVinculos.value = true;

    let query = supabase.from("vinculos").select(`
        *,
        equipamento:equipamentos!vinculos_equipamento_id_fkey(codigo, nome),
        usuario:usuarios!vinculos_usuario_id_fkey(nome, email)
      `);

    if (filtrosVinculos.value.dataInicio) {
      query = query.gte("data_inicio", filtrosVinculos.value.dataInicio);
    }
    if (filtrosVinculos.value.dataFim) {
      query = query.lte("data_inicio", filtrosVinculos.value.dataFim);
    }
    if (filtrosVinculos.value.status !== null) {
      query = query.eq("ativo", filtrosVinculos.value.status);
    }

    const { data, error } = await query.order("data_inicio", {
      ascending: false,
    });
    if (error) throw error;

    if (formato === "pdf") {
      gerarPDFVinculos(data);
    } else {
      exportarExcelVinculos(data);
    }

    mostrarSnackbar(
      `Relatório de vínculos gerado com sucesso (${formato.toUpperCase()})!`,
      "success",
    );
  } catch (error) {
    console.error("❌ Erro ao gerar relatório:", error);
    mostrarSnackbar("Erro ao gerar relatório", "error");
  } finally {
    gerandoVinculos.value = false;
  }
};

const gerarRelatorioCalibracao = async (formato) => {
  try {
    gerandoCalibracao.value = true;

    let query = supabase
      .from("equipamentos")
      .select(
        "codigo, nome, tipo, data_ultima_calibracao, proxima_calibracao, certificado_calibracao",
      );

    if (filtrosCalibracao.value.dataInicio) {
      query = query.gte(
        "proxima_calibracao",
        filtrosCalibracao.value.dataInicio,
      );
    }
    if (filtrosCalibracao.value.dataFim) {
      query = query.lte("proxima_calibracao", filtrosCalibracao.value.dataFim);
    }

    const { data, error } = await query.order("codigo", { ascending: true });
    if (error) throw error;

    if (formato === "pdf") {
      gerarPDFCalibracao(data);
    } else {
      exportarExcelCalibracao(data);
    }

    mostrarSnackbar(
      `Relatório de calibração gerado com sucesso (${formato.toUpperCase()})!`,
      "success",
    );
  } catch (error) {
    console.error("❌ Erro ao gerar relatório:", error);
    mostrarSnackbar("Erro ao gerar relatório", "error");
  } finally {
    gerandoCalibracao.value = false;
  }
};

const gerarRelatorioAuditoria = async (formato) => {
  try {
    gerandoAuditoria.value = true;

    let query = supabase.from("auditoria").select(`
        *,
        usuario:usuarios!auditoria_usuario_id_fkey(nome, email)
      `);

    if (filtrosAuditoria.value.entidade) {
      query = query.eq("entidade", filtrosAuditoria.value.entidade);
    }
    if (filtrosAuditoria.value.acao) {
      query = query.eq("acao", filtrosAuditoria.value.acao);
    }
    if (filtrosAuditoria.value.dataInicio) {
      query = query.gte(
        "created_at",
        `${filtrosAuditoria.value.dataInicio}T00:00:00`,
      );
    }
    if (filtrosAuditoria.value.dataFim) {
      query = query.lte(
        "created_at",
        `${filtrosAuditoria.value.dataFim}T23:59:59`,
      );
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;

    if (formato === "pdf") {
      gerarPDFAuditoria(data);
    } else {
      exportarExcelAuditoria(data);
    }

    mostrarSnackbar(
      `Relatório de auditoria gerado com sucesso (${formato.toUpperCase()})!`,
      "success",
    );
  } catch (error) {
    console.error("❌ Erro ao gerar relatório:", error);
    mostrarSnackbar("Erro ao gerar relatório", "error");
  } finally {
    gerandoAuditoria.value = false;
  }
};

// PDF Generators (Simple HTML to print)
const gerarPDFEquipamentos = (dados) => {
  const dataAtual = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Equipamentos - MEDLUX Reflective</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #00ffff; text-align: center; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #0a0e27; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <h1>📊 MEDLUX Reflective</h1>
        <h2>Relatório de Equipamentos</h2>
        <p>Gerado em: ${dataAtual}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Fabricante</th>
            <th>Localização</th>
            <th>Próxima Calibração</th>
          </tr>
        </thead>
        <tbody>
          ${dados
            .map(
              (e) => `
            <tr>
              <td>${e.codigo || ""}</td>
              <td>${e.nome || ""}</td>
              <td>${e.tipo || ""}</td>
              <td>${e.status || ""}</td>
              <td>${e.fabricante || ""}</td>
              <td>${e.localizacao || ""}</td>
              <td>${e.proxima_calibracao ? format(new Date(e.proxima_calibracao), "dd/MM/yyyy") : "-"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      <div class="footer">
        <p>MEDLUX Reflective © ${new Date().getFullYear()} - Sistema de Gestão de Equipamentos</p>
        <p>Total de registros: ${dados.length}</p>
      </div>
      
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
};

const gerarPDFVinculos = (dados) => {
  const dataAtual = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Vínculos - MEDLUX Reflective</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #9d00ff; text-align: center; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #0a0e27; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <h1>📊 MEDLUX Reflective</h1>
        <h2>Relatório de Vínculos</h2>
        <p>Gerado em: ${dataAtual}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Usuário</th>
            <th>Data Início</th>
            <th>Data Fim</th>
            <th>Status</th>
            <th>Observações</th>
          </tr>
        </thead>
        <tbody>
          ${dados
            .map(
              (v) => `
            <tr>
              <td>${v.equipamento?.codigo || "N/A"} - ${v.equipamento?.nome || ""}</td>
              <td>${v.usuario?.nome || "N/A"}<br><small>${v.usuario?.email || ""}</small></td>
              <td>${v.data_inicio ? format(new Date(v.data_inicio), "dd/MM/yyyy") : "-"}</td>
              <td>${v.data_fim ? format(new Date(v.data_fim), "dd/MM/yyyy") : "Em andamento"}</td>
              <td>${v.ativo ? "Ativo" : "Finalizado"}</td>
              <td>${v.observacoes || "-"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      <div class="footer">
        <p>MEDLUX Reflective © ${new Date().getFullYear()} - Sistema de Gestão de Equipamentos</p>
        <p>Total de registros: ${dados.length}</p>
      </div>
      
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
};

const gerarPDFCalibracao = (dados) => {
  const dataAtual = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Calibração - MEDLUX Reflective</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #ffaa00; text-align: center; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #0a0e27; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .vencida { background-color: #ffebee !important; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <h1>📊 MEDLUX Reflective</h1>
        <h2>Relatório de Calibração</h2>
        <p>Gerado em: ${dataAtual}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Última Calibração</th>
            <th>Próxima Calibração</th>
            <th>Certificado</th>
          </tr>
        </thead>
        <tbody>
          ${dados
            .map((e) => {
              const vencida =
                e.proxima_calibracao &&
                new Date(e.proxima_calibracao) < new Date();
              return `
            <tr class="${vencida ? "vencida" : ""}">
              <td>${e.codigo || ""}</td>
              <td>${e.nome || ""}</td>
              <td>${e.tipo || ""}</td>
              <td>${e.data_ultima_calibracao ? format(new Date(e.data_ultima_calibracao), "dd/MM/yyyy") : "-"}</td>
              <td>${e.proxima_calibracao ? format(new Date(e.proxima_calibracao), "dd/MM/yyyy") : "-"}</td>
              <td>${e.certificado_calibracao || "-"}</td>
            </tr>
          `;
            })
            .join("")}
        </tbody>
      </table>
      <div class="footer">
        <p>MEDLUX Reflective © ${new Date().getFullYear()} - Sistema de Gestão de Equipamentos</p>
        <p>Total de registros: ${dados.length}</p>
      </div>
      
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
};

const gerarPDFAuditoria = (dados) => {
  const dataAtual = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Auditoria - MEDLUX Reflective</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #00d4ff; text-align: center; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
        th { background-color: #0a0e27; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <h1>📊 MEDLUX Reflective</h1>
        <h2>Relatório de Auditoria</h2>
        <p>Gerado em: ${dataAtual}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Data/Hora</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Entidade</th>
            <th>ID Entidade</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          ${dados
            .map(
              (a) => `
            <tr>
              <td>${a.created_at ? format(new Date(a.created_at), "dd/MM/yyyy HH:mm:ss") : "-"}</td>
              <td>${a.usuario?.nome || "Sistema"}</td>
              <td>${a.acao || ""}</td>
              <td>${a.entidade || ""}</td>
              <td>${a.entidade_id ? a.entidade_id.substring(0, 8) + "..." : "-"}</td>
              <td>${a.ip_address || "-"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      <div class="footer">
        <p>MEDLUX Reflective © ${new Date().getFullYear()} - Sistema de Gestão de Equipamentos</p>
        <p>Total de registros: ${dados.length}</p>
      </div>
      
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
};

// Excel Exporters (CSV format)
const exportarExcelEquipamentos = (dados) => {
  const csv = [
    [
      "Código",
      "Nome",
      "Tipo",
      "Status",
      "Fabricante",
      "Modelo",
      "Número de Série",
      "Localização",
      "Data Aquisição",
      "Última Calibração",
      "Próxima Calibração",
    ],
    ...dados.map((e) => [
      e.codigo || "",
      e.nome || "",
      e.tipo || "",
      e.status || "",
      e.fabricante || "",
      e.modelo || "",
      e.numero_serie || "",
      e.localizacao || "",
      e.data_aquisicao ? format(new Date(e.data_aquisicao), "dd/MM/yyyy") : "",
      e.data_ultima_calibracao
        ? format(new Date(e.data_ultima_calibracao), "dd/MM/yyyy")
        : "",
      e.proxima_calibracao
        ? format(new Date(e.proxima_calibracao), "dd/MM/yyyy")
        : "",
    ]),
  ]
    .map((row) => row.join(";"))
    .join("\n");

  downloadCSV(csv, `equipamentos_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
};

const exportarExcelVinculos = (dados) => {
  const csv = [
    [
      "Equipamento",
      "Usuário",
      "Email",
      "Data Início",
      "Data Fim",
      "Status",
      "Observações",
    ],
    ...dados.map((v) => [
      (v.equipamento?.codigo || "") + " - " + (v.equipamento?.nome || ""),
      v.usuario?.nome || "",
      v.usuario?.email || "",
      v.data_inicio ? format(new Date(v.data_inicio), "dd/MM/yyyy") : "",
      v.data_fim ? format(new Date(v.data_fim), "dd/MM/yyyy") : "Em andamento",
      v.ativo ? "Ativo" : "Finalizado",
      v.observacoes || "",
    ]),
  ]
    .map((row) => row.join(";"))
    .join("\n");

  downloadCSV(csv, `vinculos_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
};

const exportarExcelCalibracao = (dados) => {
  const csv = [
    [
      "Código",
      "Nome",
      "Tipo",
      "Última Calibração",
      "Próxima Calibração",
      "Certificado",
    ],
    ...dados.map((e) => [
      e.codigo || "",
      e.nome || "",
      e.tipo || "",
      e.data_ultima_calibracao
        ? format(new Date(e.data_ultima_calibracao), "dd/MM/yyyy")
        : "",
      e.proxima_calibracao
        ? format(new Date(e.proxima_calibracao), "dd/MM/yyyy")
        : "",
      e.certificado_calibracao || "",
    ]),
  ]
    .map((row) => row.join(";"))
    .join("\n");

  downloadCSV(csv, `calibracao_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
};

const exportarExcelAuditoria = (dados) => {
  const csv = [
    ["Data/Hora", "Usuário", "Ação", "Entidade", "ID Entidade", "IP"],
    ...dados.map((a) => [
      a.created_at ? format(new Date(a.created_at), "dd/MM/yyyy HH:mm:ss") : "",
      a.usuario?.nome || "Sistema",
      a.acao || "",
      a.entidade || "",
      a.entidade_id || "",
      a.ip_address || "",
    ]),
  ]
    .map((row) => row.join(";"))
    .join("\n");

  downloadCSV(csv, `auditoria_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
};

const downloadCSV = (csv, filename) => {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const mostrarSnackbar = (message, color = "success") => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};
</script>

<style scoped>
.text-secondary {
  color: var(--text-secondary);
}

.report-card {
  transition: all 0.3s ease;
}

.report-card:hover {
  transform: translateY(-4px);
}
</style>
