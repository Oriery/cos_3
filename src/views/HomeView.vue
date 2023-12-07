<template>
  <main>
    <div class="flex flex-row gap-2">
      <ImageComponent image-path="/apples.png"/>
      <ImageComponent image-path="/apples.png" :image-processor="processors.boxBlur"/>
    </div>
  </main>
</template>

<script setup lang="ts">
import ImageComponent from '@/components/ImageComponent.vue'
import { processors } from '@/controllers/imageProcessors'
</script>
