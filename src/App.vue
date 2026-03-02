<template>
  <v-app>
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
  </v-app>
</template>

<script setup>
import { onMounted } from "vue";
import ErrorBoundary from "@/components/ErrorBoundary.vue";

onMounted(() => {
  console.log("🚀 MEDLUX Reflective iniciado");
});
</script>

<style>
/* Estilos globais já importados no main.js */
</style>
