import type { ImageProcessor } from './imageProcessors'

export function processImageOntoCanvas(canvas: HTMLCanvasElement, img: HTMLImageElement, processor: ImageProcessor) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  drawImageOnCanvas(canvas, img)

  //const imageData = ctx.getImageData(0, 0, img.width, img.height)
  const imageData =
    img.naturalWidth && img.naturalHeight
      ? ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight)
      : ctx.getImageData(0, 0, img.width, img.height)

  try {
    const newImageData = getProcessedImageCopyUsingGivenFn(imageData, processor)

    ctx.putImageData(newImageData, 0, 0)
  } catch (e) {
    // fill the canvas with white
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
}

function getProcessedImageCopyUsingGivenFn(
  imageData: ImageData,
  processor: ImageProcessor,
): ImageData {
  // Make a copy
  let data = imageData.data.copyWithin(0, 0)

  // Process the copy
  data = processor.fn(data, imageData.width, imageData.height, {radius: 2})

  return new ImageData(data, imageData.width, imageData.height)
}

export function drawImageOnCanvas(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const ratio = img.width / img.height
  canvas.height = canvas.width / ratio

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
}
