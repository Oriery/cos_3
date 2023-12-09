<template>
  <div>
    <div>
      <v-text-field
        v-model="image1Url"
        label="Image 1 URL"
      />
      <v-text-field
        v-model="image2Url"
        label="Image 2 URL"
      />
    </div>
    <div class="flex flex-row gap-2 p-2 bg-blue-700 rounded">
      <ImageComponent
        :image-path="image1Url"
        :key="image1Url"
      />
      <canvas
        ref="canvas"
        :style="canvasIsVisible ? '' : 'visibility: hidden'"
        class="w-full"
      ></canvas>
      <ImageComponent
        :image-path="image2Url"
        :key="image2Url"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageComponent from '@/components/ImageComponent.vue'
import { ref, watch } from 'vue'
import { onMounted } from 'vue'
import { drawCorrelationOf2ImagesOnCanvas } from '@/controllers/images'

const image1Url = ref('/apples_100.png')
const image2Url = ref('/apples_100_part.png')

const canvas = ref<HTMLCanvasElement | null>(null)
const canvasIsVisible = ref(false)

onMounted(updateCorrelationImage)

async function updateCorrelationImage() {
  if (!canvas.value) throw new Error('Canvas not found')

  const startTimestamp = performance.now()
  const notification = pushNotify.promise('Processing image...')
  try {
    await drawCorrelationOf2ImagesOnCanvas(canvas.value, image1Url.value, image2Url.value)
    const timeTook = Math.round(performance.now() - startTimestamp)
    console.log(`Correlation computed in ${timeTook}ms`)
    notification.resolve({
      message: `Correlation computed in ${timeTook}ms`,
      duration: 1000,
    })
    canvasIsVisible.value = true
  } catch (err) {
    notification.clear()
    canvasIsVisible.value = false
  }
}

watch([image1Url, image2Url], updateCorrelationImage)

</script>
