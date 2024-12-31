import { Network } from './network.ts'
import * as Neural from './typings.ts'
import { train_with_gradient_descent } from './rust/pkg/rust.js'

type Activation = { activated: boolean; confidence: number }[][]
type Coords = { x: number; y: number }

const currentNetwork: (Neural.Network<Coords> | undefined)[] = []
const continuousTrainingInterval: number[] = []
class Grid {
  context: any
  zoom: number
  width: number
  height: number
  constructor(element: any, { width, height }: { width: string; height: string }) {
    const canvas = element
    this.context = canvas.getContext('2d')
    this.zoom = 1 / 40
    this.width = parseInt(width)
    this.height = parseInt(height)
    canvas.width = this.width
    canvas.height = this.height
  }

  clearRect() {
    this.context.clearRect(0, 0, this.width, this.height)
    return this
  }

  maxX() {
    return 1 / (this.zoom * 2)
  }

  minX() {
    return -1 / (this.zoom * 2)
  }

  maxY() {
    return (this.maxX() * this.height) / this.width
  }

  minY() {
    return (this.minX() * this.height) / this.width
  }

  xCoords(x: number) {
    return ((x - this.minX()) / (this.maxX() - this.minX())) * this.width
  }

  yCoords(y: number) {
    return this.height - ((y - this.minY()) / (this.maxY() - this.minY())) * this.height
  }

  xTickDelta() {
    return 1
  }

  yTickDelta() {
    return 1
  }

  drawAxes() {
    this.context.save()
    this.context.strokeStyle = '#000000'
    this.context.linewidth = 2
    // +Y axis
    this.context.beginPath()
    this.context.moveTo(this.xCoords(0), this.yCoords(0))
    this.context.lineTo(this.xCoords(0), this.yCoords(this.maxY()))
    this.context.stroke()

    this.context.beginPath()
    this.context.moveTo(this.xCoords(0), this.yCoords(0))
    this.context.lineTo(this.xCoords(0), this.yCoords(this.minY()))
    this.context.stroke()

    let delta = this.yTickDelta()
    for (let i = 1; i * delta < this.maxY(); ++i) {
      this.context.beginPath()
      this.context.moveTo(this.xCoords(0) - 5, this.yCoords(i * delta))
      this.context.lineTo(this.xCoords(0) + 5, this.yCoords(i * delta))
      this.context.stroke()
    }

    delta = this.yTickDelta()
    for (let i = 1; i * delta > this.minY(); --i) {
      this.context.beginPath()
      this.context.moveTo(this.xCoords(0) - 5, this.yCoords(i * delta))
      this.context.lineTo(this.xCoords(0) + 5, this.yCoords(i * delta))
      this.context.stroke()
    }

    this.context.beginPath()
    this.context.moveTo(this.xCoords(0), this.yCoords(0))
    this.context.lineTo(this.xCoords(this.maxX()), this.yCoords(0))
    this.context.stroke()

    this.context.beginPath()
    this.context.moveTo(this.xCoords(0), this.yCoords(0))
    this.context.lineTo(this.xCoords(this.minX()), this.yCoords(0))
    this.context.stroke()

    delta = this.xTickDelta()
    for (let i = 1; i * delta < this.maxX(); ++i) {
      this.context.beginPath()
      this.context.moveTo(this.xCoords(i * delta), this.yCoords(0) - 5)
      this.context.lineTo(this.xCoords(i * delta), this.yCoords(0) + 5)
      this.context.stroke()
    }

    delta = this.xTickDelta()
    for (var i = 1; i * delta > this.minX(); --i) {
      this.context.beginPath()
      this.context.moveTo(this.xCoords(i * delta), this.yCoords(0) - 5)
      this.context.lineTo(this.xCoords(i * delta), this.yCoords(0) + 5)
      this.context.stroke()
    }
    this.context.restore()
    return this
  }

  drawCircle(x: number, y: number, radius: number, color: string) {
    this.context.strokeStyle = color
    this.context.beginPath()
    this.context.arc(this.xCoords(x), this.yCoords(y), radius, 0, 2 * Math.PI, true)
    this.context.stroke()
    return this
  }

  writeText(text: string) {
    this.context.strokeStyle = '#000000'
    this.context.font = '20px Roboto'
    this.context.fillText(text, this.width - (text || '').length * 10, 15)
    return this
  }

