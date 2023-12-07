<template>
  <canvas
    ref="canvas"
    class="w-full"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { processImageOntoCanvas, drawImageOnCanvas } from '@/controllers/images'
import type { ImageProcessor } from '@/controllers/imageProcessors'

const props = defineProps<{
  imagePath: string
  imageProcessor?: ImageProcessor
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (!canvas.value) throw new Error('Canvas not found')

  const img = new Image()

  img.onload = () => {
    if (!canvas.value) throw new Error('Canvas not found')

    if (props.imageProcessor) {
      processImageOntoCanvas(canvas.value, img, props.imageProcessor)
    } else {
      drawImageOnCanvas(canvas.value, img)
    }
  }

  img.src = props.imagePath
})
</script>
