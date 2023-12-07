<template>
  <canvas
    ref="canvas"
    class="w-full"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { processImageOntoCanvas, drawImageOnCanvas } from '@/controllers/images'

const imagePath = ref('/apples.png') // Store image path
const canvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (!canvas.value) throw new Error('Canvas not found')

  const img = new Image()

  img.onload = () => {
    if (!canvas.value) throw new Error('Canvas not found')
    processImageOntoCanvas(canvas.value, img)
  }

  img.src = imagePath.value
})
</script>
