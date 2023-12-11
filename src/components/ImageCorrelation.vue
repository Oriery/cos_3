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
      <canvas
        ref="canvas"
        :style="canvasIsVisible ? '' : 'visibility: hidden'"
        class="w-full"
      ></canvas>
      <canvas
        ref="canvasImg1OnCorrelation"
        :style="canvasIsVisible ? '' : 'visibility: hidden'"
        class="w-full"
      ></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageComponent from '@/components/ImageComponent.vue'
import { ref, watch, computed } from 'vue'
import { onMounted } from 'vue'
import {
  drawCorrelationOf2ImagesOnCanvas,
  convertToGrayscale,
  drawImageDataOnCanvas,
  getImageDataOfImage,
  getImage,
  convertToColor,
} from '@/controllers/images'
import { debounce } from 'advanced-throttle-debounce'

const image1Url = ref(localStorage.getItem('image1Url') ?? '/apples_100.png')
const image2Url = ref(localStorage.getItem('image2Url') ?? '/apples_100_part.png')
const autoCorrelation = computed(() => image1Url.value === image2Url.value)

watch(image1Url, (url) => localStorage.setItem('image1Url', url))
watch(image2Url, (url) => localStorage.setItem('image2Url', url))

const canvas = ref<HTMLCanvasElement | null>(null)
const canvasIsVisible = ref(false)

const canvasImage1Grayscale = ref<HTMLCanvasElement | null>(null)
const canvasImage2Grayscale = ref<HTMLCanvasElement | null>(null)
const canvasImg1OnCorrelation = ref<HTMLCanvasElement | null>(null)

const roughEqualityInPixels = 4

onMounted(updateCorrelationImage)

const debouncedTriggerToUpdateProcessedImage = debounce(updateCorrelationImage, {
  wait: 200,
  differentArgs: false,
})
watch([image1Url, image2Url], debouncedTriggerToUpdateProcessedImage)

