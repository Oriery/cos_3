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
    <div class="flex flex-col gap-2 p-2 bg-blue-700 rounded">
      <div class="flex flex-row gap-2 p-2 bg-blue-700 rounded">
        <ImageComponent
          :image-path="image1Url"
          :key="image1Url"
        />
        <canvas
          ref="canvasImage1Grayscale"
          :style="canvasIsVisible ? '' : 'visibility: hidden'"
          class="w-full"
        ></canvas>
        <ImageComponent
          :image-path="image2Url"
          :key="image2Url"
        />
        <canvas
          ref="canvasImage2Grayscale"
          :style="canvasIsVisible ? '' : 'visibility: hidden'"
          class="w-full"
        ></canvas>
      </div>
      <div class="flex flex-row gap-2 p-2 bg-blue-700 rounded">
        <canvas
          ref="canvas"
          :style="canvasIsVisible ? '' : 'visibility: hidden'"
          class="w-full"
        ></canvas>
        <canvas
          ref="canvasImage"
          :style="canvasIsVisible ? '' : 'visibility: hidden'"
          class="w-full"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageComponent from '@/components/ImageComponent.vue'
import { ref, watch } from 'vue'
import { onMounted } from 'vue'
import {
  drawCorrelationOf2ImagesOnCanvas,
  convertToGrayscale,
  drawImageDataOnCanvas,
  getImageDataOfImage,
  getImage,
  convertToColor,
} from '@/controllers/images'

const image1Url = ref('/apples_100.png')
const image2Url = ref('/apples_100_part.png')

const canvas = ref<HTMLCanvasElement | null>(null)
const canvasIsVisible = ref(false)

const canvasImage1Grayscale = ref<HTMLCanvasElement | null>(null)
const canvasImage2Grayscale = ref<HTMLCanvasElement | null>(null)

onMounted(updateCorrelationImage)

watch([image1Url, image2Url], updateCorrelationImage)

async function updateCorrelationImage() {
  if (!canvas.value) throw new Error('Canvas not found')

  updateGrayscaleImages()

  const startTimestamp = performance.now()
  const notification = pushNotify.promise('Processing image...')
  try {
    const correlationImage = await drawCorrelationOf2ImagesOnCanvas(
      canvas.value,
      image1Url.value,
      image2Url.value,
    )
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

    throw err
  }
}

async function updateGrayscaleImages() {
  if (!canvasImage1Grayscale.value) throw new Error('Canvas not found')
  if (!canvasImage2Grayscale.value) throw new Error('Canvas not found')

  const [img1, img2] = await Promise.all([getImage(image1Url.value), getImage(image2Url.value)])

  const imageData1 = getImageDataOfImage(img1)
  const imageData2 = getImageDataOfImage(img2)

  const grayscaleImageData1 = new ImageData(
    convertToColor(convertToGrayscale(imageData1.data)),
    imageData1.width,
    imageData1.height,
  )
  const grayscaleImageData2 = new ImageData(
    convertToColor(convertToGrayscale(imageData2.data)),
    imageData2.width,
    imageData2.height,
  )

  drawImageDataOnCanvas(canvasImage1Grayscale.value, grayscaleImageData1)
  drawImageDataOnCanvas(canvasImage2Grayscale.value, grayscaleImageData2)
}
</script>
