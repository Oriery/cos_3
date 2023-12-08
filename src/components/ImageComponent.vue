<template>
  <canvas
    ref="canvas"
    class="w-full"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { processImageOntoCanvas, drawImageOnCanvas } from '@/controllers/images'
import type { ImageProcessor, ProcessorOptions } from '@/controllers/imageProcessors'

const props = defineProps<{
  imagePath: string
  imageProcessor?: ImageProcessor
  processorOptions?: ProcessorOptions
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (!canvas.value) throw new Error('Canvas not found')

  const img = new Image()

  img.onload = () => {
    if (!canvas.value) throw new Error('Canvas not found')

    if (props.imageProcessor) {
      const startTimestamp = performance.now()
      const notification = pushNotify.promise('Processing image...')
      processImageOntoCanvas(canvas.value, img, props.imageProcessor, props.processorOptions)
      notification.resolve({
        message: `Image processed in ${Math.round(performance.now() - startTimestamp)}ms`,
        duration: 1000,
      })
    } else {
      drawImageOnCanvas(canvas.value, img)
    }
  }

  img.src = props.imagePath
})
</script>
