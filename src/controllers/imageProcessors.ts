export type ImageProcessingFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
) => Uint8ClampedArray

export type ImageProcessor = {
  name: string
  fn: ImageProcessingFn
}

export const processors = {
  invertColors: {
    name: 'Invert Colors',
    fn: invertColors,
  },
  boxBlur: {
    name: 'Box Blur',
    fn: boxBlur,
  },
}

type Pixel = {
  r: number
  g: number
  b: number
  a: number
}

function addPixels(pixel1: Pixel, pixel2: Pixel): Pixel {
  return {
    r: pixel1.r + pixel2.r,
    g: pixel1.g + pixel2.g,
    b: pixel1.b + pixel2.b,
    a: pixel1.a + pixel2.a,
  }
}

function dividePixelByScalar(pixel: Pixel, scalar: number): Pixel {
  return {
    r: pixel.r / scalar,
    g: pixel.g / scalar,
    b: pixel.b / scalar,
    a: pixel.a / scalar,
  }
}

function invertColors(data: Uint8ClampedArray): Uint8ClampedArray {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i] // red
    data[i + 1] = 255 - data[i + 1] // green
    data[i + 2] = 255 - data[i + 2] // blue
  }

  return data
}

function boxBlur(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const newData = data.copyWithin(0, 0)

  for (let i = 0; i < newData.length; i += 4) {
    const x = (i / 4) % width
    const y = Math.floor(i / 4 / width)

    const pixel = getPixel(x, y, width, height, newData)

    const neighbors = getNeighbors(x, y, width, height, newData)

    const avg = dividePixelByScalar(
      neighbors.reduce((acc, neighbor) => addPixels(acc, neighbor), pixel),
      neighbors.length + 1,
    )

    newData[i] = avg.r
    newData[i + 1] = avg.g
    newData[i + 2] = avg.b
    newData[i + 3] = avg.a
  }

  return newData
}

function getPixel(
  x: number,
  y: number,
  width: number,
  height: number,
  data: Uint8ClampedArray,
): Pixel {
  const i = (x + y * width) * 4

  return {
    r: data[i],
    g: data[i + 1],
    b: data[i + 2],
    a: data[i + 3],
  }
}

function getNeighbors(
  x: number,
  y: number,
  width: number,
  height: number,
  data: Uint8ClampedArray,
) {
  const neighbors = []

  if (x > 0) {
    neighbors.push(getPixel(x - 1, y, width, height, data))
  }
  if (x < width - 1) {
    neighbors.push(getPixel(x + 1, y, width, height, data))
  }
  if (y > 0) {
    neighbors.push(getPixel(x, y - 1, width, height, data))
  }
  if (y < height - 1) {
    neighbors.push(getPixel(x, y + 1, width, height, data))
  }

  return neighbors
}
