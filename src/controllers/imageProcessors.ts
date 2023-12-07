export type ImageProcessingFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
) => Uint8ClampedArray

export type ImageProcessingFnWithName = {
  name: string
  fn: ImageProcessingFn
}

export const processors: ImageProcessingFnWithName[] = []

function invertColors(data: Uint8ClampedArray): Uint8ClampedArray {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i] // red
    data[i + 1] = 255 - data[i + 1] // green
    data[i + 2] = 255 - data[i + 2] // blue
  }

  return data
}
processors.push({ name: 'invertColors', fn: invertColors })
