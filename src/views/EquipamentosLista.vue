<template>
  <div>
    <!-- Cabeçalho -->
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap">
      <h1 class="text-h4 font-weight-bold">
        <v-icon class="mr-2" color="primary">mdi-devices</v-icon>
        Equipamentos
      </h1>

      <v-btn
        v-if="podeGerenciarEquipamentos"
        color="primary"
        size="large"
        class="glow-primary"
        @click="abrirDialogNovo"
      >
        <v-icon class="mr-2">mdi-plus</v-icon>
        Novo Equipamento
      </v-btn>
    </div>

    <!-- Filtros -->
    <v-card class="glass mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filtros.busca"
              label="Buscar"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hint="Código, marca/fabricante ou modelo"
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filtros.tipo"
              :items="tiposEquipamento"
              label="Tipo"
              prepend-inner-icon="mdi-shape"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filtros.status"
              :items="statusEquipamento"
              label="Status"
              prepend-inner-icon="mdi-information"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filtros.calibracao"
              :items="filtrosCalibracao"
              label="Calibração"
              prepend-inner-icon="mdi-calendar-check"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabela de Equipamentos -->
    <v-card class="glass">
      <v-alert
        v-if="erroCarregamento"
        type="error"
        variant="tonal"
        class="mx-4 mt-4"
      >
        {{ erroCarregamento }}
      </v-alert>
      <v-data-table
        :headers="headers"
        :items="equipamentosFiltrados"
        :loading="carregando"
        :items-per-page="10"
        class="elevation-0"
      >
        <!-- Código com QR Code -->
        <template v-slot:item.codigo="{ item }">
          <div class="d-flex align-center">
            <v-btn
              icon
              size="small"
              variant="text"
              @click="mostrarQRCode(item)"
            >
              <v-icon size="20">mdi-qrcode</v-icon>
            </v-btn>
            <span class="font-weight-bold ml-2">{{ item.codigo }}</span>
          </div>
        </template>

        <!-- Tipo com ícone -->
        <template v-slot:item.tipo="{ item }">
          <v-chip :color="getCorTipo(item.tipo)" size="small">
            <v-icon start size="16">{{ getIconeTipo(item.tipo) }}</v-icon>
            {{ item.tipo }}
          </v-chip>
        </template>

        <!-- Certificado PDF -->
        <template v-slot:item.certificado_url="{ item }">
          <v-btn
            v-if="getCertificadoUrl(item)"
            icon
            size="small"
            variant="text"
            color="success"
            @click="abrirCertificado(item)"
          >
            <v-icon size="20">mdi-file-pdf-box</v-icon>
          </v-btn>

          <v-tooltip v-else text="Sem certificado" location="top">
            <template #activator="{ props }">
              <span v-bind="props" class="d-inline-flex align-center">
                <v-icon size="20" color="medium-emphasis"
                  >mdi-file-pdf-box</v-icon
                >
              </span>
            </template>
          </v-tooltip>
        </template>

        <!-- Status com chip -->
        <template v-slot:item.status="{ item }">
          <v-chip :color="getCorStatus(item.status)" size="small">
            {{ getTextoStatus(item.status) }}
          </v-chip>
        </template>

        <!-- Calibração com alerta -->
        <template v-slot:item.proxima_calibracao="{ item }">
          <div class="d-flex align-center">
            <v-icon
              v-if="isCalibracaoVencida(item.proxima_calibracao)"
              color="error"
              size="20"
              class="mr-2"
            >
              mdi-alert-circle
            </v-icon>
            <v-icon
              v-else-if="isCalibracaoProxima(item.proxima_calibracao)"
              color="warning"
              size="20"
              class="mr-2"
            >
              mdi-clock-alert
            </v-icon>
            <span :class="getClasseCalibracao(item.proxima_calibracao)">
              {{ formatarData(item.proxima_calibracao) }}
            </span>
          </div>
        </template>

        <!-- Ações -->
        <template v-slot:item.acoes="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              icon
              size="small"
              variant="text"
              color="info"
              @click="visualizarEquipamento(item)"
            >
              <v-icon size="20">mdi-eye</v-icon>
            </v-btn>
            <v-btn
              v-if="podeGerenciarEquipamentos"
              icon
              size="small"
              variant="text"
              color="primary"
              @click="editarEquipamento(item)"
            >
              <v-icon size="20">mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              v-if="podeGerenciarEquipamentos"
              icon
              size="small"
              variant="text"
              color="error"
              @click="confirmarExclusao(item)"
            >
              <v-icon size="20">mdi-delete</v-icon>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog de Cadastro/Edição -->
    <v-dialog v-model="dialogForm" max-width="900px" persistent scrollable>
      <v-card class="glass">
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <span class="text-h5">
            <v-icon class="mr-2" color="primary">
              {{ modoEdicao ? "mdi-pencil" : "mdi-plus" }}
            </v-icon>
            {{ modoEdicao ? "Editar Equipamento" : "Novo Equipamento" }}
          </span>
          <v-btn icon variant="text" @click="fecharDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <v-form ref="formRef" v-model="formValido">
            <v-row>
              <!-- Informações Básicas -->
              <v-col cols="12">
                <h3 class="text-h6 mb-4">
                  <v-icon class="mr-2">mdi-information</v-icon>
                  Informações Básicas
                </h3>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="equipamentoForm.codigo"
                  label="Código *"
                  :rules="[rules.required]"
                  :error-messages="codigoErro"
                  @blur="validarCodigoDuplicado"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-barcode"
                  :disabled="modoEdicao"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="equipamentoForm.tipo"
                  :items="tiposEquipamento"
                  label="Tipo *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-shape"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="equipamentoForm.certificado_url"
                  label="URL do Certificado de Calibração"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-file-pdf-box"
                  hint="Link do PDF do certificado (Google Drive, Dropbox, etc)"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="equipamentoForm.fabricante"
                  label="Marca/Fabricante *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-factory"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="equipamentoForm.modelo"
                  label="Modelo *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-package-variant"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="equipamentoForm.numero_serie"
                  label="Número de Série *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-numeric"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="equipamentoForm.data_aquisicao"
                  label="Data de Aquisição *"
                  type="date"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar"
                />
              </v-col>

              <!-- Calibração -->
              <v-col cols="12">
                <h3 class="text-h6 mb-4 mt-4">
                  <v-icon class="mr-2">mdi-calendar-check</v-icon>
                  Calibração
                </h3>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="equipamentoForm.ultima_calibracao"
                  label="Última Calibração"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-check"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="equipamentoForm.proxima_calibracao"
                  label="Próxima Calibração"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-alert"
                  readonly
                />
              </v-col>

              <!-- Status e Localização -->
              <v-col cols="12">
                <h3 class="text-h6 mb-4 mt-4">
                  <v-icon class="mr-2">mdi-map-marker</v-icon>
                  Status e Localização
                </h3>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="equipamentoForm.status"
                  :items="statusEquipamento"
                  label="Status *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-information"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="equipamentoForm.localizacao"
                  label="Localização"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-map-marker"
                />
              </v-col>

              <!-- Foto do Equipamento -->
              <v-col cols="12">
                <h3 class="text-h6 mb-4 mt-4">
                  <v-icon class="mr-2">mdi-camera</v-icon>
                  Foto do Equipamento
                </h3>
              </v-col>

              <v-col cols="12">
                <v-file-input
                  v-model="fotoFile"
                  label="Selecionar foto"
                  accept="image/*"
                  prepend-icon="mdi-camera"
                  variant="outlined"
                  density="comfortable"
                  @change="processarFoto"
                >
                  <template v-slot:selection="{ fileNames }">
                    <template v-for="fileName in fileNames" :key="fileName">
                      <v-chip size="small" color="primary" class="mr-2">
                        {{ fileName }}
                      </v-chip>
                    </template>
                  </template>
                </v-file-input>

                <v-img
                  v-if="equipamentoForm.foto"
                  :src="equipamentoForm.foto"
                  max-height="200"
                  contain
                  class="mt-2 rounded"
                />
              </v-col>

              <!-- Observações -->
              <v-col cols="12">
                <v-textarea
                  v-model="equipamentoForm.observacoes"
                  label="Observações"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-note-text"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="fecharDialog"> Cancelar </v-btn>
          <v-btn
            color="primary"
            :loading="salvando"
            :disabled="salvando"
            @click="salvarEquipamento"
          >
            <v-icon class="mr-2">mdi-content-save</v-icon>
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Visualização -->
    <v-dialog v-model="dialogVisualizacao" max-width="700px">
      <v-card v-if="equipamentoSelecionado" class="glass">
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <span class="text-h5">
            <v-icon class="mr-2" color="primary">mdi-eye</v-icon>
            Detalhes do Equipamento
          </span>
          <v-btn icon variant="text" @click="dialogVisualizacao = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <!-- Foto -->
          <v-img
            v-if="equipamentoSelecionado.foto"
            :src="equipamentoSelecionado.foto"
            max-height="300"
            contain
            class="mb-4 rounded"
          />

          <!-- Informações -->
          <v-row>
            <v-col cols="12" md="6">
              <div class="mb-4">
                <p class="text-caption text-secondary mb-1">Código</p>
                <p class="text-h6">{{ equipamentoSelecionado.codigo }}</p>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <p class="text-caption text-secondary mb-1">Tipo</p>
                <v-chip :color="getCorTipo(equipamentoSelecionado.tipo)">
                  {{ equipamentoSelecionado.tipo }}
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <p class="text-caption text-secondary mb-1">Marca/Fabricante</p>
                <p class="text-body-1">
                  {{
                    equipamentoSelecionado.fabricante ||
                    equipamentoSelecionado.marca ||
                    "-"
                  }}
                </p>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <p class="text-caption text-secondary mb-1">Modelo</p>
                <p class="text-body-1">{{ equipamentoSelecionado.modelo }}</p>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <p class="text-caption text-secondary mb-1">Número de Série</p>
                <p class="text-body-1">
                  {{ equipamentoSelecionado.numero_serie }}
                </p>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <p class="text-caption text-secondary mb-1">
                  Data de Aquisição
                </p>
                <p class="text-body-1">
                  {{ formatarData(equipamentoSelecionado.data_aquisicao) }}
                </p>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <p class="text-caption text-secondary mb-1">
                  Última Calibração
                </p>
                <p class="text-body-1">
                  {{ formatarData(equipamentoSelecionado.ultima_calibracao) }}
                </p>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <p class="text-caption text-secondary mb-1">
                  Próxima Calibração
                </p>
                <p
                  class="text-body-1"
                  :class="
                    getClasseCalibracao(
                      equipamentoSelecionado.proxima_calibracao,
                    )
                  "
                >
                  {{ formatarData(equipamentoSelecionado.proxima_calibracao) }}
                </p>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <p class="text-caption text-secondary mb-1">Status</p>
                <v-chip :color="getCorStatus(equipamentoSelecionado.status)">
                  {{ getTextoStatus(equipamentoSelecionado.status) }}
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-4">
                <p class="text-caption text-secondary mb-1">Localização</p>
                <p class="text-body-1">
                  {{ equipamentoSelecionado.localizacao || "-" }}
                </p>
              </div>
            </v-col>

            <v-col cols="12" v-if="equipamentoSelecionado.observacoes">
              <div class="mb-4">
                <p class="text-caption text-secondary mb-1">Observações</p>
                <p class="text-body-1">
                  {{ equipamentoSelecionado.observacoes }}
                </p>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn
            v-if="podeGerenciarEquipamentos"
            color="primary"
            variant="text"
            @click="editarEquipamento(equipamentoSelecionado)"
          >
            <v-icon class="mr-2">mdi-pencil</v-icon>
            Editar
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="dialogVisualizacao = false">
            Fechar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de QR Code -->
    <v-dialog v-model="dialogQRCode" max-width="400px">
      <v-card v-if="equipamentoSelecionado" class="glass text-center pa-4">
        <v-card-title>
          <v-icon class="mr-2" color="primary">mdi-qrcode</v-icon>
          QR Code
        </v-card-title>
        <v-card-text>
          <div id="qrcode" class="d-flex justify-center"></div>
          <p class="text-h6 mt-4">{{ equipamentoSelecionado.codigo }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogQRCode = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Confirmação de Exclusão -->
    <v-dialog v-model="dialogExclusao" max-width="500px">
      <v-card class="glass">
        <v-card-title class="text-h5 text-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          Confirmar Exclusão
        </v-card-title>
        <v-card-text>
          <p>Tem certeza que deseja excluir o equipamento?</p>
          <v-alert type="warning" variant="tonal" class="mt-4">
            <strong>{{ equipamentoParaExcluir?.codigo }}</strong
            ><br />
            Esta ação não pode ser desfeita!
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogExclusao = false">
            Cancelar
          </v-btn>
          <v-btn color="error" :loading="excluindo" @click="excluirEquipamento">
            <v-icon class="mr-2">mdi-delete</v-icon>
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de Feedback -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false"> Fechar </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted, watch } from "vue";
import { useDiagnosticsStore } from "@/stores/diagnostics";
import supabase, {
  getEquipamentos,
  createEquipamento,
  updateEquipamento,
  deleteEquipamento,
  subscribeToEquipamentos,
} from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";
import { requireAdmin } from "@/services/authGuard";
import { format, parseISO, differenceInDays } from "date-fns";
import QRCode from "qrcode";

const authStore = useAuthStore();
const diagnosticsStore = useDiagnosticsStore();

// State
const equipamentos = ref([]);
const carregando = ref(false);
const dialogForm = ref(false);
const dialogVisualizacao = ref(false);
const dialogQRCode = ref(false);
const dialogExclusao = ref(false);
const modoEdicao = ref(false);
const formValido = ref(false);
const salvando = ref(false);
const excluindo = ref(false);
const formRef = ref(null);
const fotoFile = ref(null);
const equipamentoSelecionado = ref(null);
const equipamentoParaExcluir = ref(null);
const podeGerenciarEquipamentos = computed(() => authStore.isAdmin);
const codigoErro = ref("");
const erroCarregamento = ref("");
let codigoValidationTimeout = null;

// Filtros
const filtros = ref({
  busca: "",
  tipo: null,
  status: null,
  calibracao: null,
});

// Snackbar
const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

// Opções
const tiposEquipamento = ["horizontal", "vertical", "tachas"];
const statusEquipamento = [
  { title: "Ativo", value: "ativo" },
  { title: "Manutenção", value: "manutencao" },
  { title: "Inativo", value: "inativo" },
];
const filtrosCalibracao = [
  { title: "Vencida", value: "vencida" },
  { title: "Próxima (30 dias)", value: "proxima" },
  { title: "Em dia", value: "emdia" },
];

// Headers da tabela
const headers = [
  { title: "Código", key: "codigo", sortable: true },
  { title: "Tipo", key: "tipo", sortable: true },
  { title: "Certificado", key: "certificado_url", sortable: false },
  { title: "Marca/Fabricante", key: "fabricante", sortable: true },
  { title: "Modelo", key: "modelo", sortable: true },
  { title: "Número de Série", key: "numero_serie", sortable: false },
  { title: "Status", key: "status", sortable: true },
  { title: "Próxima Calibração", key: "proxima_calibracao", sortable: true },
  { title: "Ações", key: "acoes", sortable: false, align: "center" },
];

// Formulário
const equipamentoForm = ref({
  codigo: "",
  tipo: null,
  certificado_url: "",
  fabricante: "",
  modelo: "",
  numero_serie: "",
  data_aquisicao: "",
  ultima_calibracao: "",
  proxima_calibracao: "",
  status: "ativo",
  localizacao: "",
  observacoes: "",
  foto: null,
});

// Regras de validação
const rules = {
  required: (v) => !!v || "Campo obrigatório",
};

const garantirAdmin = async () => {
  try {
    await requireAdmin();
    return true;
  } catch (error) {
    if (error?.code === "SESSION_EXPIRED") {
      mostrarSnackbar("Sessão expirada, faça login novamente", "warning");
      return false;
    }

    mostrarSnackbar("Somente ADMIN", "warning");
    return false;
  }
};

const mapearErroSupabase = (error) => {
  const status = error?.status || null;
  const code = error?.code || null;
  const hint = error?.hint || null;
  const message = error?.message || "Erro inesperado.";

  if (code === "SESSION_EXPIRED")
    return "Sessão expirada, faça login novamente";
  if (code === "FORBIDDEN_ADMIN_ONLY") return "Somente ADMIN";

  if (status === 403) {
    return `Sem permissão para esta ação. (status=${status}, code=${code || "n/a"})`;
  }

  return `Erro: ${message} (status=${status || "n/a"}, code=${code || "n/a"}${hint ? `, hint=${hint}` : ""})`;
};

const validarCodigoDuplicado = async () => {
  if (modoEdicao.value || !dialogForm.value) {
    codigoErro.value = "";
    return true;
  }

  const codigo = (equipamentoForm.value.codigo || "").trim().toUpperCase();
  if (!codigo) {
    codigoErro.value = "";
    return true;
  }

  const { data, error } = await supabase
    .from("equipamentos")
    .select("id")
    .eq("codigo", codigo)
    .maybeSingle();

  if (error) {
    const lower = (error.message || "").toLowerCase();
    if (lower.includes("multiple") || lower.includes("more than 1 row")) {
      codigoErro.value =
        "Foram encontrados equipamentos duplicados com este código. Contate o administrador.";
      return false;
    }
    codigoErro.value = mapearErroSupabase(error);
    return false;
  }

  codigoErro.value = data ? "Código já cadastrado" : "";
  return !data;
};

const calcularProximaCalibracao = (ultimaCalibracao) => {
  if (!ultimaCalibracao) return null;

  const dataUltimaCalibracao = new Date(`${ultimaCalibracao}T00:00:00`);

  if (Number.isNaN(dataUltimaCalibracao.getTime())) {
    return null;
  }

  dataUltimaCalibracao.setFullYear(dataUltimaCalibracao.getFullYear() + 1);
  return dataUltimaCalibracao.toISOString().split("T")[0];
};

const getCertificadoUrl = (equipamento = {}) => {
  return (
    equipamento.certificado_url ||
    equipamento.url_certificado ||
    equipamento.certificadoCalibracaoUrl ||
    null
  );
};

// Computed
const equipamentosFiltrados = computed(() => {
  let resultado = [...equipamentos.value];

  // Filtro de busca
  if (filtros.value.busca) {
    const busca = filtros.value.busca.toLowerCase();
    console.log("🔍 Buscando:", busca);

    resultado = resultado.filter((eq) => {
      const codigo = (eq.codigo || "").toLowerCase();
      const modelo = (eq.modelo || "").toLowerCase();
      const numero_serie = (eq.numero_serie || "").toLowerCase();
      const fabricante = (eq.fabricante || "").toLowerCase();
      const nome = (eq.nome || "").toLowerCase();

      const match =
        codigo.includes(busca) ||
        modelo.includes(busca) ||
        numero_serie.includes(busca) ||
        fabricante.includes(busca) ||
        nome.includes(busca);

      if (match) {
        console.log("✅ Match encontrado:", eq.codigo, "|", eq.modelo);
      }

      return match;
    });

    console.log(
      `📊 Resultados da busca: ${resultado.length} de ${equipamentos.value.length}`,
    );
  }

  // Filtro de tipo
  if (filtros.value.tipo) {
    resultado = resultado.filter((eq) => eq.tipo === filtros.value.tipo);
  }

  // Filtro de status
  if (filtros.value.status) {
    resultado = resultado.filter(
      (eq) => eq.status === filtros.value.status.value,
    );
  }

  // Filtro de calibração
  if (filtros.value.calibracao) {
    const hoje = new Date().toISOString().split("T")[0];
    const em30Dias = new Date();
    em30Dias.setDate(em30Dias.getDate() + 30);
    const em30DiasStr = em30Dias.toISOString().split("T")[0];

    if (filtros.value.calibracao.value === "vencida") {
      resultado = resultado.filter((eq) => eq.proxima_calibracao < hoje);
    } else if (filtros.value.calibracao.value === "proxima") {
      resultado = resultado.filter(
        (eq) =>
          eq.proxima_calibracao >= hoje && eq.proxima_calibracao <= em30DiasStr,
      );
    } else if (filtros.value.calibracao.value === "emdia") {
      resultado = resultado.filter((eq) => eq.proxima_calibracao > em30DiasStr);
    }
  }

  return resultado.sort((a, b) =>
    (a?.codigo || "").localeCompare(b?.codigo || "", "pt-BR", {
      sensitivity: "base",
    }),
  );
});

// Métodos auxiliares
const formatarData = (data) => {
  if (!data) return "-";
  try {
    return format(parseISO(data), "dd/MM/yyyy");
  } catch {
    return data;
  }
};

const isCalibracaoVencida = (data) => {
  if (!data) return false;
  const hoje = new Date();
  const dataCalibracao = parseISO(data);
  return dataCalibracao < hoje;
};

const isCalibracaoProxima = (data) => {
  if (!data) return false;
  const hoje = new Date();
  const dataCalibracao = parseISO(data);
  const dias = differenceInDays(dataCalibracao, hoje);
  return dias >= 0 && dias <= 30;
};

const getClasseCalibracao = (data) => {
  if (isCalibracaoVencida(data)) return "text-error font-weight-bold";
  if (isCalibracaoProxima(data)) return "text-warning font-weight-bold";
  return "text-success";
};

const getCorTipo = (tipo) => {
  const cores = {
    Horizontal: "blue",
    Vertical: "green",
    Tachas: "orange",
  };
  return cores[tipo] || "grey";
};

const getIconeTipo = (tipo) => {
  const icones = {
    Horizontal: "mdi-arrow-left-right",
    Vertical: "mdi-arrow-up-down",
    Tachas: "mdi-circle-small",
  };
  return icones[tipo] || "mdi-device-unknown";
};

const getCorStatus = (status) => {
  const cores = {
    ativo: "success",
    manutencao: "warning",
    inativo: "error",
  };
  return cores[status] || "grey";
};

const getTextoStatus = (status) => {
  const textos = {
    ativo: "Ativo",
    manutencao: "Manutenção",
    inativo: "Inativo",
  };
  return textos[status] || status;
};

const abrirCertificado = (equipamento) => {
  const certificadoUrl = getCertificadoUrl(equipamento);
  if (!certificadoUrl) return;

  window.open(certificadoUrl, "_blank", "noopener,noreferrer");
};

const sortEquipamentosPorCodigo = (lista = []) =>
  [...lista].sort((a, b) =>
    (a?.codigo || "").localeCompare(b?.codigo || "", "pt-BR", {
      sensitivity: "base",
    }),
  );

// Métodos CRUD
const carregarEquipamentos = async () => {
  carregando.value = true;
  erroCarregamento.value = "";
  try {
    console.log("🔄 Carregando equipamentos do Supabase...");

    const resultado = await getEquipamentos();
    if (resultado.success) {
      equipamentos.value = sortEquipamentosPorCodigo(
        (resultado.data || []).map((eq) => ({
          ...eq,
          fabricante: eq.fabricante || eq.marca || "",
        })),
      );
      console.log(`✅ ${resultado.data.length} equipamentos carregados`);
    } else {
      throw new Error(resultado.error);
    }
  } catch (error) {
    console.error("❌ Erro ao carregar equipamentos:", error);
    const mensagem = mapearErroSupabase(error);
    erroCarregamento.value = `Não foi possível carregar a lista de equipamentos. ${mensagem}`;
    diagnosticsStore.pushEvent({
      type: "api_error",
      source: "EquipamentosLista:carregarEquipamentos",
      message: mensagem,
      context: { table: "equipamentos" },
      error,
    });
    mostrarSnackbar("Erro ao carregar equipamentos", "error");
  } finally {
    carregando.value = false;
  }
};

const abrirDialogNovo = async () => {
  if (!(await garantirAdmin())) {
    mostrarSnackbar("Somente ADMIN", "warning");
    return;
  }

  try {
    await requireAdmin((message) => mostrarSnackbar(message, "warning"));
  } catch {
    return;
  }

  modoEdicao.value = false;
  equipamentoForm.value = {
    codigo: "",
    tipo: null,
    fabricante: "",
    modelo: "",
    numero_serie: "",
    data_aquisicao: "",
    ultima_calibracao: "",
    proxima_calibracao: "",
    status: "ativo",
    localizacao: "",
    observacoes: "",
    foto: null,
    certificado_url: "",
  };
  fotoFile.value = null;
  dialogForm.value = true;
};

const editarEquipamento = async (equipamento) => {
  if (!(await requireAdmin())) {
    mostrarSnackbar("Somente ADMIN", "warning");
    return;
  }

  try {
    await requireAdmin((message) => mostrarSnackbar(message, "warning"));
  } catch {
    return;
  }

  modoEdicao.value = true;
  equipamentoForm.value = {
    ...equipamento,
    fabricante: equipamento.fabricante || equipamento.marca || "",
  };
  dialogVisualizacao.value = false;
  dialogForm.value = true;
};

const visualizarEquipamento = (equipamento) => {
  equipamentoSelecionado.value = equipamento;
  dialogVisualizacao.value = true;
};

const processarFoto = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    equipamentoForm.value.foto = e.target.result;
  };
  reader.readAsDataURL(file);
};

