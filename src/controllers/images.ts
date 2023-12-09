import type { ImageProcessor, ProcessorOptions } from './imageProcessors'
import { getWindowAroundPixel } from './imageProcessors'

const FORCED_WIDTH = 200

export async function processImageOntoCanvas(
  canvas: HTMLCanvasElement,
  imgUrl: HTMLImageElement,
  processor: ImageProcessor,
  procOptions?: ProcessorOptions,
) {
  const imageData = getImageDataOfImage(imgUrl)

  try {
    const newImageData = getProcessedImageCopyUsingGivenFn(imageData, processor, procOptions)

    await drawImageDataOnCanvas(canvas, newImageData)
  } catch (e) {
    // fill the canvas with white
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // rethrow the error
    throw e
  }
}

async function drawImageDataOnCanvas(canvas: HTMLCanvasElement, imageData: ImageData) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const bitmap = await createImageBitmap(imageData)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
}

async function drawDataOnCanvas(canvas: HTMLCanvasElement, data: Uint8ClampedArray, width: number, height: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const bitmap = await createImageBitmap(new ImageData(data, width, height))
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
}

function getProcessedImageCopyUsingGivenFn(
  imageData: ImageData,
  processor: ImageProcessor,
  procOptions?: ProcessorOptions,
): ImageData {
  // Make a copy
  let data = imageData.data.copyWithin(0, 0)

  // Process the copy
  data = processor.fn(data, imageData.width, imageData.height, procOptions ?? {})

  return new ImageData(data, imageData.width, imageData.height)
}

export function drawImageOnCanvas(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const ratio = img.width / img.height
  canvas.height = canvas.width / ratio

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
}

export async function drawCorrelationOf2ImagesOnCanvas(
  canvas: HTMLCanvasElement,
  img1Url: string,
  img2Url: string,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  console.log('img1Url', img1Url)
  console.log('img2Url', img2Url)

  const [img1, img2] = await Promise.all([getImage(img1Url), getImage(img2Url)])
  console.log('img1 width height', img1.width, img1.height)
  console.log('img2 width height', img2.width, img2.height)

  const ratio = img1.width / img1.height
  canvas.height = canvas.width / ratio

  const data = correlationFunction(
    getDataOfImage(img1),
    img1.width,
    img1.height,
    getDataOfImage(img2),
    img2.width,
    img2.height,
  )

  console.log('data', data)

  drawDataOnCanvas(canvas, data, img1.width, img1.height)
}

function correlationFunction(
  data1: Uint8ClampedArray,
  width1: number,
  height1: number,
  data2: Uint8ClampedArray,
  width2: number,
  height2: number,
): Uint8ClampedArray {
  const newData = new Uint8ClampedArray(data1.length)

  const windowSize = 2 * Math.max(width2, height2)
  const window = new Uint8ClampedArray(windowSize * windowSize * 4)

  const normalizationFactor = 1 / (windowSize * windowSize)

  for (let y = 0; y < height1; y++) {
    const y1 = y * width1
    for (let x = 0; x < width1; x++) {
      const neighbors = getWindowAroundPixel(x, y, data1, width1, height1, 1)

      for (let i = 0; i < neighbors.length; i += 4) {
        window[i] = neighbors[i]
        window[i + 1] = neighbors[i + 1]
        window[i + 2] = neighbors[i + 2]
        window[i + 3] = neighbors[i + 3]
      }

      const r = correlation(window, data2, 0)
      const g = correlation(window, data2, 1)
      const b = correlation(window, data2, 2)
      //const a = correlation(window, data2, 3)

      newData[4 * (y1 + x)] = r * normalizationFactor
      newData[4 * (y1 + x) + 1] = g * normalizationFactor
      newData[4 * (y1 + x) + 2] = b * normalizationFactor
      //newData[4 * (y1 + x) + 3] = a * normalizationFactor
      newData[4 * (y1 + x) + 3] = 255
    }
  }

  return newData
}

function correlation(data1: Uint8ClampedArray, data2: Uint8ClampedArray, channel: number): number {
  let sum = 0
  for (let i = 0; i < data2.length; i += 4) {
    sum += data1[i + channel] * data2[i + channel]
  }

  return sum
}

function convertToGrayscale(data: Uint8ClampedArray): Uint8ClampedArray {
  const newData = new Uint8ClampedArray(data.length / 4)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    newData[i / 4] = (r + g + b) / 3
  }

  return newData
}

export function getImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    img.onload = () => resolve(img)
    img.onerror = reject
  })
}

function getDataOfImage(img: HTMLImageElement): Uint8ClampedArray {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  ctx.drawImage(img, 0, 0, img.width, img.height)

  const imageData = ctx.getImageData(0, 0, img.width, img.height)

  return imageData.data
}

function getImageDataOfImage(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const ratio = img.width / img.height

  ctx.drawImage(img, 0, 0, FORCED_WIDTH, FORCED_WIDTH / ratio)

  const imageData = ctx.getImageData(0, 0, FORCED_WIDTH, FORCED_WIDTH / ratio)

  return imageData
}
