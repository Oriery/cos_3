export type ImageProcessingFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: ProcessorOptions,
) => Uint8ClampedArray

export type ImageProcessor = {
  id: string
  name: string
  fn: ImageProcessingFn,
  options: ProcessorOptionDescr[],
}

export const processors : Record<string, ImageProcessor> = {
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
        defaultValue: 1,
        min: 1,
        max: 10,
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

function boxBlur(data: Uint8ClampedArray, width: number, height: number, options: ProcessorOptions): Uint8ClampedArray {
  checkThatAllOptionsAreProvidedAndValid(options, processors.boxBlur)

  const newData = new Uint8ClampedArray(data.length)

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

      const n = neighbors.length / 4
      newData[4 * (y * width + x)] = rSum / n
      newData[4 * (y * width + x) + 1] = gSum / n
      newData[4 * (y * width + x) + 2] = bSum / n
      newData[4 * (y * width + x) + 3] = aSum / n
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
        `Option ${option.id} is out of range: ${options[option.id]} is not in [${option.min}, ${option.max}]`,
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
) : Uint8ClampedArray {
  const res = new Uint8ClampedArray(4 * (xTo - xFrom) * (yTo - yFrom))

  let i = 0
  let y1 = 0
  let ind = 0
  for (let y = yFrom; y < yTo; y++) {
    y1 = y * width
    for (let x = xFrom; x < xTo; x++) {
      ind = 4 * (y1 + x)
      res[i] = data[ind]
      res[i + 1] = data[ind + 1]
      res[i + 2] = data[ind + 2]
      res[i + 3] = data[ind + 3]
      i += 4
    }
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
  const xFrom = Math.max(x - radius, 0)
  const yFrom = Math.max(y - radius, 0)
  const xTo = Math.min(x + radius + 1, width)
  const yTo = Math.min(y + radius + 1, height)

  return getWindow(xFrom, yFrom, xTo, yTo, data, width)
}
