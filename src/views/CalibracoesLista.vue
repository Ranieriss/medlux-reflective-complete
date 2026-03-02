<template>
  <v-container
    fluid
    class="pa-6"
  >
    <!-- Cabeçalho -->
    <v-row
      align="center"
      class="mb-6"
    >
      <v-col
        cols="12"
        md="6"
      >
        <h1 class="text-h4 font-weight-bold text-main">
          <v-icon
            size="36"
            color="primary"
            class="mr-3"
          >
            mdi-chart-line
          </v-icon>
          Medições de Retrorrefletância
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-2">
          Registre e valide medições conforme normas ABNT
        </p>
      </v-col>
      <v-col
        cols="12"
        md="6"
        class="text-right"
      >
        <v-btn
          color="success"
          size="large"
          prepend-icon="mdi-plus-circle"
          class="mr-2"
          @click="abrirDialogNovo"
        >
          Nova Medição
        </v-btn>
        <v-btn
          color="primary"
          variant="outlined"
          size="large"
          prepend-icon="mdi-file-chart"
          @click="abrirRelatorioDashboard"
        >
          Relatórios
        </v-btn>
      </v-col>
    </v-row>

    <!-- Dashboard de Status -->
    <v-row class="mb-6">
      <v-col
        cols="12"
        md="3"
      >
        <v-card
          class="dashboard-card card-em-dia"
          elevation="2"
        >
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">
                  Em Dia
                </p>
                <h2 class="text-h3 font-weight-bold">
                  {{ stats.em_dia || 0 }}
                </h2>
              </div>
              <v-icon
                size="60"
                color="success"
                class="opacity-30"
              >
                mdi-check-circle
              </v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="3"
      >
        <v-card
          class="dashboard-card card-atencao"
          elevation="2"
        >
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">
                  Atenção (30 dias)
                </p>
                <h2 class="text-h3 font-weight-bold">
                  {{ stats.atencao || 0 }}
                </h2>
              </div>
              <v-icon
                size="60"
                color="warning"
                class="opacity-30"
              >
                mdi-alert
              </v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="3"
      >
        <v-card
          class="dashboard-card card-vencida"
          elevation="2"
        >
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">
                  Vencidas
                </p>
                <h2 class="text-h3 font-weight-bold">
                  {{ stats.vencidas || 0 }}
                </h2>
              </div>
              <v-icon
                size="60"
                color="error"
                class="opacity-30"
              >
                mdi-close-circle
              </v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="3"
      >
        <v-card
          class="dashboard-card card-aprovacao"
          elevation="2"
        >
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">
                  Taxa de Aprovação
                </p>
                <h2 class="text-h3 font-weight-bold">
                  {{ stats.media_aprovacao || 0 }}%
                </h2>
              </div>
              <v-icon
                size="60"
                color="info"
                class="opacity-30"
              >
                mdi-chart-pie
              </v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card
      class="mb-6"
      elevation="2"
    >
      <v-card-text>
        <v-row>
          <v-col
            cols="12"
            md="3"
          >
            <v-text-field
              v-model="filtros.busca"
              prepend-inner-icon="mdi-magnify"
              label="Buscar equipamento"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <v-col
            cols="12"
            md="2"
          >
            <v-select
              v-model="filtros.status"
              :items="statusOptions"
              label="Status Vencimento"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <v-col
            cols="12"
            md="2"
          >
            <v-select
              v-model="filtros.validacao"
              :items="validacaoOptions"
              label="Validação"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <v-col
            cols="12"
            md="2"
          >
            <v-select
              v-model="filtros.tipo"
              :items="tipoEquipamentoOptions"
              label="Tipo Equipamento"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <v-col
            cols="12"
            md="3"
          >
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-filter"
              @click="aplicarFiltros"
            >
              Filtrar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabela de Medições -->
    <v-card elevation="2">
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="medicoesFiltradas"
          :loading="loading"
          :items-per-page="10"
          class="elevation-0"
        >
          <!-- Código do Equipamento -->
          <template v-slot:item.equipamento_codigo="{ item }">
            <div class="d-flex align-center">
              <v-chip
                size="small"
                color="primary"
                variant="outlined"
                class="mr-2"
              >
                {{ item.equipamento_codigo }}
              </v-chip>
              <span class="text-caption">{{ item.equipamento_nome }}</span>
            </div>
          </template>

          <!-- Data da Calibração -->
          <template v-slot:item.data_calibracao="{ item }">
            {{ formatarData(item.data_calibracao) }}
          </template>

          <!-- Próxima Calibração -->
          <template v-slot:item.proxima_calibracao="{ item }">
            <div v-if="item.proxima_calibracao">
              {{ formatarData(item.proxima_calibracao) }}
              <v-chip
                size="x-small"
                :color="getStatusColor(item.status_vencimento)"
                class="ml-2"
              >
                {{ item.dias_vencimento > 0 ? "+" : ""
                }}{{ item.dias_vencimento }} dias
              </v-chip>
            </div>
            <span
              v-else
              class="text-medium-emphasis"
            >-</span>
          </template>

          <!-- Status Vencimento -->
          <template v-slot:item.status_vencimento="{ item }">
            <v-chip
              :color="getStatusColor(item.status_vencimento)"
              size="small"
              :prepend-icon="getStatusIcon(item.status_vencimento)"
            >
              {{ getStatusLabel(item.status_vencimento) }}
            </v-chip>
          </template>

          <!-- Status Validação -->
          <template v-slot:item.status_validacao="{ item }">
            <v-chip
              v-if="item.status_validacao"
              :color="getValidacaoColor(item.status_validacao)"
              size="small"
              :prepend-icon="getValidacaoIcon(item.status_validacao)"
            >
              {{ item.status_validacao }}
            </v-chip>
            <span
              v-else
              class="text-medium-emphasis"
            >-</span>
          </template>

          <!-- Valores -->
          <template v-slot:item.valor_medio="{ item }">
            <div v-if="item.valor_medio">
              <strong>{{ item.valor_medio }}</strong>
              <v-tooltip
                activator="parent"
                location="top"
              >
                Referência: {{ item.valor_minimo_referencia }}<br />
                Aprovação: {{ item.percentual_aprovacao }}%
              </v-tooltip>
            </div>
            <span
              v-else
              class="text-medium-emphasis"
            >-</span>
          </template>

          <!-- Ações -->
          <template v-slot:item.acoes="{ item }">
            <v-btn
              icon="mdi-file-pdf-box"
              size="small"
              color="error"
              variant="text"
              @click="gerarLaudoPDF(item)"
            >
              <v-icon>mdi-file-pdf-box</v-icon>
              <v-tooltip
                activator="parent"
                location="top"
              >
                Gerar Laudo PDF (ICDVias)
              </v-tooltip>
            </v-btn>

            <v-btn
              icon="mdi-eye"
              size="small"
              color="info"
              variant="text"
              @click="visualizarDetalhes(item)"
            >
              <v-icon>mdi-eye</v-icon>
              <v-tooltip
                activator="parent"
                location="top"
              >
                Ver Detalhes
              </v-tooltip>
            </v-btn>

            <v-btn
              icon="mdi-pencil"
              size="small"
              color="primary"
              variant="text"
              @click="editarMedicao(item)"
            >
              <v-icon>mdi-pencil</v-icon>
              <v-tooltip
                activator="parent"
                location="top"
              >
                Editar
              </v-tooltip>
            </v-btn>

            <v-btn
              icon="mdi-delete"
              size="small"
              color="error"
              variant="text"
              @click="confirmarExclusao(item)"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip
                activator="parent"
                location="top"
              >
                Excluir
              </v-tooltip>
            </v-btn>
          </template>

          <!-- Loading -->
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10" />
          </template>

          <!-- Sem dados -->
          <template v-slot:no-data>
            <div class="text-center py-12">
              <v-icon
                size="64"
                color="grey-lighten-2"
              >
                mdi-chart-line-variant
              </v-icon>
              <p class="text-h6 mt-4 text-medium-emphasis">
                Nenhuma medição encontrada
              </p>
              <v-btn
                color="primary"
                class="mt-4"
                @click="abrirDialogNovo"
              >
                Criar primeira medição
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog: Nova/Editar Medição -->
    <v-dialog
      v-model="dialogMedicao"
      max-width="1000px"
      persistent
      scrollable
    >
      <v-card>
        <v-card-title class="bg-primary">
          <span class="text-h5 text-white">
            <v-icon
              color="white"
              class="mr-2"
            >mdi-clipboard-text</v-icon>
            {{
              modoEdicao
                ? "Editar Medição"
                : "Nova Medição de Retrorrefletância"
            }}
          </span>
        </v-card-title>

        <v-divider />

        <v-card-text
          class="pt-6"
          style="max-height: 600px"
        >
          <!-- Alerta quando não há equipamentos -->
          <v-alert
            v-if="equipamentos.length === 0"
            type="warning"
            variant="tonal"
            prominent
            class="mb-4"
          >
            <v-row align="center">
              <v-col cols="12">
                <div class="text-h6 mb-2">
                  <v-icon>mdi-alert</v-icon>
                  Nenhum Equipamento Disponível
                </div>
                <p class="mb-0">
                  Não há equipamentos cadastrados no sistema. Por favor, contate
                  o administrador para cadastrar equipamentos antes de criar
                  medições.
                </p>
              </v-col>
            </v-row>
          </v-alert>

          <v-form
            ref="formMedicao"
            v-model="formValido"
            :disabled="equipamentos.length === 0"
          >
            <v-row>
              <!-- Equipamento -->
              <v-col cols="12">
                <v-autocomplete
                  v-model="formMedicaoData.equipamento_id"
                  :items="equipamentos"
                  item-title="nome_completo"
                  item-value="id"
                  label="Equipamento *"
                  prepend-inner-icon="mdi-devices"
                  variant="outlined"
                  :rules="[rules.required]"
                  :loading="loadingEquipamentos"
                  :disabled="authStore.isOperador && equipamentos.length === 1"
                  clearable
                  @update:model-value="onEquipamentoChange"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon
                          :icon="
                            item.raw.tipoDetalhado?.icon || 'mdi-speedometer'
                          "
                        />
                      </template>
                      <template v-slot:title>
                        <v-chip
                          size="small"
                          color="primary"
                          class="mr-2"
                        >
                          {{
                            item.raw.codigo
                          }}
                        </v-chip>
                        {{ item.raw.nome }}
                      </template>
                      <template v-slot:subtitle>
                        {{ item.raw.tipoDetalhado?.descricao || item.raw.tipo }}
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>

                <!-- Informações do Equipamento Detectado -->
                <v-alert
                  v-if="tipoEquipamentoDetectado"
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mt-2"
                >
                  <v-row
                    dense
                    align="center"
                  >
                    <v-col cols="auto">
                      <v-icon :icon="tipoEquipamentoDetectado.icon" />
                    </v-col>
                    <v-col>
                      <strong>{{ tipoEquipamentoDetectado.descricao }}</strong><br />
                      <small>
                        Geometria{{
                          tipoEquipamentoDetectado.geometrias.length > 1
                            ? "s"
                            : ""
                        }}:
                        {{ tipoEquipamentoDetectado.geometrias.join(", ") }}
                        • Medições recomendadas:
                        {{ tipoEquipamentoDetectado.quantidadeMedicoes }}
                        <span v-if="tipoEquipamentoDetectado.simuladorChuva">
                          •
                          <v-icon size="small">mdi-weather-rainy</v-icon>
                          Simulador de Chuva
                        </span>
                      </small>
                    </v-col>
                  </v-row>
                </v-alert>
              </v-col>

              <!-- Dados da Medição -->
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="formMedicaoData.data_calibracao"
                  label="Data da Medição *"
                  type="date"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="formMedicaoData.proxima_calibracao"
                  label="Próxima Medição *"
                  type="date"
                  prepend-inner-icon="mdi-calendar-clock"
                  variant="outlined"
                  :rules="[rules.required]"
                  hint="Sugestão: 12 meses após a medição"
                />
              </v-col>

              <v-col
                v-if="mostrarCamposMaterial"
                cols="12"
                md="4"
              >
                <v-select
                  v-model="formMedicaoData.tipo_sinalizacao"
                  :items="tipoSinalizacaoOptions"
                  label="Tipo de sinalização *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col
                v-if="
                  mostrarCamposMaterial &&
                    formMedicaoData.tipo_sinalizacao === 'Outro...'
                "
                cols="12"
                md="4"
              >
                <v-text-field
                  v-model="formMedicaoData.tipo_sinalizacao_outro"
                  label="Descreva o tipo de sinalização *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col
                v-if="mostrarCamposMaterial"
                cols="12"
                md="4"
              >
                <v-select
                  v-model="formMedicaoData.tipo_material"
                  :items="tipoMaterialHorizontalOptions"
                  label="Tipo de material horizontal *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col
                v-if="
                  mostrarCamposMaterial &&
                    formMedicaoData.tipo_material === 'Outro...'
                "
                cols="12"
                md="4"
              >
                <v-text-field
                  v-model="formMedicaoData.tipo_material_outro"
                  label="Descreva o material *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col
                v-if="mostrarCamposMaterial"
                cols="12"
                md="4"
              >
                <v-select
                  v-model="formMedicaoData.momento_medicao"
                  :items="momentoOptions"
                  label="Momento *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col
                v-if="mostrarCamposPelicula"
                cols="12"
                md="4"
              >
                <v-select
                  v-model="formMedicaoData.modo_medicao_vertical"
                  :items="[
                    { title: 'Ângulo único', value: 'angulo-unico' },
                    { title: 'Multiângulo', value: 'multi-angulo' },
                  ]"
                  label="Modo de medição *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col
                v-if="mostrarCamposPelicula"
                cols="12"
                md="4"
              >
                <v-select
                  v-model="formMedicaoData.classe_pelicula"
                  :items="classePeliculaOptions"
                  label="Classe da película *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col
                v-if="mostrarCamposPelicula"
                cols="12"
                md="4"
              >
                <v-select
                  v-model="formMedicaoData.tipo_pelicula"
                  :items="tipoPeliculaOptions"
                  item-title="title"
                  item-value="value"
                  label="Tipo da película *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col
                v-if="mostrarCamposPelicula"
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="formMedicaoData.marca_pelicula"
                  label="Marca da película *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col
                v-if="mostrarCamposPelicula"
                cols="12"
                md="3"
              >
                <v-select
                  v-model="formMedicaoData.angulo_observacao"
                  :items="anguloObservacaoOptions"
                  label="Ângulo observação *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col
                v-if="mostrarCamposPelicula"
                cols="12"
                md="3"
              >
                <v-select
                  v-model="formMedicaoData.angulo_entrada"
                  :items="anguloEntradaOptions"
                  label="Ângulo entrada *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col
                v-if="mostrarCamposDispositivos"
                cols="12"
                md="4"
              >
                <v-select
                  v-model="formMedicaoData.dispositivo"
                  :items="dispositivoOptions"
                  label="Dispositivo *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col
                v-if="mostrarCamposDispositivos"
                cols="12"
                md="4"
              >
                <v-select
                  v-model="formMedicaoData.tipo_refletivo"
                  :items="tipoRefletivoOptions"
                  label="Tipo refletivo *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col
                v-if="mostrarCamposDispositivos"
                cols="12"
                md="4"
              >
                <v-select
                  v-model="formMedicaoData.direcionalidade"
                  :items="direcionalidadeOptions"
                  label="Direcionalidade"
                  variant="outlined"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-select
                  v-model="formMedicaoData.cor_medicao"
                  :items="corOptions"
                  label="Cor *"
                  prepend-inner-icon="mdi-palette"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>

              <!-- Geometria -->
              <v-col
                cols="12"
                md="6"
              >
                <v-select
                  v-model="formMedicaoData.geometria_medicao"
                  :items="geometriasDisponiveis"
                  item-title="title"
                  item-value="value"
                  label="Geometria de Medição *"
                  prepend-inner-icon="mdi-angle-acute"
                  variant="outlined"
                  :rules="[rules.required]"
                  hint="Geometrias disponíveis conforme tipo de equipamento e norma"
                  persistent-hint
                />
              </v-col>

              <!-- Técnico Responsável -->
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="formMedicaoData.tecnico_responsavel"
                  label="Técnico Responsável *"
                  prepend-inner-icon="mdi-account-hard-hat"
                  variant="outlined"
                  :rules="[rules.required]"
                  :readonly="authStore.isOperador"
                  hint="Nome do operador responsável pela medição"
                />
              </v-col>

              <!-- Condições Ambientais (opcional para chuva) -->
              <v-col
                v-if="mostrarSimuladorChuva"
                cols="12"
                md="6"
              >
                <v-select
                  v-model="formMedicaoData.condicoes_medicao"
                  :items="['Seco', 'Simulador de Chuva']"
                  label="Condições de Medição"
                  prepend-inner-icon="mdi-weather-rainy"
                  variant="outlined"
                  hint="Equipamento com simulador de chuva"
                />
              </v-col>

              <!-- Valores de Medição -->
              <v-col cols="12">
                <v-card
                  variant="outlined"
                  class="pa-4"
                >
                  <v-card-title class="text-subtitle-1 pb-3">
                    <v-icon class="mr-2">
                      mdi-numeric
                    </v-icon>
                    Valores Medidos (cd/(lx·m²) ou mcd/lx)
                  </v-card-title>
                  <v-row>
                    <v-col
                      v-for="(valor, index) in formMedicaoData.valores_medicoes"
                      :key="index"
                      cols="6"
                      md="3"
                    >
                      <v-text-field
                        v-model.number="formMedicaoData.valores_medicoes[index]"
                        :label="`Medição ${index + 1}`"
                        type="number"
                        step="0.01"
                        variant="outlined"
                        density="compact"
                        :rules="[rules.required, rules.numeric]"
                      >
                        <template v-slot:append-inner>
                          <v-btn
                            v-if="formMedicaoData.valores_medicoes.length > 1"
                            icon="mdi-delete"
                            size="x-small"
                            color="error"
                            variant="text"
                            @click="removerMedicao(index)"
                          />
                        </template>
                      </v-text-field>
                    </v-col>

                    <v-col
                      cols="12"
                      class="text-center"
                    >
                      <v-btn
                        color="primary"
                        variant="outlined"
                        prepend-icon="mdi-plus"
                        :disabled="
                          formMedicaoData.valores_medicoes.length >= 10
                        "
                        @click="adicionarMedicao"
                      >
                        Adicionar Medição
                      </v-btn>
                      <span class="text-caption text-medium-emphasis ml-4">
                        {{ formMedicaoData.valores_medicoes.length }} / 10
                        medições
                      </span>
                    </v-col>
                  </v-row>
                </v-card>
              </v-col>

              <!-- Condições Ambientais -->
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model.number="formMedicaoData.temperatura_ambiente"
                  label="Temperatura (°C)"
                  type="number"
                  step="0.1"
                  prepend-inner-icon="mdi-thermometer"
                  variant="outlined"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model.number="formMedicaoData.umidade_relativa"
                  label="Umidade Relativa (%)"
                  type="number"
                  step="0.1"
                  prepend-inner-icon="mdi-water-percent"
                  variant="outlined"
                />
              </v-col>

              <v-col
                cols="12"
                md="4"
              >
                <v-select
                  v-model="formMedicaoData.modo_localizacao"
                  :items="[
                    { title: 'GPS automático', value: 'gps' },
                    { title: 'Manual', value: 'manual' },
                  ]"
                  label="Modo de Localização *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col
                v-if="formMedicaoData.modo_localizacao === 'gps'"
                cols="12"
                md="4"
              >
                <v-btn
                  block
                  color="info"
                  variant="outlined"
                  prepend-icon="mdi-crosshairs-gps"
                  @click="capturarGPS"
                >
                  Capturar GPS automático
                </v-btn>
              </v-col>
              <v-col
                v-if="formMedicaoData.modo_localizacao === 'gps'"
                cols="12"
                md="8"
              >
                <div class="text-caption">
                  Latitude: {{ formMedicaoData.latitude || "-" }} • Longitude:
                  {{ formMedicaoData.longitude || "-" }} • Precisão:
                  {{
                    formMedicaoData.precisao_gps
                      ? `${Math.round(formMedicaoData.precisao_gps)}m`
                      : "-"
                  }}
                </div>
              </v-col>

              <template v-if="formMedicaoData.modo_localizacao === 'manual'">
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-text-field
                    v-model="formMedicaoData.local_rodovia"
                    label="Rodovia *"
                    variant="outlined"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="2"
                >
                  <v-text-field
                    v-model="formMedicaoData.local_km"
                    label="KM *"
                    variant="outlined"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    v-model="formMedicaoData.local_municipio"
                    label="Município *"
                    variant="outlined"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    v-model="formMedicaoData.local_sentido"
                    label="Sentido *"
                    variant="outlined"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-text-field
                    v-model="formMedicaoData.local_faixa"
                    label="Faixa *"
                    variant="outlined"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="8"
                >
                  <v-text-field
                    v-model="formMedicaoData.local_observacoes"
                    label="Observações da localização"
                    variant="outlined"
                  />
                </v-col>
              </template>

              <v-col cols="12">
                <v-file-input
                  v-model="formMedicaoData.fotos_input"
                  label="Fotos da medição (máx. 3)"
                  prepend-inner-icon="mdi-camera"
                  variant="outlined"
                  accept="image/*"
                  multiple
                  chips
                  show-size
                  :counter="3"
                  :rules="[(v) => !v || v.length <= 3 || 'Máximo 3 fotos']"
                />
              </v-col>

              <!-- Observações -->
              <v-col cols="12">
                <v-textarea
                  v-model="formMedicaoData.observacoes"
                  label="Observações"
                  prepend-inner-icon="mdi-note-text"
                  variant="outlined"
                  rows="3"
                  auto-grow
                />
              </v-col>

              <!-- Resultado da Validação (calculado automaticamente) -->
              <v-col
                v-if="resultadoValidacao"
                cols="12"
              >
                <v-alert
                  :type="
                    resultadoValidacao.status_validacao === 'APROVADO'
                      ? 'success'
                      : 'error'
                  "
                  prominent
                  icon="mdi-check-circle"
                >
                  <v-row align="center">
                    <v-col
                      cols="12"
                      md="3"
                    >
                      <div class="text-h6">
                        {{ resultadoValidacao.status_validacao }}
                      </div>
                    </v-col>
                    <v-col
                      cols="12"
                      md="9"
                    >
                      <div class="text-body-2">
                        <strong>Valor Médio:</strong>
                        {{ resultadoValidacao.valor_medio }} |
                        <strong>Mínimo:</strong>
                        {{ resultadoValidacao.valor_minimo_medido }} |
                        <strong>Máximo:</strong>
                        {{ resultadoValidacao.valor_maximo_medido }} |
                        <strong>Referência ABNT:</strong>
                        {{ resultadoValidacao.valor_minimo_referencia }} |
                        <strong>Taxa Aprovação:</strong>
                        {{ resultadoValidacao.percentual_aprovacao }}%
                      </div>
                    </v-col>
                  </v-row>
                </v-alert>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            color="grey"
            variant="outlined"
            :disabled="salvando"
            @click="fecharDialog"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-calculator"
            :loading="calculando"
            :disabled="!formValido || salvando"
            @click="calcularValidacao"
          >
            Calcular Validação
          </v-btn>
          <v-btn
            color="secondary"
            variant="outlined"
            prepend-icon="mdi-stethoscope"
            @click="gerarDiagnosticoTecnico"
          >
            Gerar Diagnóstico Técnico Completo
          </v-btn>
          <v-btn
            color="success"
            prepend-icon="mdi-content-save"
            :loading="salvando"
            :disabled="!formValido || !resultadoValidacao"
            @click="salvarMedicao"
          >
            Salvar Medição
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogDiagnostico"
      max-width="900px"
      scrollable
    >
      <v-card>
        <v-card-title>Diagnóstico do Sistema</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="diagnosticoJson"
            rows="18"
            auto-grow
            variant="outlined"
            label="JSON do diagnóstico"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            prepend-icon="mdi-content-copy"
            @click="copiarDiagnostico"
          >
            Copiar JSON
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-download"
            @click="baixarDiagnostico"
          >
            Baixar JSON
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de notificações -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Fechar
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import calibracaoService from "@/services/calibracaoService";
import { buscarEquipamentosDoUsuario } from "@/services/equipamentoService";
import { uploadFotosMedicao } from "@/services/uploadService";
import {
  detectEquipmentPrefix,
  GEOMETRY_BY_PREFIX,
  HORIZONTAL_MATERIAL_OPTIONS,
  HORIZONTAL_SIGNAL_TYPES,
  VERTICAL_TYPES,
} from "@/constants/normativeConfig";
import supabase, {
  getCurrentProfile,
  maskSupabaseKey,
  supabaseUrl,
} from "@/services/supabase";
import { useDiagnosticsStore } from "@/stores/diagnostics";

