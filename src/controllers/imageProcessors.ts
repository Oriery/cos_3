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
        max: 20,
        step: 1,
      },
    ],
  },
  medianFilter: {
    id: 'medianFilter',
    name: 'Median Filter',
    fn: medianFilter,
    options: [
      {
        id: 'radius',
        name: 'Radius',
        defaultValue: 2,
        min: 1,
        max: 5,
        step: 1,
      },
    ],
  },
  sobelOperator: {
    id: 'sobelOperator',
    name: 'Sobel Operator',
    fn: sobelOperator,
    options: [],
  },
  sharpeningFilter: {
    id: 'sharpeningFilter',
    name: 'Sharpening',
    fn: sharpeningFilter,
    options: [
      {
        id: 'amount',
        name: 'Amount',
        defaultValue: 3,
        min: 0,
        max: 10,
        step: 0.2,
      },
      {
        id: 'radius',
        name: 'Radius',
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
      },
      {
        id: 'threshold',
        name: 'Threshold',
        defaultValue: 180,
        min: 0,
        max: 255,
        step: 1,
      },
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

  const kernel = getGaussianKernel(options.radius)

  for (let y = 0; y < height; y++) {
    const y1 = y * width
    for (let x = 0; x < width; x++) {
      const [rSum, gSum, bSum, aSum] = getGaussianBlurForOnePixel(
        x,
        y,
        data,
        width,
        height,
        options.radius,
        kernel,
      )

      newData[4 * (y1 + x)] = rSum
      newData[4 * (y1 + x) + 1] = gSum
      newData[4 * (y1 + x) + 2] = bSum
      newData[4 * (y1 + x) + 3] = aSum
    }
  }

  return newData
}

function getGaussianBlurForOnePixel (
  x: number,
  y: number,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  kernel: number[],
): number[] {
  const neighbors = getWindowAroundPixel(x, y, data, width, height, radius)

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

  return [rSum, gSum, bSum, aSum]
}

function getGaussianKernel(radius: number): number[] {
  const stdDeviation = radius / 3
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

function medianFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: ProcessorOptions,
): Uint8ClampedArray {
  checkThatAllOptionsAreProvidedAndValid(options, processors.medianFilter)

  const newData = new Uint8ClampedArray(data.length)

  const windowSize = 2 * options.radius + 1
  const window = new Uint8ClampedArray(windowSize * windowSize * 4)

  for (let y = 0; y < height; y++) {
    const y1 = y * width
    for (let x = 0; x < width; x++) {
      const neighbors = getWindowAroundPixel(x, y, data, width, height, options.radius)

      for (let i = 0; i < neighbors.length; i += 4) {
        window[i] = neighbors[i]
        window[i + 1] = neighbors[i + 1]
        window[i + 2] = neighbors[i + 2]
        window[i + 3] = neighbors[i + 3]
      }

      const rMedian = getMedian(window, 0)
      const gMedian = getMedian(window, 1)
      const bMedian = getMedian(window, 2)
      const aMedian = getMedian(window, 3)

      newData[4 * (y1 + x)] = rMedian
      newData[4 * (y1 + x) + 1] = gMedian
      newData[4 * (y1 + x) + 2] = bMedian
      newData[4 * (y1 + x) + 3] = aMedian
    }
  }

  return newData
}

function getMedian(data: Uint8ClampedArray, channel: number): number {
  const windowSize = Math.sqrt(data.length / 4)
  const window = new Uint8ClampedArray(windowSize * windowSize)

  for (let i = 0; i < data.length; i += 4) {
    window[i / 4] = data[i + channel]
  }

  window.sort((a, b) => a - b)

  return window[Math.floor(window.length / 2)]
}

function sobelOperator(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const newData = new Uint8ClampedArray(data.length)

  const kernelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  const kernelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

  const windowSize = 3
  const window = new Uint8ClampedArray(windowSize * windowSize * 4)

  for (let y = 0; y < height; y++) {
    const y1 = y * width
    for (let x = 0; x < width; x++) {
      const neighbors = getWindowAroundPixel(x, y, data, width, height, 1)

      for (let i = 0; i < neighbors.length; i += 4) {
        window[i] = neighbors[i]
        window[i + 1] = neighbors[i + 1]
        window[i + 2] = neighbors[i + 2]
        window[i + 3] = neighbors[i + 3]
      }

      const rX = convolve(window, kernelX, 0)
      const gX = convolve(window, kernelX, 1)
      const bX = convolve(window, kernelX, 2)
      //const aX = convolve(window, kernelX, 3)

      const rY = convolve(window, kernelY, 0)
      const gY = convolve(window, kernelY, 1)
      const bY = convolve(window, kernelY, 2)
      //const aY = convolve(window, kernelY, 3)

      const r = Math.sqrt(rX * rX + rY * rY)
      const g = Math.sqrt(gX * gX + gY * gY)
      const b = Math.sqrt(bX * bX + bY * bY)
      //const a = Math.sqrt(aX * aX + aY * aY)

      newData[4 * (y1 + x)] = r
      newData[4 * (y1 + x) + 1] = g
      newData[4 * (y1 + x) + 2] = b
      newData[4 * (y1 + x) + 3] = 255 // force alpha to 255
    }
  }

  return newData
}

function convolve(data: Uint8ClampedArray, kernel: number[], channel: number): number {
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i + channel] * kernel[i / 4]
  }

  return sum
}

function sharpeningFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: ProcessorOptions,
): Uint8ClampedArray {
  checkThatAllOptionsAreProvidedAndValid(options, processors.sharpeningFilter)

  const newData = new Uint8ClampedArray(data.length)

  // get sobel map
  const sobelMap = sobelOperator(data, width, height)

  // determine what to consider as edge
  const isEdgeMap = new Uint8ClampedArray(sobelMap.length)
  for (let i = 0; i < sobelMap.length; i += 4) {
    const r = sobelMap[i]
    const g = sobelMap[i + 1]
    const b = sobelMap[i + 2]
    const a = sobelMap[i + 3]

    const isEdge = r + g + b > 3 * options.threshold
    isEdgeMap[i] = isEdge ? 255 : 0
    isEdgeMap[i + 1] = isEdge ? 255 : 0
    isEdgeMap[i + 2] = isEdge ? 255 : 0
    isEdgeMap[i + 3] = a
  }

  const gaussKernel = getGaussianKernel(options.radius)

  for (let i = 0; i < isEdgeMap.length; i += 4) {
    if (isEdgeMap[i] == 0) {
      // not an edge
      newData[i] = data[i]
      newData[i + 1] = data[i + 1]
      newData[i + 2] = data[i + 2]
      newData[i + 3] = data[i + 3]
    } else {
      // edge
      const blurredValues = getGaussianBlurForOnePixel(
        i / 4 % width,
        Math.floor(i / 4 / width),
        data,
        width,
        height,
        options.radius,
        gaussKernel,
      )
      
      newData[i] = blurredValues[0] + options.amount * (data[i] - blurredValues[0])
      newData[i + 1] = blurredValues[1] + options.amount * (data[i + 1] - blurredValues[1])
      newData[i + 2] = blurredValues[2] + options.amount * (data[i + 2] - blurredValues[2])
      newData[i + 3] = data[i + 3]
    
      /* for debug to only show raw difference of sharpenning
      newData[i] = (data[i] - blurredValues[0]) * options.amount
      newData[i + 1] = (data[i + 1] - blurredValues[1]) * options.amount
      newData[i + 2] = (data[i + 2] - blurredValues[2]) * options.amount
      newData[i + 3] = data[i + 3] * options.amount
      */
    }
  }

  return newData
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
  numberOfChannels: number,
  leftEdgeDuplicates: number = 0,
  rightEdgeDuplicates: number = 0,
  topEdgeDuplicates: number = 0,
  bottomEdgeDuplicates: number = 0,
): Uint8ClampedArray {
  const outLength =
    numberOfChannels *
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
      ind = numberOfChannels * (y1 + x)
      for (let chInd = 0; chInd < numberOfChannels; chInd++) {
        res[i + chInd] = data[ind + chInd]
      }
      i += numberOfChannels

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
    throw new Error(
      `i (${i}) != outLength (${outLength}). Parameters:\nxFrom=${xFrom},\nyFrom=${yFrom},\nxTo=${xTo},\nyTo=${yTo},\nwidth=${width},\nnumberOfChannels=${numberOfChannels},\nleftEdgeDuplicates=${leftEdgeDuplicates},\nrightEdgeDuplicates=${rightEdgeDuplicates},\ntopEdgeDuplicates=${topEdgeDuplicates},\nbottomEdgeDuplicates=${bottomEdgeDuplicates}`,
    )
  }

  return res
}

export function getWindowAroundPixel(
  x: number,
  y: number,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  numberOfChannels: number = 4,
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
    numberOfChannels,
    leftEdgeDuplicates,
    rightEdgeDuplicates,
    topEdgeDuplicates,
    bottomEdgeDuplicates,
  )

  return res
}
