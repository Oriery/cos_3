import type { ImageProcessor, ProcessorOptions } from './imageProcessors'

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

export async function drawImageDataOnCanvas(canvas: HTMLCanvasElement, imageData: ImageData) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const bitmap = await createImageBitmap(imageData)
  ctx.drawImage(bitmap, 0, 0)
}

export async function drawDataOnCanvas(
  canvas: HTMLCanvasElement,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  drawImageDataOnCanvas(canvas, new ImageData(data, width, height))
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
  // canvas.height = canvas.width / ratio

  ctx.drawImage(img, 0, 0)
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

  const autoCorrelation = img1Url === img2Url

  const [img1, img2] = await Promise.all([getImage(img1Url), getImage(img2Url)])
  console.log('img1 width height', img1.width, img1.height)
  console.log('img2 width height', img2.width, img2.height)

  const imgData1 = getImageDataOfImage(img1)
  const imgData2 = autoCorrelation ? imgData1 : getImageDataOfImage(img2)

  canvas.height = 200

  const correlationImageData = getCorrelationData(imgData1, imgData2)

  console.log('correlationImageData', correlationImageData)

  drawImageDataOnCanvas(canvas, correlationImageData.corrMap)

  return {
    correlationImageData,
    imgData1,
    imgData2,
  }
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

export function getDataOfImage(img: HTMLImageElement): Uint8ClampedArray {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, img.width, img.height)

  return imageData.data
}

export function getImageDataOfImage(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const ratio = img.width / img.height

  ctx.drawImage(img, 0, 0, canvas.width, canvas.width / ratio)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.width / ratio)

  return imageData
}

export function convertToGrayscale(data: Uint8ClampedArray): Uint8ClampedArray {
  const newData = new Uint8ClampedArray(data.length / 4)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    newData[i / 4] = (r + g + b) / 3
  }

  return newData
}

export function convertToColor(data: Uint8ClampedArray): Uint8ClampedArray {
  const newData = new Uint8ClampedArray(data.length * 4)

  for (let i = 0; i < data.length; i++) {
    const color = data[i]

    newData[i * 4] = color
    newData[i * 4 + 1] = color
    newData[i * 4 + 2] = color
    newData[i * 4 + 3] = 255
  }

  return newData
}

export type Maximums = {
  value: number
  coordinates: {
    x: number
    y: number
  }[]
}

function getCorrelationData(imgData1: ImageData, imgData2: ImageData): {
  corrMap: ImageData
  max: Maximums
} {
  const autoCorrelation = imgData1 === imgData2

  let data1Grayscale = convertToGrayscale(imgData1.data)
  let data2Grayscale = autoCorrelation ? data1Grayscale : convertToGrayscale(imgData2.data)

  // sort the data by size
  if (data1Grayscale.length < data2Grayscale.length) {
    const tmp = data1Grayscale
    data1Grayscale = data2Grayscale
    data2Grayscale = tmp
  }

  const correlationImageWidth = imgData1.width + imgData2.width
  const correlationImageHeight = imgData1.height + imgData2.height
  const correlationImageSize = correlationImageWidth * correlationImageHeight
  const correlationImageData = new Uint8ClampedArray(correlationImageSize)

  const max : Maximums = {
    value: Infinity,
    coordinates: [],
  }

  for (let j = 0; j < correlationImageHeight; j++) {
    for (let i = 0; i < correlationImageWidth; i++) {
      const { sum, overlapArea } = getSumOfMultiplications(
        data1Grayscale,
        imgData1.width,
        imgData1.height,
        data2Grayscale,
        imgData2.width,
        imgData2.height,
        i,
        j,
      )
      if (isNaN(sum)) throw new Error('NaN')

      if (autoCorrelation) {
        const checkedSum = sum / overlapArea
        const val = 255 - checkedSum * 10
        correlationImageData[j * correlationImageWidth + i] = val

        if (checkedSum !== 0) {
          if (roughlyEqualByPercentage(checkedSum, max.value, 0.7)) {
            max.coordinates.push({ x: i, y: j })
          } else if (checkedSum < max.value) {
            max.value = checkedSum
            max.coordinates = [{ x: i, y: j }]
          }
        }
      } else {
        const val = 255 - (255 * sum) / 40000
        correlationImageData[j * correlationImageWidth + i] = val

        if (i > imgData2.width && j > imgData2.height && i < imgData1.width && j < imgData1.height) {
          if (sum < max.value) {
            max.value = sum
            max.coordinates = [{ x: i, y: j }]
          } else if (sum === max.value) {
            max.coordinates.push({ x: i, y: j })
          }
        }
      }
    }
  }

  if (autoCorrelation) {
    // push center point
    max.coordinates.push({ x: imgData1.width, y: imgData1.height })
  }

  console.log('correlationImageData', correlationImageData)

  const coloredData = convertToColor(correlationImageData)

  return {
    corrMap: new ImageData(coloredData, correlationImageWidth, correlationImageHeight),
    max,
  }
}

function roughlyEqualByPercentage(a: number, b: number, percentage: number) {
  return Math.abs(a - b) < percentage * Math.max(a, b)
}

function getSumOfMultiplications(
  data1: Uint8ClampedArray,
  width1: number,
  height1: number,
  data2: Uint8ClampedArray,
  width2: number,
  height2: number,
  x: number,
  y: number,
) {
  const x0Data1 = Math.max(0, x - width2)
  const x1Data1 = Math.min(width1, x)
  const x0Data2 = Math.max(0, width2 - x)
  //const x1Data2 = Math.min(width2, width1 + width2 - x)

  const y0Data1 = Math.max(0, y - height2)
  const y1Data1 = Math.min(height1, y)
  const y0Data2 = Math.max(0, height2 - y)
  //const y1Data2 = Math.min(height2, height1 + height2 - y)

  const windowWidth = x1Data1 - x0Data1
  const windowHeight = y1Data1 - y0Data1

  let sum = 0
  for (let i = 0; i < windowWidth; i++) {
    for (let j = 0; j < windowHeight; j++) {
      const data1Index = (y0Data1 + j) * width1 + x0Data1 + i
      const data2Index = (y0Data2 + j) * width2 + x0Data2 + i

      const data1Value = data1[data1Index]
      const data2Value = data2[data2Index]

      //sum += (data1Value - data2Value) ** 2
      //sum -= data1Value * data2Value
      sum += Math.abs(data1Value - data2Value)
    }
  }

  return {
    sum,
    overlapArea: windowWidth * windowHeight,
  }
}
