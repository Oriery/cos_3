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

class Pixel {
  r: number
  g: number
  b: number
  a: number

  constructor(r: number, g: number, b: number, a: number) {
    this.r = r
    this.g = g
    this.b = b
    this.a = a
  }

  add(pixel: Pixel): Pixel {
    return new Pixel(this.r + pixel.r, this.g + pixel.g, this.b + pixel.b, this.a + pixel.a)
  }

  divideByScalar(scalar: number): Pixel {
    return new Pixel(this.r / scalar, this.g / scalar, this.b / scalar, this.a / scalar)
  }

  static fromArray(data: Uint8ClampedArray): Pixel[] {
    const result = []

    for (let i = 0; i < data.length; i += 4) {
      result.push(new Pixel(data[i], data[i + 1], data[i + 2], data[i + 3]))
    }

    return result
  }

  static toMatrix(pixels: Pixel[], width: number): Matrix {
    const result = []

    for (let i = 0; i < pixels.length; i += width) {
      result.push(pixels.slice(i, i + width))
    }

    return result
  }

  static fromArrayToMatrix(data: Uint8ClampedArray, width: number): Matrix {
    console.time('fromArrayToMatrix')
    const res =  Pixel.toMatrix(Pixel.fromArray(data), width)
    console.timeEnd('fromArrayToMatrix')
    return res
  }
}

type Matrix = Pixel[][]

function invertColors(data: Uint8ClampedArray): Uint8ClampedArray {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i] // red
    data[i + 1] = 255 - data[i + 1] // green
    data[i + 2] = 255 - data[i + 2] // blue
  }

  return data
}

function boxBlur(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const newData = new Uint8ClampedArray(data.length)

  const matrix = Pixel.fromArrayToMatrix(data, width)

  console.time('boxBlur')
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const neighbors = getWindowAroundPixel(x, y, matrix, 3).flat()

      const avg = neighbors.reduce((acc, pixel) => acc.add(pixel), new Pixel(0, 0, 0, 0)).divideByScalar(neighbors.length)

      newData[4 * (y * width + x)] = avg.r
      newData[4 * (y * width + x) + 1] = avg.g
      newData[4 * (y * width + x) + 2] = avg.b
      newData[4 * (y * width + x) + 3] = avg.a
    }
  }
  console.timeEnd('boxBlur')

  return newData
}

function getWindow(
  xLeft: number,
  yLeft: number,
  xRight: number,
  yRight: number,
  matrix: Matrix,
) : Matrix {
  const grid = []

  for (let y = yLeft; y < yRight; y++) {
    grid.push(matrix[y].slice(xLeft, xRight))
  }

  return grid
}

function getWindowAroundPixel(
  x: number,
  y: number,
  matrix: Matrix,
  radius: number,
): Matrix {
  const xLeft = Math.max(x - radius, 0)
  const xRight = Math.min(x + radius + 1, matrix[0].length)
  const yLeft = Math.max(y - radius, 0)
  const yRight = Math.min(y + radius + 1, matrix.length)

  return getWindow(xLeft, yLeft, xRight, yRight, matrix)
}
