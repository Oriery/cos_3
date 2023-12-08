export type ImageProcessingFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: ProcessorOptions,
) => Uint8ClampedArray

export type ImageProcessor = {
  id: string
  name: string
  fn: ImageProcessingFn
  options: ProcessorOptionDescr[]
}

export const processors: Record<string, ImageProcessor> = {
  invertColors: {
    id: 'invertColors',
    name: 'Invert Colors',
    fn: invertColors,
    options: [],
  },
  boxBlur: {
    id: 'boxBlur',
    name: 'Box Blur',
    fn: boxBlur,
    options: [
      {
        id: 'radius',
        name: 'Radius',
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
      },
    ],
  },
  gaussianBlur: {
    id: 'gaussianBlur',
    name: 'Gaussian Blur',
    fn: gaussianBlur,
    options: [
      {
        id: 'radius',
        name: 'Radius',
        defaultValue: 10,
        min: 1,
        max: 10,
        step: 1,
      },
      {
        id: 'stdDeviation',
        name: String.fromCharCode(0x03c3),
        defaultValue: 3,
        min: 0.5,
        max: 10,
        step: 0.5,
      }
    ],
  },
}

export type ProcessorOptionDescr = {
  id: string
  name: string
  defaultValue: number
  min: number
  max: number
  step: number
}

export type ProcessorOptions = Record<string, number>

function invertColors(data: Uint8ClampedArray): Uint8ClampedArray {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i] // red
    data[i + 1] = 255 - data[i + 1] // green
    data[i + 2] = 255 - data[i + 2] // blue
  }

  return data
}

function boxBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: ProcessorOptions,
): Uint8ClampedArray {
  checkThatAllOptionsAreProvidedAndValid(options, processors.boxBlur)

  const newData = new Uint8ClampedArray(data.length)

  const pixelsInWindow = Math.pow(2 * options.radius + 1, 2)
  const invPixelsInWindow = 1 / pixelsInWindow

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const neighbors = getWindowAroundPixel(x, y, data, width, height, options.radius)

      let rSum = 0
      let gSum = 0
      let bSum = 0
      let aSum = 0
      for (let i = 0; i < neighbors.length; i += 4) {
        rSum += neighbors[i]
        gSum += neighbors[i + 1]
        bSum += neighbors[i + 2]
        aSum += neighbors[i + 3]
      }

      newData[4 * (y * width + x)] = rSum * invPixelsInWindow
      newData[4 * (y * width + x) + 1] = gSum * invPixelsInWindow
      newData[4 * (y * width + x) + 2] = bSum * invPixelsInWindow
      newData[4 * (y * width + x) + 3] = aSum * invPixelsInWindow
    }
  }

  return newData
}

function gaussianBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: ProcessorOptions,
): Uint8ClampedArray {
  checkThatAllOptionsAreProvidedAndValid(options, processors.gaussianBlur)

  const newData = new Uint8ClampedArray(data.length)

  const kernel = getGaussianKernel(options.radius, options.stdDeviation)

  for (let y = 0; y < height; y++) {
    const y1 = y * width
    for (let x = 0; x < width; x++) {
      const neighbors = getWindowAroundPixel(x, y, data, width, height, options.radius)

      let rSum = 0
      let gSum = 0
      let bSum = 0
      let aSum = 0
      for (let i = 0; i < neighbors.length; i += 4) {
        rSum += neighbors[i] * kernel[i / 4]
        gSum += neighbors[i + 1] * kernel[i / 4]
        bSum += neighbors[i + 2] * kernel[i / 4]
        aSum += neighbors[i + 3] * kernel[i / 4]
      }

      newData[4 * (y1 + x)] = rSum
      newData[4 * (y1 + x) + 1] = gSum
      newData[4 * (y1 + x) + 2] = bSum
      newData[4 * (y1 + x) + 3] = aSum
    }
  }

  return newData
}

