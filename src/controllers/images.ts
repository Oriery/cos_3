import type { ImageProcessingFn } from './imageProcessors'
import { processors } from './imageProcessors'

export function processImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  //const imageData = ctx.getImageData(0, 0, img.width, img.height)
  const imageData = img.naturalWidth && img.naturalHeight
    ? ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight)
    : ctx.getImageData(0, 0, img.width, img.height)

  const newImageData = getProcessedImageCopyUsingGivenFn(imageData, processors[0].fn)

  ctx.putImageData(newImageData, 0, 0)
}

export function getProcessedImageCopyUsingGivenFn(imageData: ImageData, fn: ImageProcessingFn) : ImageData {
  // Make a copy
  const data = imageData.data.copyWithin(0, 0)

  // Process the copy
  fn(data, imageData.width, imageData.height)

  return new ImageData(data, imageData.width, imageData.height)
}