  redraw(activation?: Activation, theory?: boolean[][], remainingCost?: number) {
    this.clearRect()
    if (activation || theory) {
      for (let x = this.minX(); x <= this.maxX(); x += 0.1) {
        for (let y = this.minY(); y <= this.maxY(); y += 0.1) {
          const indexX = Math.floor((x - this.minX()) * 10)
          const indexY = Math.floor((y - this.minY()) * 10)
          if (activation && activation[indexX][indexY] && activation[indexX][indexY].activated) {
            const valueInHex = activation[indexX][indexY].confidence.toString(16).padStart(2, '0')
            const invValueInHex = (256 - activation[indexX][indexY].confidence)
              .toString(16)
              .padStart(2, '0')
            this.drawCircle(x, y, 1, `#${invValueInHex}${valueInHex}00`)
          }
          if (theory && theory[indexX][indexY]) {
            this.drawCircle(x, y, 0.1, '#0000FF')
          }
        }
      }
    }
    if (remainingCost) this.writeText(`Remaining cost : ${Math.round(remainingCost * 100) / 100}`)
    this.drawAxes()
    return this
  }
}

const doc = (window as any).document as any

const theGrid = new Grid(
  doc.getElementById('canvas'),
  (window as any).getComputedStyle(doc.getElementById('canvas'))
).redraw()

export const eraseCurrentNetwork = function () {
  currentNetwork[0] = undefined
}.bind(this, currentNetwork)

export const updateTheory = function (grid: Grid) {
  const theoryAsJS = toJavascriptExpr(doc.getElementById('theory').value)
  let theoryFunction
  try {
    theoryFunction = eval(`({x,y}) => ${theoryAsJS.trim() || 'false'} ? [1] : [0]`)
    doc.getElementById('actionTraining').disabled = false
    doc.getElementById('actionOneTraining').disabled = false
  } catch (e) {
    doc.getElementById('actionTraining').disabled = true
    doc.getElementById('actionOneTraining').disabled = true
  }
  grid.redraw(undefined, getTheoryBitmap(grid, theoryFunction))
}.bind(this, theGrid)

export const importWeightsAndBiasesFromFile = function (
  grid: Grid,
  network: (Neural.Network<Coords> | undefined)[]
) {
  if (!doc.getElementById('fileinput').files || !doc.getElementById('fileinput').files.length)
    return
  const fileReader = new (window as any).FileReader()
  fileReader.onload = () => {
    const { weightsAndBiases, parameters, theory, layersLength } = JSON.parse(fileReader.result)
    doc.getElementById('parameter1').value = (parameters && parameters[0]) || ''
    doc.getElementById('parameter2').value = (parameters && parameters[1]) || ''
    doc.getElementById('parameter3').value = (parameters && parameters[2]) || ''
    doc.getElementById('parameter4').value = (parameters && parameters[3]) || ''
    doc.getElementById('theory').value = theory
    doc.getElementById('layer1').value =
      layersLength.length > 2
        ? `${layersLength[1]} Neuron${layersLength[1] > 1 ? 's' : ''}`
        : 'None'
    Array.from(doc.getElementById('layer1Choices').getElementsByTagName('li')).map((e: any, i) => {
      const value = layersLength.length > 2 ? layersLength[1] === i : i === 0
      e.dataset['selected'] = `${value}`
      e.selected = value
      if (value) e.classList.add('selected')
      else e.classList.remove('selected')
    })
    Array.from(doc.getElementById('layer2Choices').getElementsByTagName('li')).map((e: any, i) => {
      const value = layersLength.length > 3 ? layersLength[2] === i : i === 0
      e.dataset['selected'] = `${value}`
      e.selected = value
      if (value) e.classList.add('selected')
      else e.classList.remove('selected')
    })
    doc.getElementById('layer2').value =
      layersLength.length > 3
        ? `${layersLength[2]} Neuron${layersLength[2] > 1 ? 's' : ''}`
        : 'None'
    network[0] = networkBuiltFromDOM().apply(weightsAndBiases)
    const theoryAsJS = toJavascriptExpr(theory)
    const theoryFunction = eval(`({x,y}) => ${theoryAsJS.trim() || 'false'} ? [1] : [0]`)
    grid.redraw(getActivationBitmap(grid, network[0]), getTheoryBitmap(grid, theoryFunction))
    doc.getElementById('actionWeightsAndBiases').disabled = false
  }
  fileReader.readAsText(doc.getElementById('fileinput').files[0])
  doc.getElementById('fileinput').value = ''
}.bind(this, theGrid, currentNetwork)