async function updateCorrelationImage() {
  if (!canvas.value) throw new Error('Canvas not found')

  updateGrayscaleImages()

  const startTimestamp = performance.now()
  const notification = pushNotify.promise('Processing image...')
  try {
    const correlation = await drawCorrelationOf2ImagesOnCanvas(
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

    if (autoCorrelation.value) {
      updateImg1OnCorrelationAuto(correlation)
    } else {
      updateImg1OnCorrelationCross(correlation)
    }
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

async function updateImg1OnCorrelationCross(
  correlation: Awaited<ReturnType<typeof drawCorrelationOf2ImagesOnCanvas>>,
) {
  if (!canvasImg1OnCorrelation.value) throw new Error('Canvas not found')
  const ctx = canvasImg1OnCorrelation.value.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const { correlationImageData, imgData1, imgData2 } = correlation

  canvasImg1OnCorrelation.value.height = canvas.value?.height ?? 0

  const bitmap1 = await createImageBitmap(imgData1)
  ctx.drawImage(
    bitmap1,
    0,
    0,
    imgData1.width,
    imgData1.height,
    imgData2.width,
    imgData2.height,
    imgData1.width,
    imgData1.height,
  )

  ctx.strokeStyle = 'red'
  ctx.lineWidth = 1

  const coord = correlationImageData.max.coordinates[0]
  ctx.strokeRect(coord.x, coord.y, imgData2.width, imgData2.height)
}

async function updateImg1OnCorrelationAuto(
  correlation: Awaited<ReturnType<typeof drawCorrelationOf2ImagesOnCanvas>>,
) {
  if (!canvasImg1OnCorrelation.value) throw new Error('Canvas not found')
  const ctx = canvasImg1OnCorrelation.value.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const { correlationImageData, imgData1, imgData2 } = correlation

  canvasImg1OnCorrelation.value.height = canvas.value?.height ?? 0

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, correlationImageData.corrMap.width, correlationImageData.corrMap.height)

  const bitmap1 = await createImageBitmap(imgData1)
  ctx.drawImage(
    bitmap1,
    0,
    0,
    imgData1.width,
    imgData1.height,
    imgData2.width,
    imgData2.height,
    imgData1.width,
    imgData1.height,
  )

  ctx.strokeStyle = 'red'
  console.log(correlationImageData.max)

  // sort by x
  correlationImageData.max.coordinates.sort((a, b) => a.x - b.x)
  // sort by y
  correlationImageData.max.coordinates.sort((a, b) => a.y - b.y)

  // group by x
  const groupedByX = correlationImageData.max.coordinates.reduce(
    (acc, coord) => {
      if (!acc[coord.x]) acc[coord.x] = []
      acc[coord.x].push(coord)
      return acc
    },
    {} as Record<number, typeof correlationImageData.max.coordinates>,
  )
  const sortedXValues = Object.keys(groupedByX)
    .map((a) => Number(a))
    .sort((a, b) => a - b)
  const sortedAndGroupedByX = sortedXValues.map((x) => groupedByX[x])
  console.log('sortedAndGroupedByX', sortedAndGroupedByX)

  type XYAndDeltaX = { xValue: number; yValues: number[]; delta: number }

  const xYAndDeltaX = sortedXValues
    .reduce((acc, xValue, index) => {
      if (index === 0) return acc
      const delta = xValue - sortedXValues[index - 1]
      acc.push({ xValue, delta, yValues: sortedAndGroupedByX[index].map(({ y }) => y) })
      return acc
    }, [] as XYAndDeltaX[])
    .filter(({ delta }) => delta > roughEqualityInPixels) // filter out deltas of 1
  console.log('xYAndDeltaX', xYAndDeltaX)

  // remove point which are almost the same by y
  xYAndDeltaX.forEach(({ yValues }) => {
    yValues.sort((a, b) => a - b)
    for (let i = 0; i < yValues.length - 1; i++) {
      if (roughlyEqual(yValues[i], yValues[i + 1], roughEqualityInPixels)) {
        yValues.splice(i, 1)
        i--
      }
    }
  })

  console.log('xYAndDeltaX with removed points', xYAndDeltaX)

  const countByDelta = xYAndDeltaX.reduce(
    (acc, { delta, yValues }) => {
      if (!acc[delta]) acc[delta] = 0
      acc[delta] += yValues.length
      return acc
    },
    {} as Record<number, number>,
  )
  console.log(countByDelta)
  const mostCommonDelta = Object.keys(countByDelta).reduce(
    (acc, delta) => {
      if (countByDelta[Number(delta)] > acc.count) {
        acc.count = countByDelta[Number(delta)]
        acc.delta = Number(delta)
      }
      return acc
    },
    { count: 0, delta: 0 } as { count: number; delta: number },
  ).delta
  console.log(mostCommonDelta)

  // merge similar deltas
  const groupesByXInPattern = xYAndDeltaX.filter(({ delta }) => roughlyEqual(delta, mostCommonDelta, roughEqualityInPixels))
  console.log('groupesByXInPattern', groupesByXInPattern)

  const leftColumnIndex = 0

  const leftPoints = groupesByXInPattern[leftColumnIndex]
  const pointLeft1 = { x: leftPoints.xValue, y: leftPoints.yValues[0] }
  const pointLeft2 = { x: leftPoints.xValue, y: leftPoints.yValues[1] }
  console.log('leftPoints', leftPoints)

  const rightPoints = groupesByXInPattern[leftColumnIndex + 1]
  const pointRight1 = { x: rightPoints!.xValue, y: rightPoints!.yValues[0] }
  const pointRight2 = { x: rightPoints!.xValue, y: rightPoints!.yValues[1] }
  console.log('rightPoints', rightPoints)

  ctx.strokeStyle = 'red'
  ctx.beginPath()
  ctx.moveTo(pointLeft1.x, pointLeft1.y)
  ctx.lineTo(pointLeft2.x, pointLeft2.y)
  ctx.lineTo(pointRight2.x, pointRight2.y)
  ctx.lineTo(pointRight1.x, pointRight1.y)
  ctx.closePath()
  ctx.stroke()
  
  ctx.strokeStyle = 'blue'
  ctx.beginPath()
  ctx.moveTo(pointLeft1.x + imgData2.width, pointLeft1.y + imgData2.height)
  ctx.lineTo(pointLeft2.x + imgData2.width, pointLeft2.y + imgData2.height)
  ctx.lineTo(pointRight2.x + imgData2.width, pointRight2.y + imgData2.height)
  ctx.lineTo(pointRight1.x + imgData2.width, pointRight1.y + imgData2.height)
  ctx.closePath()
  ctx.stroke()

  ctx.strokeStyle = 'red'
  correlationImageData.max.coordinates.forEach((coord) => {
    ctx.beginPath()
    ctx.ellipse(coord.x, coord.y, 0, 1, 0, 0, 2 * Math.PI)
    ctx.stroke()
  })
  ctx.strokeStyle = 'white'
  groupesByXInPattern.forEach((xYAndDeltaX) => {
    xYAndDeltaX.yValues.forEach((y) => {
      ctx.beginPath()
      ctx.ellipse(xYAndDeltaX.xValue, y, 1, 0, 0, 0, 2 * Math.PI)
      ctx.stroke()
    })
  })
}

function roughlyEqualByPercentage(a: number, b: number, percentage: number) {
  return Math.abs(a - b) <= percentage * Math.max(a, b)
}

function roughlyEqual(a: number, b: number, delta: number) {
  return Math.abs(a - b) <= delta
}
</script>
