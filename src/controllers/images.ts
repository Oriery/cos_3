import type { ImageProcessor } from './imageProcessors'
import { processors } from './imageProcessors'

export function processImageOntoCanvas(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  drawImageOnCanvas(canvas, img)

  //const imageData = ctx.getImageData(0, 0, img.width, img.height)
  const imageData =
    img.naturalWidth && img.naturalHeight
      ? ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight)
      : ctx.getImageData(0, 0, img.width, img.height)

  const newImageData = getProcessedImageCopyUsingGivenFn(imageData, processors.invertColors)

  ctx.putImageData(newImageData, 0, 0)
}

export function getProcessedImageCopyUsingGivenFn(
  imageData: ImageData,
  processor: ImageProcessor,
): ImageData {
  // Make a copy
  const data = imageData.data.copyWithin(0, 0)

  // Process the copy
  processor.fn(data, imageData.width, imageData.height)

  return new ImageData(data, imageData.width, imageData.height)
}

export function drawImageOnCanvas(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const ratio = img.width / img.height
  canvas.height = canvas.width / ratio

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
}