export const weightsAndBiases = function (network: (Neural.Network<Coords> | undefined)[]) {
  const weightsAndBiases = network[0]!.getWeightsAndBiases()
  const parameters = [
    doc.getElementById('parameter1').value,
    doc.getElementById('parameter2').value,
    doc.getElementById('parameter3').value,
    doc.getElementById('parameter4').value
  ]
    .filter(v => v)
    .map(e => ' ' + e + ' ')
  const theory = ' ' + doc.getElementById('theory').value + ' '
  const layersLength = network[0]!.getNeurons().map((l: Neural.Neuron[]) => l.length)
  const link = doc.createElement('a')
  link.style.display = 'none'
  link.href = `data:application/json,${JSON.stringify({
    weightsAndBiases,
    parameters,
    theory,
    layersLength
  })}`
  link.download = 'weightsAndBiases.json'
  doc.body.appendChild(link)
  link.click()
}.bind(this, currentNetwork)

export const continuousTraining = function (interval: (number | undefined)[]) {
  if (interval[0]) {
    clearInterval(interval[0])
    interval[0] = undefined
    doc.getElementById('actionIconRowing').innerText = 'rowing'
    doc.getElementById('actionOneTraining').disabled = false
    return
  }
  doc.getElementById('actionIconRowing').innerText = 'stop'
  doc.getElementById('actionOneTraining').disabled = true
  let inprogress = false
  doc.getElementById('trainingSize').value = '100'
  interval[0] = setInterval(() => {
    if (!inprogress) {
      inprogress = true
      training().then(() => {
        inprogress = false
      })
    }
  }, 200)
}.bind(this, continuousTrainingInterval)

export const training = function (grid: Grid, whereToSave: (Neural.Network<Coords> | undefined)[]) {
  doc.body.style.cursor = 'wait'
  return train(
    networkBuiltFromDOM(),
    ' ' + doc.getElementById('theory').value + ' ',
    doc.getElementById('trainingSize').value,
    doc.getElementById('variablesAmplitude').value
  ).then((value: any) => {
    const {
      theory,
      trainedNetwork,
      weightsAndBiases,
      remainingCost
    }: {
      theory: (coords: Coords) => number[]
      trainedNetwork: Neural.Network<Coords>
      weightsAndBiases: Neural.WeightsAndBias[][]
      remainingCost: number
    } = value
    const network = (currentNetwork[0] ?? networkBuiltFromDOM()).apply(weightsAndBiases)
    const activation = getActivationBitmap(grid, network)
    const theoryResult = getTheoryBitmap(grid, theory)
    whereToSave[0] = network
    doc.getElementById('actionWeightsAndBiases').disabled = false
    grid.redraw(activation, theoryResult, remainingCost || 1)
    doc.body.style.cursor = 'pointer'
  })
}.bind(this, theGrid, currentNetwork)

function getActivationBitmap(grid: Grid, network?: Neural.Network<Coords>): Activation {
  let sum = 0
  if (!network) return Array(0)
  for (let x = grid.minX(); x <= grid.maxX(); x += 0.1) {
    for (let y = grid.minY(); y <= grid.maxY(); y += 0.1) {
      sum += network
        .process({
          x,
          y
        })
        .slice(-1)[0][0].number
    }
  }
  const average = sum / ((grid.maxX() - grid.minX()) * 10 * (grid.maxY() - grid.minY()) * 10)
  return Array(Math.ceil((grid.maxX() - grid.minX()) * 10))
    .fill(Array(Math.ceil((grid.maxY() - grid.minY()) * 10)).fill(undefined))
    .map((row, i) =>
      row.map((cell: any, j: number) => {
        const value = network
          .process({
            x: grid.minX() + i * 0.1,
            y: grid.minY() + j * 0.1
          })
          .slice(-1)[0][0].number
        return {
          activated: value >= average && value > 1e-10,
          confidence: Math.min(255, Math.max(0, Math.floor(value * 256)))
        }
      })
    )
}

function getTheoryBitmap(grid: Grid, theory: (coords: Coords) => number[]) {
  return Array(Math.ceil((grid.maxX() - grid.minX()) * 10))
    .fill(Array(Math.ceil((grid.maxY() - grid.minY()) * 10)).fill(undefined))
    .map((row, i) =>
      row.map(
        (cell: any, j: number) =>
          theory?.({
            x: grid.minX() + i * 0.1,
            y: grid.minY() + j * 0.1
          })?.[0] ?? 0 >= 1
      )
    )
}

