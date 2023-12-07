<template>
  <Notivue v-slot="item">
    <Notifications :item="item" />
  </Notivue>

  <header class="flex flex-col align-center gap-2">
    <p class="underline">This text is styled with underline by Tailwind</p>
    <v-btn @click="pushNotify.success({ message: 'Something good has been pushed!', duration: 500 })"
      >Push notification</v-btn
    >
    <LangPicker class="min-w-[10rem]" />

    <nav class="flex flex-row gap-2 justify-center">
      <RouterLink
        v-for="link in links"
        :key="link.name"
        :to="link.path"
        class="text-blue-500 hover:text-blue-700"
      >
        {{ link.name }}
      </RouterLink>
    </nav>
  </header>

  <RouterView class="grow" />
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import LangPicker from './components/LangPicker.vue'
import { Notivue, Notifications } from 'notivue'

const links = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
]
</script>