function getGaussianKernel(radius: number, stdDeviation: number): number[] {
  const kernelSize = 2 * radius + 1
  const kernel = new Array(kernelSize * kernelSize)

  const kernelCenter = Math.floor(kernelSize / 2)

  let sum = 0
  for (let i = 0; i < kernel.length; i++) {
    const x = i % kernelSize
    const y = Math.floor(i / kernelSize)

    const xDiff = x - kernelCenter
    const yDiff = y - kernelCenter

    const dist = Math.sqrt(xDiff * xDiff + yDiff * yDiff)

    const val = Math.exp(-(dist * dist) / (2 * stdDeviation * stdDeviation))
    kernel[i] = val
    sum += val
  }

  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum
  }

  return kernel
}

function checkThatAllOptionsAreProvidedAndValid(
  options: ProcessorOptions,
  processor: ImageProcessor,
): void {
  if (!processor.options) return

  for (const option of processor.options) {
    if (typeof options[option.id] !== 'number') {
      throw new Error(`Option ${option.id} is not provided`)
    }

    if (options[option.id] < option.min || options[option.id] > option.max) {
      throw new Error(
        `Option ${option.id} is out of range: ${options[option.id]} is not in [${option.min}, ${
          option.max
        }]`,
      )
    }
  }
}

function getWindow(
  xFrom: number,
  yFrom: number,
  xTo: number,
  yTo: number,
  data: Uint8ClampedArray,
  width: number,
  leftEdgeDuplicates: number = 0,
  rightEdgeDuplicates: number = 0,
  topEdgeDuplicates: number = 0,
  bottomEdgeDuplicates: number = 0,
): Uint8ClampedArray {
  const outLength =
    4 *
    (xTo - xFrom + leftEdgeDuplicates + rightEdgeDuplicates) *
    (yTo - yFrom + topEdgeDuplicates + bottomEdgeDuplicates)
  const res = new Uint8ClampedArray(outLength)

  let i = 0
  let y1 = 0
  let ind = 0
  let duplicatedFirstRows = 0
  let duplicatedLastRows = 0
  for (let y = yFrom; y < yTo; y++) {
    y1 = y * width

    let duplicatedLeftCols = 0
    let duplicatedRightCols = 0
    for (let x = xFrom; x < xTo; x++) {
      ind = 4 * (y1 + x)
      res[i] = data[ind]
      res[i + 1] = data[ind + 1]
      res[i + 2] = data[ind + 2]
      res[i + 3] = data[ind + 3]
      i += 4

      // maybe duplicate left pixel
      if (duplicatedLeftCols < leftEdgeDuplicates) {
        duplicatedLeftCols++
        x--
      } else if (x == xTo - 1 && duplicatedRightCols < rightEdgeDuplicates) {
        // duplicate right pixel
        duplicatedRightCols++
        x--
      }
    }

    // maybe duplicate first row
    if (duplicatedFirstRows < topEdgeDuplicates) {
      duplicatedFirstRows++
      y--
    } else if (y == yTo - 1 && duplicatedLastRows < bottomEdgeDuplicates) {
      // duplicate last row
      duplicatedLastRows++
      y--
    }
  }

  if (i != outLength) {
    throw new Error(`i (${i}) != outLength (${outLength})`)
  }

  return res
}

function getWindowAroundPixel(
  x: number,
  y: number,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): Uint8ClampedArray {
  const xFromWanted = x - radius
  const yFromWanted = y - radius
  const xToWanted = x + radius + 1
  const yToWanted = y + radius + 1
  const xFrom = Math.max(xFromWanted, 0)
  const yFrom = Math.max(yFromWanted, 0)
  const xTo = Math.min(xToWanted, width)
  const yTo = Math.min(yToWanted, height)
  const leftEdgeDuplicates = xFrom - xFromWanted
  const rightEdgeDuplicates = xToWanted - xTo
  const topEdgeDuplicates = yFrom - yFromWanted
  const bottomEdgeDuplicates = yToWanted - yTo

  const res = getWindow(
    xFrom,
    yFrom,
    xTo,
    yTo,
    data,
    width,
    leftEdgeDuplicates,
    rightEdgeDuplicates,
    topEdgeDuplicates,
    bottomEdgeDuplicates,
  )

  return res
}