function toJavascriptExpr(expr: string) {
  return expr
    .replace(/ <> /g, ' !== ')
    .replace(/ = /g, ' === ')
    .replace(/</g, ' < ')
    .replace(/>/g, ' > ')
    .replace(/([+*/-])/g, ' $1 ')
    .replace(/([\s]+)(cos|sin|tan|sqrt)\(/g, '$1Math.$2(')
    .replace(/e\^([^\s]+)/g, 'Math.exp($1)')
    .replace(/\(([^)]+)\)\^([^\s]+)/g, 'Math.pow($1, $2)')
    .replace(/([^\s]+)\^([^\s]+)/g, 'Math.pow($1, $2)')
    .replace(/\|([^|]+)\|/g, 'Math.abs($1)')
}

const networkBuiltFromDOM = () =>
  new Network<Coords>(
    inputToNetworkConstructorParams(
      [
        doc.getElementById('parameter1').value,
        doc.getElementById('parameter2').value,
        doc.getElementById('parameter3').value,
        doc.getElementById('parameter4').value
      ]
        .filter(v => v)
        .map(e => ' ' + e + ' '),
      doc.getElementById('layer1').value,
      doc.getElementById('layer2').value,
      doc.getElementsByName('activation')[0].value
    )
  )

const inputToNetworkConstructorParams = (
  parametersAsExprs: string[],
  layer1: string,
  layer2: string,
  activationFunction: string
) => {
  const parametersAsJS = parametersAsExprs.map(p => toJavascriptExpr(p))
  const parameters = parametersAsJS.map((param, i) => eval('({x,y}) => ' + parametersAsJS[i]))
  const numberByLayer = [parameters.length]
    .concat(layer1 && layer1 !== 'None' ? Array(1).fill(parseInt(layer1)) : [])
    .concat(layer2 && layer2 !== 'None' ? Array(1).fill(parseInt(layer2)) : [])
    .concat([1])
  return {
    numberByLayer,
    activationFunction,
    randomInit: true,
    parameters
  }
}

const train = function (
  currentNetwork: (Neural.Network<Coords> | undefined)[],
  networkBuiltFromDOM: Neural.Network<Coords>,
  theoryAsExpr: string,
  trainingSizeAsString: string,
  variablesAmplitudeAsString: string
) {
  const variablesAmplitude = parseInt(variablesAmplitudeAsString)
  const theoryAsJS = toJavascriptExpr(theoryAsExpr)
  const theory = eval(`({x,y}) => ${theoryAsJS.trim() || 'false'} ? [1] : [0]`)
  const trainingSize = parseInt(trainingSizeAsString)
  const inputs = new Array(trainingSize)
    .fill(undefined)
    .map((_, i) => {
      const amplitude = i < trainingSize / 3 ? 5 : i < trainingSize / 2 ? 10 : variablesAmplitude
      return {
        x: Math.floor(Math.random() * amplitude * 100 - (amplitude * 100) / 2) / 100,
        y: Math.floor(Math.random() * amplitude * 100 - (amplitude * 100) / 2) / 100
      }
    })
    .sort(() => Math.random() - 0.5)
  return new Promise(resolve => {
    const network = (currentNetwork[0] || networkBuiltFromDOM) as Neural.Network<Coords>

    resolve({...JSON.parse(train_with_gradient_descent([
      doc.getElementById('parameter1').value,
      doc.getElementById('parameter2').value,
      doc.getElementById('parameter3').value,
      doc.getElementById('parameter4').value,
    ].filter(Boolean),
      Uint32Array.from([(isNaN(parseInt(doc.getElementById('layer1').value)) ? 0 : parseInt(doc.getElementById('layer1').value)),
      (isNaN(parseInt(doc.getElementById('layer2').value)) ? 0 : parseInt(doc.getElementById('layer2').value))]
        .filter(Boolean)),
      doc.getElementsByName('activation')[0].value,
      parseInt(doc.getElementById('trainingSize').value),
      [doc.getElementById('theory').value],
      10,
      1,
      Float64Array.from(currentNetwork[0]?.getWeightsAndBiases?.()?.flat?.()?.map(n => n.weights)?.flat?.() ?? []),
      Float64Array.from(currentNetwork[0]?.getWeightsAndBiases?.()?.flat?.()?.map(n => n.bias) ?? []),
    )), theory})

    /*resolve({
      ...network.trainWithGradientDescent({
        inputs,
        theory
      }),
      theory
    })*/
  })
}.bind(this, currentNetwork)