const salvarEquipamento = async () => {
  if (!(await garantirAdmin())) return;

  try {
    await requireAdmin((message) => mostrarSnackbar(message, "warning"));
  } catch {
    return;
  }

  const codigoOk = await validarCodigoDuplicado();
  if (!codigoOk) return;

  const { valid } = await formRef.value.validate();
  if (!valid) return;

  salvando.value = true;

  try {
    const proximaCalibracaoCalculada = calcularProximaCalibracao(
      equipamentoForm.value.ultima_calibracao,
    );

    // Preparar dados do equipamento
    const equipamentoData = {
      codigo: equipamentoForm.value.codigo,
      nome: `${equipamentoForm.value.modelo || ""}`.trim() || "Equipamento",
      tipo: equipamentoForm.value.tipo?.toLowerCase() || "horizontal",
      status: equipamentoForm.value.status || "ativo",
      fabricante: equipamentoForm.value.fabricante,
      modelo: equipamentoForm.value.modelo,
      numero_serie: equipamentoForm.value.numero_serie,
      localizacao: equipamentoForm.value.localizacao,
      data_aquisicao: equipamentoForm.value.data_aquisicao || null,
      ultima_calibracao: equipamentoForm.value.ultima_calibracao || null,
      proxima_calibracao: proximaCalibracaoCalculada,
      observacoes: equipamentoForm.value.observacoes || "",
      foto_url: equipamentoForm.value.foto || null,
      certificado_url: equipamentoForm.value.certificado_url || null,
    };

    let resultado;

    if (modoEdicao.value) {
      // Atualizar equipamento existente
      console.log("🔄 Atualizando equipamento:", equipamentoData.codigo);
      resultado = await updateEquipamento(
        equipamentoForm.value.id,
        equipamentoData,
      );

      if (resultado.success) {
        mostrarSnackbar("Equipamento atualizado com sucesso!", "success");
      } else {
        throw new Error(resultado.error);
      }
    } else {
      // Criar novo equipamento
      console.log("➕ Criando novo equipamento:", equipamentoData.codigo);
      resultado = await createEquipamento(equipamentoData);

      if (resultado.success) {
        mostrarSnackbar("Equipamento cadastrado com sucesso!", "success");
      } else {
        throw new Error(resultado.error);
      }
    }

    await carregarEquipamentos();
    fecharDialog();
  } catch (error) {
    console.error("❌ Erro ao salvar equipamento:", error);
    mostrarSnackbar(mapearErroSupabase(error), "error");
  } finally {
    salvando.value = false;
  }
};

