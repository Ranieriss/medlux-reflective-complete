<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  console.log('🚀 MEDLUX Reflective iniciado')
})
</script>

<style>
/* Estilos globais já importados no main.js */
</style>