export default {
  name: "CalibracoesLista",

  setup() {
    // Auth store
    const authStore = useAuthStore();
    const diagnosticsStore = useDiagnosticsStore();
    const route = useRoute();

    // Estados
    const loading = ref(false);
    const loadingEquipamentos = ref(false);
    const medicoes = ref([]);
    const equipamentos = ref([]);
    const stats = ref({});
    const equipamentoSelecionado = ref(null);
    const tipoEquipamentoDetectado = ref(null);

    // Dialogs
    const dialogMedicao = ref(false);
    const modoEdicao = ref(false);
    const formValido = ref(false);
    const salvando = ref(false);
    const calculando = ref(false);

    // Resultado da validação
    const resultadoValidacao = ref(null);
    const logsDiagnostico = ref([]);
    const dialogDiagnostico = ref(false);
    const diagnosticoJson = ref("");

    // Formulário
    const formMedicaoInicial = {
      equipamento_id: null,
      data_calibracao: new Date().toISOString().split("T")[0],
      proxima_calibracao: "",
      prefixo_equipamento: null,
      modo_medicao_vertical: "angulo-unico",
      tipo_sinalizacao: null,
      tipo_sinalizacao_outro: "",
      metodo_coleta: "",
      classe_pelicula: null,
      tipo_pelicula: null,
      marca_pelicula: "",
      momento_medicao: "INICIAL",
      angulo_observacao: null,
      angulo_entrada: null,
      dispositivo: null,
      tipo_refletivo: null,
      direcionalidade: null,
      tipo_material: null,
      tipo_material_outro: "",
      cor_medicao: null,
      geometria_medicao: null,
      modo_localizacao: "gps",
      latitude: null,
      longitude: null,
      precisao_gps: null,
      local_rodovia: "",
      local_km: "",
      local_municipio: "",
      local_sentido: "",
      local_faixa: "",
      local_observacoes: "",
      fotos_input: [],
      fotos_medicao: [],
      valores_medicoes: [0, 0, 0, 0, 0],
      tecnico_responsavel: "",
      temperatura_ambiente: null,
      umidade_relativa: null,
      observacoes: "",
    };
    const formMedicaoData = ref({ ...formMedicaoInicial });

    // Filtros
    const filtros = ref({
      busca: "",
      status: null,
      validacao: null,
      tipo: null,
    });

    // Snackbar
    const snackbar = ref({
      show: false,
      text: "",
      color: "success",
    });

    // Opções de Select
    const statusOptions = [
      { title: "Em Dia", value: "EM_DIA" },
      { title: "Atenção (30 dias)", value: "ATENCAO" },
      { title: "Vencida", value: "VENCIDA" },
      { title: "Sem Medição", value: "SEM_CALIBRACAO" },
    ];

    const validacaoOptions = [
      { title: "Aprovado", value: "APROVADO" },
      { title: "Reprovado", value: "REPROVADO" },
      { title: "Indeterminado", value: "INDETERMINADO" },
    ];

    const tipoEquipamentoOptions = [
      { title: "Vertical (Placas)", value: "vertical" },
      { title: "Horizontal (Tintas)", value: "horizontal" },
      { title: "Tachas", value: "tachas" },
      { title: "Tachões", value: "tachoes" },
    ];

    const tipoPeliculaOptions = VERTICAL_TYPES;
    const classePeliculaOptions = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
    ];
    const momentoOptions = ["INICIAL", "RESIDUAL"];
    const anguloObservacaoOptions = ["0,2°", "0,5°", "1,0°"];
    const anguloEntradaOptions = ["-4°", "+30°"];
    const dispositivoOptions = ["TACHA", "TACHAO"];
    const tipoRefletivoOptions = ["I", "II", "III"];
    const direcionalidadeOptions = ["BIDIRECIONAL", "MONODIRECIONAL"];
    const tipoSinalizacaoOptions = HORIZONTAL_SIGNAL_TYPES;
    const tipoMaterialHorizontalOptions = HORIZONTAL_MATERIAL_OPTIONS;

    const corOptions = [
      "Branco",
      "Amarelo",
      "Vermelho",
      "Verde",
      "Azul",
      "Marrom",
    ];

    // Headers da tabela
    const headers = [
      { title: "Equipamento", key: "equipamento_codigo", sortable: true },
      { title: "Tipo", key: "equipamento_tipo", sortable: true },
      { title: "Data Medição", key: "data_calibracao", sortable: true },
      { title: "Próxima Medição", key: "proxima_calibracao", sortable: true },
      { title: "Status", key: "status_vencimento", sortable: true },
      { title: "Validação", key: "status_validacao", sortable: true },
      { title: "Valor Médio", key: "valor_medio", sortable: true },
      { title: "Ações", key: "acoes", sortable: false, align: "center" },
    ];

    // Regras de validação
    const rules = {
      required: (value) => !!value || "Campo obrigatório",
      numeric: (value) => !isNaN(value) || "Deve ser um número válido",
    };

    // Métodos
    const carregarMedicoes = async () => {
      loading.value = true;
      try {
        // Passar dados do usuário para filtrar medições por operador
        const usuario = authStore.usuario;
        const response = await calibracaoService.listarCalibracoes(
          filtros.value,
          usuario,
        );
        medicoes.value = response;
        console.log(
          `✅ ${medicoes.value.length} medições carregadas para ${usuario?.perfil || "desconhecido"}`,
        );
      } catch (error) {
        mostrarNotificacao(
          "Erro ao carregar medições: " + error.message,
          "error",
        );
      } finally {
        loading.value = false;
      }
    };

    const carregarStats = async () => {
      try {
        const usuario = authStore.usuario;
        const response = await calibracaoService.obterEstatisticas(usuario);
        stats.value = response;
        console.log("✅ Estatísticas carregadas:", response);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    const garantirUsuarioAutenticado = async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.user?.id) {
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }

      const profileResult = await getCurrentProfile();
      if (!profileResult.success || !profileResult.data) {
        throw new Error(
          profileResult.error || "Perfil de usuário não encontrado.",
        );
      }

      authStore.usuario = profileResult.data;
      return profileResult.data;
    };

    const carregarEquipamentos = async () => {
      loadingEquipamentos.value = true;
      try {
        let usuario = authStore.usuario;

        if (!usuario?.id) {
          console.log(
            "🔄 Usuário ausente no store, carregando sessão/perfil...",
          );
          usuario = await garantirUsuarioAutenticado();
        }

        console.log("👤 Carregando equipamentos para:", {
          id: usuario.id,
          perfil: usuario.perfil,
          nome: usuario.nome,
        });

        const response = await buscarEquipamentosDoUsuario(
          usuario.id,
          usuario.perfil,
        );

        console.log(
          "📦 Resposta do servidor:",
          response?.length || 0,
          "equipamentos",
        );

        if (!response || response.length === 0) {
          console.warn("⚠️ Nenhum equipamento encontrado no banco");
          equipamentos.value = [];
          // Não mostrar notificação aqui, pois é normal não ter medições ainda
          return;
        }

        equipamentos.value = response.map((eq) => ({
          ...eq,
          nome_completo: `${eq.codigo} - ${eq.nome}`,
          descricao_tipo: eq.tipoDetalhado?.descricao || eq.nome,
        }));

        console.log(
          `✅ ${equipamentos.value.length} equipamentos carregados com sucesso`,
        );

        // Se for operador com apenas 1 equipamento, selecionar automaticamente
        if (authStore.isOperador && equipamentos.value.length === 1) {
          formMedicaoData.value.equipamento_id = equipamentos.value[0].id;
          await onEquipamentoChange(equipamentos.value[0].id);
          console.log("✅ Equipamento auto-selecionado para operador");
        }
      } catch (error) {
        console.error("❌ Erro ao carregar equipamentos:", error);
        mostrarNotificacao(
          "Erro ao carregar equipamentos: " + error.message,
          "error",
        );
        equipamentos.value = [];
      } finally {
        loadingEquipamentos.value = false;
      }
    };
    // Watch para mudanças no equipamento selecionado
    const onEquipamentoChange = async (equipamentoId) => {
      if (!equipamentoId) return;

      const equip = equipamentos.value.find((e) => e.id === equipamentoId);
      if (!equip) return;

      equipamentoSelecionado.value = equip;
      const prefixo = detectEquipmentPrefix(equip.codigo);
      formMedicaoData.value.prefixo_equipamento = prefixo;

      tipoEquipamentoDetectado.value = {
        icon:
          prefixo === "RH"
            ? "mdi-road-variant"
            : prefixo === "RV"
              ? "mdi-sign-direction"
              : "mdi-reflect-horizontal",
        descricao:
          prefixo === "RH"
            ? "RH — Retrorrefletância Horizontal"
            : prefixo === "RV"
              ? "RV — Retrorrefletância Vertical"
              : "RT — Tachas e Tachões",
        geometrias:
          prefixo === "RH"
            ? GEOMETRY_BY_PREFIX.RH.map((g) => g.value)
            : prefixo === "RV"
              ? GEOMETRY_BY_PREFIX.RV_MULTI.map((g) => g.value)
              : GEOMETRY_BY_PREFIX.RT.map((g) => g.value),
        quantidadeMedicoes: 5,
        simuladorChuva: false,
      };

      formMedicaoData.value.valores_medicoes = Array(5).fill(0);
      formMedicaoData.value.tecnico_responsavel = authStore.nomeUsuario;

      if (prefixo === "RH") {
        formMedicaoData.value.geometria_medicao =
          GEOMETRY_BY_PREFIX.RH[0].value;
        formMedicaoData.value.momento_medicao = "INICIAL";
      }
      if (prefixo === "RV") {
        formMedicaoData.value.geometria_medicao =
          GEOMETRY_BY_PREFIX.RV_SINGLE[0].value;
        formMedicaoData.value.angulo_observacao = "0,2°";
        formMedicaoData.value.angulo_entrada = "-4°";
      }
      if (prefixo === "RT") {
        formMedicaoData.value.geometria_medicao =
          GEOMETRY_BY_PREFIX.RT[0].value;
        formMedicaoData.value.dispositivo = "TACHA";
        formMedicaoData.value.tipo_refletivo = "I";
      }
    };

    const geometriasDisponiveis = computed(() => {
      const prefixo = formMedicaoData.value.prefixo_equipamento;
      if (prefixo === "RH") return GEOMETRY_BY_PREFIX.RH;
      if (prefixo === "RV") {
        return formMedicaoData.value.modo_medicao_vertical === "multi-angulo"
          ? GEOMETRY_BY_PREFIX.RV_MULTI
          : GEOMETRY_BY_PREFIX.RV_SINGLE;
      }
      if (prefixo === "RT") return GEOMETRY_BY_PREFIX.RT;
      return [];
    });

    const tipoMedicao = computed(
      () => formMedicaoData.value.prefixo_equipamento,
    );

    const mostrarCamposPelicula = computed(() => tipoMedicao.value === "RV");

    const mostrarCamposMaterial = computed(() => tipoMedicao.value === "RH");

    const mostrarCamposDispositivos = computed(
      () => tipoMedicao.value === "RT",
    );

    const mostrarSimuladorChuva = computed(() => false);

    // Filtrar medições baseado nos filtros selecionados
    const medicoesFiltradas = computed(() => {
      let resultado = medicoes.value;

      // Filtro de busca (código ou nome do equipamento)
      if (filtros.value.busca && filtros.value.busca.trim()) {
        const termo = filtros.value.busca.toLowerCase();
        resultado = resultado.filter(
          (m) =>
            (m.equipamento_codigo &&
              m.equipamento_codigo.toLowerCase().includes(termo)) ||
            (m.equipamento_nome &&
              m.equipamento_nome.toLowerCase().includes(termo)),
        );
      }

      // Filtro de status
      if (filtros.value.status && filtros.value.status !== "todos") {
        resultado = resultado.filter(
          (m) => m.status_vencimento === filtros.value.status,
        );
      }

      // Filtro de validação
      if (filtros.value.validacao && filtros.value.validacao !== "todos") {
        resultado = resultado.filter(
          (m) => m.status_validacao === filtros.value.validacao,
        );
      }

      // Filtro de tipo
      if (filtros.value.tipo && filtros.value.tipo !== "todos") {
        resultado = resultado.filter(
          (m) => m.equipamento_tipo === filtros.value.tipo,
        );
      }

      console.log(
        `🔍 Medições filtradas: ${resultado.length} de ${medicoes.value.length}`,
      );
      return resultado;
    });

    const abrirDialogNovo = async () => {
      console.log("🔵 Abrindo dialog de nova medição...");

      // Reset de estado
      modoEdicao.value = false;
      formMedicaoData.value = { ...formMedicaoInicial };
      resultadoValidacao.value = null;

      // Preencher técnico responsável automaticamente
      formMedicaoData.value.tecnico_responsavel = authStore.nomeUsuario;

      // Calcular próxima calibração (12 meses)
      const hoje = new Date();
      const proxima = new Date(hoje.setFullYear(hoje.getFullYear() + 1));
      formMedicaoData.value.proxima_calibracao = proxima
        .toISOString()
        .split("T")[0];

      console.log("📅 Data de calibração definida:", {
        hoje: formMedicaoData.value.data_calibracao,
        proxima: formMedicaoData.value.proxima_calibracao,
      });

      // Carregar equipamentos antes de abrir o dialog
      console.log("⏳ Carregando equipamentos antes de abrir dialog...");
      await carregarEquipamentos();

      console.log(`📊 ${equipamentos.value.length} equipamentos disponíveis`);

      // Se operador com 1 equipamento, selecionar automaticamente
      if (authStore.isOperador && equipamentos.value.length === 1) {
        console.log("🎯 Operador com 1 equipamento - seleção automática");
        formMedicaoData.value.equipamento_id = equipamentos.value[0].id;
        await onEquipamentoChange(equipamentos.value[0].id);
        console.log(
          "✅ Equipamento auto-selecionado:",
          equipamentos.value[0].codigo,
        );
      }

      // Sempre abrir o dialog, mesmo sem equipamentos
      // O formulário mostrará um aviso apropriado
      dialogMedicao.value = true;
      console.log("✅ Dialog aberto com sucesso!");
    };

    const fecharDialog = () => {
      dialogMedicao.value = false;
      formMedicaoData.value = { ...formMedicaoInicial };
      resultadoValidacao.value = null;
    };

    const adicionarMedicao = () => {
      if (formMedicaoData.value.valores_medicoes.length < 10) {
        formMedicaoData.value.valores_medicoes.push(0);
      }
    };

    const removerMedicao = (index) => {
      formMedicaoData.value.valores_medicoes.splice(index, 1);
    };

    const capturarGPS = async () => {
      if (!navigator.geolocation) {
        mostrarNotificacao(
          "Geolocalização não suportada neste dispositivo.",
          "warning",
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          formMedicaoData.value.latitude = position.coords.latitude;
          formMedicaoData.value.longitude = position.coords.longitude;
          formMedicaoData.value.precisao_gps = position.coords.accuracy;
          mostrarNotificacao("GPS capturado com sucesso.", "success");
        },
        (error) =>
          mostrarNotificacao(`Falha no GPS: ${error.message}`, "warning"),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    };

    const calcularValidacao = async () => {
      calculando.value = true;
      logsDiagnostico.value = [];
      try {
        const equipamento = equipamentos.value.find(
          (eq) => eq.id === formMedicaoData.value.equipamento_id,
        );
        if (!equipamento) throw new Error("Selecione um equipamento");

        if (formMedicaoData.value.prefixo_equipamento === "RH") {
          formMedicaoData.value.metodo_coleta = [
            "Marca longitudinal",
            "Linha de bordo",
            "Eixo",
          ].includes(formMedicaoData.value.tipo_sinalizacao)
            ? "Método por extensão da pintura"
            : ["Legenda", "Pictograma"].includes(
                  formMedicaoData.value.tipo_sinalizacao,
                )
              ? "Método por área/pontos distribuídos"
              : "Método técnico padrão horizontal";
        }

        diagnosticsStore.pushRequest({
          service: "calcularValidacao",
          payload: {
            prefixo: formMedicaoData.value.prefixo_equipamento,
            geometria: formMedicaoData.value.geometria_medicao,
          },
        });

        const resultado = await calibracaoService.calcularValidacao({
          tipo_equipamento: equipamento.tipo,
          prefixo_equipamento: formMedicaoData.value.prefixo_equipamento,
          tipo_sinalizacao: formMedicaoData.value.tipo_sinalizacao,
          tipo_material:
            formMedicaoData.value.tipo_material === "Outro..."
              ? formMedicaoData.value.tipo_material_outro
              : formMedicaoData.value.tipo_material,
          modo_medicao: formMedicaoData.value.modo_medicao_vertical,
          classe_pelicula: formMedicaoData.value.classe_pelicula,
          angulo_observacao: formMedicaoData.value.angulo_observacao,
          angulo_entrada: formMedicaoData.value.angulo_entrada,
          tipo_pelicula: formMedicaoData.value.tipo_pelicula,
          marca_pelicula: formMedicaoData.value.marca_pelicula,
          momento: formMedicaoData.value.momento_medicao,
          dispositivo: formMedicaoData.value.dispositivo,
          tipo_refletivo: formMedicaoData.value.tipo_refletivo,
          direcionalidade: formMedicaoData.value.direcionalidade,
          cor: formMedicaoData.value.cor_medicao,
          geometria: formMedicaoData.value.geometria_medicao,
          valores_medicoes: formMedicaoData.value.valores_medicoes,
        });

        logsDiagnostico.value.push(
          "Validação executada com sucesso no motor dinâmico.",
        );
        resultadoValidacao.value = {
          ...resultado,
          status_validacao: resultado.status,
        };

        if (resultado.criterio_nao_encontrado) {
          mostrarNotificacao(
            "Critério normativo não cadastrado para esta combinação. Solicite cadastro na tabela de normas.",
            "warning",
          );
        } else {
          mostrarNotificacao("Validação calculada com sucesso!", "success");
        }
      } catch (error) {
        logsDiagnostico.value.push(`Falha de validação: ${error.message}`);
        mostrarNotificacao(
          "Erro ao calcular validação: " + error.message,
          "error",
        );
      } finally {
        calculando.value = false;
      }
    };

    const gerarDiagnosticoTecnico = async () => {
      const payload = {
        versao_app: import.meta.env.VITE_APP_VERSION || "dev",
        build_time: import.meta.env.VITE_BUILD_TIME || null,
        commit_hash: import.meta.env.VITE_COMMIT_HASH || "local",
        ambiente: import.meta.env.PROD ? "production" : "preview/local",
        rota_atual: route.fullPath,
        equipamento: equipamentoSelecionado.value?.nome,
        codigo_equipamento: equipamentoSelecionado.value?.codigo,
        prefixo: formMedicaoData.value.prefixo_equipamento,
        geometria: formMedicaoData.value.geometria_medicao,
        tipo_sinalizacao: formMedicaoData.value.tipo_sinalizacao,
        tipo_material: formMedicaoData.value.tipo_material,
        classe_pelicula: formMedicaoData.value.classe_pelicula,
        tipo_pelicula: formMedicaoData.value.tipo_pelicula,
        marca_pelicula: formMedicaoData.value.marca_pelicula,
        parametros_atuais: formMedicaoData.value,
        resultado_validacao: resultadoValidacao.value,
        logs_locais: logsDiagnostico.value,
        ultimos_erros: diagnosticsStore.events,
        ultimas_requests: diagnosticsStore.requests,
        status_supabase: {
          url_mascarada: supabaseUrl
            ? `${new URL(supabaseUrl).origin}/***`
            : "não configurada",
          anon_key_mascarada: maskSupabaseKey(
            import.meta.env.VITE_SUPABASE_ANON_KEY || "",
          ),
          conectado: !!supabase,
        },
        usuario_logado: authStore.usuario,
        timestamp: new Date().toISOString(),
        dispositivo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
      };

      diagnosticoJson.value = JSON.stringify(payload, null, 2);
      dialogDiagnostico.value = true;
      mostrarNotificacao("Diagnóstico completo gerado.", "success");
    };

    const copiarDiagnostico = async () => {
      if (!diagnosticoJson.value) return;
      await navigator.clipboard.writeText(diagnosticoJson.value);
      mostrarNotificacao(
        "JSON copiado para a área de transferência.",
        "success",
      );
    };

    const baixarDiagnostico = () => {
      if (!diagnosticoJson.value) return;
      const blob = new Blob([diagnosticoJson.value], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `diagnostico-tecnico-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    };

    const salvarMedicao = async () => {
      if (!formValido.value || !resultadoValidacao.value) {
        mostrarNotificacao(
          "Preencha todos os campos e calcule a validação",
          "warning",
        );
        return;
      }

      salvando.value = true;
      try {
        let fotosUpload = [];
        if (formMedicaoData.value.fotos_input?.length) {
          fotosUpload = await uploadFotosMedicao(
            formMedicaoData.value.fotos_input,
            {
              tipoEquipamento:
                formMedicaoData.value.prefixo_equipamento || "SEM_PREFIXO",
              equipamentoId:
                formMedicaoData.value.equipamento_id || "SEM_EQUIPAMENTO",
              medicaoId: `medicao-${Date.now()}`,
            },
          );
        }

        const dados = {
          ...formMedicaoData.value,
          ...resultadoValidacao.value,
          fotos_medicao: fotosUpload,
        };

        diagnosticsStore.pushRequest({
          service: "registrarCalibracao",
          payload: { equipamento_id: dados.equipamento_id },
        });
        await calibracaoService.registrarCalibracao(dados);
        mostrarNotificacao("Medição salva com sucesso!", "success");
        fecharDialog();
        carregarMedicoes();
        carregarStats();
      } catch (error) {
        mostrarNotificacao("Erro ao salvar medição: " + error.message, "error");
      } finally {
        salvando.value = false;
      }
    };

    const gerarLaudoPDF = async (item) => {
      try {
        mostrarNotificacao("Gerando laudo em PDF...", "info");
        await calibracaoService.gerarLaudoPDF(item.calibracao_id);
        mostrarNotificacao("Laudo gerado com sucesso!", "success");
      } catch (error) {
        mostrarNotificacao("Erro ao gerar laudo: " + error.message, "error");
      }
    };

    const aplicarFiltros = () => {
      carregarMedicoes();
    };

    const mostrarNotificacao = (text, color = "success") => {
      snackbar.value = { show: true, text, color };
    };

    // Helpers
    const formatarData = (data) => {
      if (!data) return "-";
      return new Date(data).toLocaleDateString("pt-BR");
    };

    const getStatusColor = (status) => {
      const colors = {
        EM_DIA: "success",
        ATENCAO: "warning",
        VENCIDA: "error",
        SEM_CALIBRACAO: "grey",
      };
      return colors[status] || "grey";
    };

    const getStatusIcon = (status) => {
      const icons = {
        EM_DIA: "mdi-check-circle",
        ATENCAO: "mdi-alert",
        VENCIDA: "mdi-close-circle",
        SEM_CALIBRACAO: "mdi-help-circle",
      };
      return icons[status] || "mdi-help-circle";
    };

    const getStatusLabel = (status) => {
      const labels = {
        EM_DIA: "Em Dia",
        ATENCAO: "Atenção",
        VENCIDA: "Vencida",
        SEM_CALIBRACAO: "Sem Medição",
      };
      return labels[status] || status;
    };

    const getValidacaoColor = (validacao) => {
      const colors = {
        APROVADO: "success",
        REPROVADO: "error",
        INDETERMINADO: "warning",
      };
      return colors[validacao] || "grey";
    };

    const getValidacaoIcon = (validacao) => {
      const icons = {
        APROVADO: "mdi-check-circle",
        REPROVADO: "mdi-close-circle",
        INDETERMINADO: "mdi-help-circle",
      };
      return icons[validacao] || "mdi-help-circle";
    };

    // Lifecycle
    onMounted(async () => {
      // Garantir que a sessão está restaurada antes de carregar dados
      if (!authStore.isAuthenticated) {
        console.log("⏳ Aguardando restauração de sessão...");
        await authStore.restaurarSessao();
      }

      console.log("🔄 Iniciando carregamento de dados...");
      await Promise.all([
        carregarMedicoes(),
        carregarStats(),
        carregarEquipamentos(),
      ]);
      console.log("✅ Todos os dados carregados!");
    });

    return {
      // Auth
      authStore,

      // Estados
      loading,
      loadingEquipamentos,
      medicoes,
      medicoesFiltradas,
      equipamentos,
      stats,
      equipamentoSelecionado,
      tipoEquipamentoDetectado,

      // Dialogs
      dialogMedicao,
      modoEdicao,
      formValido,
      salvando,
      calculando,

      // Form
      formMedicaoData: formMedicaoData,
      resultadoValidacao,
      dialogDiagnostico,
      diagnosticoJson,

      // Filtros
      filtros,
      statusOptions,
      validacaoOptions,
      tipoEquipamentoOptions,

      // Opções Dinâmicas
      tipoPeliculaOptions,
      classePeliculaOptions,
      momentoOptions,
      anguloObservacaoOptions,
      anguloEntradaOptions,
      dispositivoOptions,
      tipoRefletivoOptions,
      direcionalidadeOptions,
      tipoSinalizacaoOptions,
      tipoMaterialHorizontalOptions,
      corOptions,
      geometriasDisponiveis,
      tipoMedicao,
      mostrarCamposPelicula,
      mostrarCamposMaterial,
      mostrarCamposDispositivos,
      mostrarSimuladorChuva,

      // Headers
      headers,

      // Regras
      rules,

      // Snackbar
      snackbar,

      // Métodos
      abrirDialogNovo,
      fecharDialog,
      adicionarMedicao,
      removerMedicao,
      calcularValidacao,
      capturarGPS,
      gerarDiagnosticoTecnico,
      copiarDiagnostico,
      baixarDiagnostico,
      salvarMedicao,
      gerarLaudoPDF,
      aplicarFiltros,
      onEquipamentoChange,

      // Helpers
      formatarData,
      getStatusColor,
      getStatusIcon,
      getStatusLabel,
      getValidacaoColor,
      getValidacaoIcon,
    };
  },
};
</script>

<style scoped>
.dashboard-card {
  transition: all 0.3s ease;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.card-em-dia {
  border-left: 4px solid rgb(var(--v-theme-success));
}

.card-atencao {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.card-vencida {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.card-aprovacao {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.opacity-30 {
  opacity: 0.3;
}
</style>