const confirmarExclusao = async (equipamento) => {
  if (!(await garantirAdmin())) {
    mostrarSnackbar("Somente ADMIN", "warning");
    return;
  }

  try {
    await requireAdmin((message) => mostrarSnackbar(message, "warning"));
  } catch {
    return;
  }

  equipamentoParaExcluir.value = equipamento;
  dialogExclusao.value = true;
};

const excluirEquipamento = async () => {
  if (!equipamentoParaExcluir.value) return;
  if (!(await garantirAdmin())) return;

  try {
    await requireAdmin((message) => mostrarSnackbar(message, "warning"));
  } catch {
    return;
  }

  excluindo.value = true;

  try {
    console.log(
      "🗑️ Excluindo equipamento:",
      equipamentoParaExcluir.value.codigo,
    );
    const resultado = await deleteEquipamento(equipamentoParaExcluir.value.id);

    if (resultado.success) {
      mostrarSnackbar("Equipamento excluído com sucesso!", "success");
      await carregarEquipamentos();
      dialogExclusao.value = false;
      equipamentoParaExcluir.value = null;
    } else {
      throw new Error(resultado.error);
    }
  } catch (error) {
    console.error("❌ Erro ao excluir equipamento:", error);
    mostrarSnackbar(mapearErroSupabase(error), "error");
  } finally {
    excluindo.value = false;
  }
};

