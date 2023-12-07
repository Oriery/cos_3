<template>
  <v-select density="compact" :items="SUPPORTED_LOCALES.sort((a, b) => a.localeCompare(b))" v-model="currentLocale"></v-select>
</template>

<script setup lang="ts">
import { SUPPORTED_LOCALES, currentLocale } from '@/i18n'

</script>
