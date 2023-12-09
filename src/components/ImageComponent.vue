<template>
  <canvas
    ref="canvas"
    class="w-full"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { processImageOntoCanvas, drawImageOnCanvas, getImage } from '@/controllers/images'
import type { ImageProcessor, ProcessorOptions } from '@/controllers/imageProcessors'

const props = defineProps<{
  imagePath: string
  imageProcessor?: ImageProcessor
  processorOptions?: ProcessorOptions
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  getImage(props.imagePath).then(async (img) => {
    if (!canvas.value) throw new Error('Canvas not found')

    if (props.imageProcessor) {
      const startTimestamp = performance.now()
      const notification = pushNotify.promise('Processing image...')
      await processImageOntoCanvas(canvas.value, img, props.imageProcessor, props.processorOptions)
      const timeTook = Math.round(performance.now() - startTimestamp)
      console.log(`Image processed in ${timeTook}ms`)
      notification.resolve({
        message: `Image processed in ${timeTook}ms`,
        duration: 1000,
      })
    } else {
      drawImageOnCanvas(canvas.value, img)
    }
  })

})
</script>