const mostrarQRCode = async (equipamento) => {
  equipamentoSelecionado.value = equipamento;
  dialogQRCode.value = true;

  await nextTick();

  const qrcodeElement = document.getElementById("qrcode");
  if (qrcodeElement) {
    qrcodeElement.innerHTML = "";
    try {
      await QRCode.toCanvas(qrcodeElement, equipamento.codigo, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0074D9",
          light: "#FFFFFF",
        },
      });
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
    }
  }
};

const fecharDialog = () => {
  dialogForm.value = false;
  formRef.value?.resetValidation();
};

const mostrarSnackbar = (message, color = "success") => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};

// Lifecycle
let unsubscribe = null;

onMounted(async () => {
  await carregarEquipamentos();

  // Inscrever-se para mudanças em tempo real
  console.log("🔔 Ativando sincronização em tempo real...");
  unsubscribe = subscribeToEquipamentos((payload) => {
    console.log("🔔 Mudança detectada:", payload.eventType);

    // Recarregar equipamentos quando houver mudanças
    if (payload.eventType === "INSERT") {
      console.log("➕ Novo equipamento adicionado");
      carregarEquipamentos();
    } else if (payload.eventType === "UPDATE") {
      console.log("🔄 Equipamento atualizado");
      carregarEquipamentos();
    } else if (payload.eventType === "DELETE") {
      console.log("🗑️ Equipamento excluído");
      carregarEquipamentos();
    }
  });
});

onUnmounted(() => {
  if (codigoValidationTimeout) {
    clearTimeout(codigoValidationTimeout);
  }

  // Cancelar inscrição ao sair da página
  if (unsubscribe) {
    console.log("🔕 Desativando sincronização em tempo real");
    unsubscribe();
  }
});

watch(
  () => equipamentoForm.value.codigo,
  () => {
    codigoErro.value = "";

    if (codigoValidationTimeout) {
      clearTimeout(codigoValidationTimeout);
    }

    if (!dialogForm.value || modoEdicao.value) return;

    codigoValidationTimeout = setTimeout(() => {
      validarCodigoDuplicado();
    }, 450);
  },
);

watch(
  () => equipamentoForm.value.ultima_calibracao,
  (novaData) => {
    equipamentoForm.value.proxima_calibracao =
      calcularProximaCalibracao(novaData);
  },
);
</script>

<style scoped>
.text-secondary {
  color: var(--text-secondary);
}

.gap-1 {
  gap: 4px;
}
</style>
