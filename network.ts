interface SavedValue {
  neuron: Neuron
  number: number
}
interface TrainingDataset<T> {
  inputs: T[]
  expectedResults?: number[][]
  rounds?: number
  theory?: (input: T) => number[]
}
interface CostSummary {
  costs: number[]
  average: number
}
interface TrainingResult<T> {
  weightsAndBiases: WeightsAndBias[][]
  remainingCost: number
  remainingCostList: number[]
  trainedNetwork: Network<T>
}
interface WeightsAndBias {
  bias?: number
  weights?: number[]
}
type ActivationFunction = 'sigmoid' | 'rectifiedLinearUnit' | 'exponentialLinearUnit'

class Neuron {
  sigmoid(number: number) {
    return 1 / (1 + Math.exp(-number))
  }

  exponentialLinearUnit(number: number) {
    return number > 0 ? number : 15 * (Math.exp(number) - 1)
  }

  rectifiedLinearUnit(number: number) {
    return Math.max(number, 0)
  }
}

class InputNeuron<T> extends Neuron {
  execute: (input: T) => number
  bias: number
  constructor(execute: (input: T) => number, bias: number) {
    super()
    this.execute = execute
    this.bias = bias
  }

  process = (input: T, activationFunction: ActivationFunction) => {
    const combined = this.execute(input)
    return this[activationFunction](combined + this.bias)
  }

  copy = (bias?: number) => new InputNeuron(this.execute, bias === undefined ? this.bias : bias)

  toString = () => JSON.stringify({ type: 'input', bias: this.bias })
}

class HiddenLayerNeuron extends Neuron {
  weights: SavedValue[]
  bias: number
  constructor(weights: SavedValue[], bias: number) {
    super()
    this.bias = bias
    this.weights = weights
  }

  compute(input: SavedValue[], activationFunction: ActivationFunction) {
    const combined = input.reduce(
      (acc, { neuron, number }) =>
        acc + number * (this.weights.find(w => w.neuron === neuron) || { number: 0 }).number,
      0
    )
    return this[activationFunction](combined + this.bias)
  }

  process = (input: SavedValue[], activationFunction: ActivationFunction) =>
    this.compute(input, activationFunction)

  copy = (weights?: SavedValue[], bias?: number) =>
    new HiddenLayerNeuron(
      weights === undefined ? this.weights : weights,
      bias === undefined ? this.bias : bias
    )

  toString = () =>
    JSON.stringify({
      type: 'normal',
      weights: this.weights.map((n, i) => [{ num: i, weight: n.number }]),
      bias: this.bias
    })
}

class OutputNeuron extends HiddenLayerNeuron {
  private result: number
  constructor(weights: SavedValue[], bias: number, result?: number) {
    super(weights, bias)
    this.result = result === undefined ? 0 : result
  }

  process = (input: SavedValue[], activationFunction: ActivationFunction) => {
    this.result = super.compute(input, activationFunction)
    return this.result
  }

  copy = (weights?: SavedValue[], bias?: number) =>
    new OutputNeuron(
      weights === undefined ? this.weights : weights,
      bias === undefined ? this.bias : bias,
      this.result
    )

  toString = () =>
    JSON.stringify({
      type: 'output',
      result: this.result,
      weights: this.weights.map((n, i) => [{ num: i, weight: n.number }]),
      bias: this.bias
    })
}

export class Network<T> {
  private readonly neurons: Neuron[][]
  private readonly name: string
  private readonly activationFunction: ActivationFunction
  private readonly miniBatchLength?: number
  private readonly randomInit?: boolean
  private readonly afterEachNeuronTraining?: (
    network: Network<T>,
    round: number,
    iteration: number,
    total: number
  ) => void

  constructor({
    name,
    numberByLayer,
    parameters,
    weightsAndBiases,
    trainings,
    miniBatchLength,
    activationFunction,
    randomInit,
    afterEachNeuronTraining
  }: {
    name?: string
    numberByLayer: number[]
    parameters: ((input: T) => number)[]
    weightsAndBiases?: WeightsAndBias[][]
    trainings?: TrainingDataset<T>
    miniBatchLength?: number
    activationFunction?: ActivationFunction
    randomInit?: boolean
    afterEachNeuronTraining?: (
      network: Network<T>,
      round: number,
      iteration: number,
      total: number
    ) => void
  }) {
    this.name = name || 'anonymous network'
    this.miniBatchLength = miniBatchLength
    this.activationFunction = activationFunction || 'sigmoid'
    this.afterEachNeuronTraining = afterEachNeuronTraining
    this.randomInit = randomInit
    this.neurons = numberByLayer
    .map(n => Array(n).fill(0))
    .reduce((acc, value, i) => {
      return [...acc, value.map((_, j) => {
        const weightsAndBias = ((weightsAndBiases || [])[i] || [])[j] || { weights: [] }
        return i === 0
            ? new InputNeuron(
                parameters[j],
                weightsAndBias.bias || (randomInit !== false ? Math.random() : 0)
              )
            : i === numberByLayer.length - 1
            ? new OutputNeuron(
                acc[i - 1].map((neuron2: Neuron, k: number) => ({
                  neuron: neuron2,
                  number:
                    (weightsAndBias.weights || [])[k] || (randomInit !== false ? Math.random() : 0)
                })),
                weightsAndBias.bias || (randomInit !== false ? Math.random() : 0)
              )
            : new HiddenLayerNeuron(
              acc[i - 1].map((neuron2: Neuron, k: number) => ({
                  neuron: neuron2,
                  number:
                    (weightsAndBias.weights || [])[k] || (randomInit !== false ? Math.random() : 0)
                })),
                weightsAndBias.bias || (randomInit !== false ? Math.random() : 0)
              )
      })]}, [])
    if (trainings && trainings.inputs.length) {
      const weightsAndBiases = this.trainAndGetGradientDescent(trainings).weightsAndBiases
      const trainedNetwork = this.apply(weightsAndBiases)
      this.neurons.splice(0, this.neurons.length)
      Array.prototype.push.apply(this.neurons, trainedNetwork.neurons)
    }
  }

  process = (input: T) =>
    this.neurons
      .slice(1)
      .reduce(
        (acc: SavedValue[], layer: Neuron[]) =>
          layer.map(n => ({
            neuron: n,
            number: (n as HiddenLayerNeuron).process(acc, this.activationFunction)
          })),
        this.neurons[0].map(n => ({
          neuron: n,
          number: (n as InputNeuron<T>).process(input, this.activationFunction)
        }))
      )
      .map(savedValue => (savedValue as SavedValue).number)

  costSummaryOf = (trainingDataFromInput: TrainingDataset<T>): CostSummary => {
    let i = 0
    const { inputs, theory } = trainingDataFromInput.theory
      ? trainingDataFromInput
      : {
          inputs: trainingDataFromInput.inputs,
          theory: () => (trainingDataFromInput.expectedResults || [])[i++] || []
        }
    const costs = inputs.map(input => {
      const result = this.process(input)
      const expectedResult = theory!(input)
      const cost = result.reduce((acc, r, i) => acc + Math.pow(r - expectedResult[i], 2), 0)
      return cost
    })
    return { costs, average: costs.reduce((a, b) => a + b, 0) / inputs.length }
  }

  trainAndGetGradientDescent = (trainingDataFromInput: TrainingDataset<T>): TrainingResult<T> => {
    const clone = this.clone()
    const weightsAndBiases = Array(trainingDataFromInput.rounds || 1)
      .fill(0)
      .reduce((_a, _b, round) => {
        const trainingPartitions = this.partitionsOf(trainingDataFromInput)
        return clone.neurons
          .slice()
          .reverse()
          .map((layer: Neuron[], i: number, neurons: Neuron[][]) =>
            layer.map((neuron, j) => {
              const iteration =
                neurons.slice(0, i).reduce((acc, value) => acc + value.length, 0) + j
              const total = neurons.reduce((acc, value) => acc + value.length, 0)
              const result = {
                weights:
                  neuron instanceof HiddenLayerNeuron
                    ? (neuron as HiddenLayerNeuron).weights.map(weight =>
                        clone.adjust(
                          weight,
                          'number',
                          () =>
                            clone.costSummaryOf(
                              trainingPartitions[iteration % trainingPartitions.length]
                            ).average
                        )
                      )
                    : [],
                bias: clone.adjust(
                  neuron,
                  'bias',
                  () =>
                    clone.costSummaryOf(trainingPartitions[iteration % trainingPartitions.length])
                      .average
                )
              }
              if (clone.afterEachNeuronTraining) {
                clone.afterEachNeuronTraining(clone, round, iteration, total)
              }
              return result
            })
          )
          .reverse()
      }, {})
    const remainingCosts = clone.costSummaryOf(this.partitionsOf(trainingDataFromInput)[0])
    return {
      weightsAndBiases,
      remainingCost: remainingCosts.average,
      remainingCostList: remainingCosts.costs,
      trainedNetwork: clone
    }
  }

  getWeightsAndBiases = () =>
    this.neurons.map(l =>
      l.map(n => ({
        bias: (n as any).bias,
        weights: ((n as any).weights || []).map((w: SavedValue) => w.number)
      }))
    )

  apply = (weightsAndBiases: WeightsAndBias[][]) =>
    new Network<T>({
      name: `trained from '${this.name}'`.substring(0, 100),
      numberByLayer: this.neurons.map(l => l.length),
      parameters: this.neurons[0].map(n => (n as InputNeuron<T>).execute),
      miniBatchLength: this.miniBatchLength,
      activationFunction: this.activationFunction,
      afterEachNeuronTraining: this.afterEachNeuronTraining,
      randomInit: this.randomInit,
      weightsAndBiases
    })

  clone = () =>
    new Network<T>({
      name: `cloned from '${this.name}'`.substring(0, 100),
      numberByLayer: this.neurons.map(l => l.length),
      parameters: this.neurons[0].map(n => (n as InputNeuron<T>).execute),
      miniBatchLength: this.miniBatchLength,
      activationFunction: this.activationFunction,
      afterEachNeuronTraining: this.afterEachNeuronTraining,
      randomInit: this.randomInit,
      weightsAndBiases: this.getWeightsAndBiases()
    })

  toString = () =>
    `Network name : ${this.name} ${this.neurons
      .map((layer, i) => `layer ${i}: ${layer}`)
      .join('\n ')}`

  private partitionsOf = (trainingData: TrainingDataset<T>): TrainingDataset<T>[] => {
    if (!this.miniBatchLength) return [trainingData]
    const associatedInputsAndResults = trainingData.inputs
      .map((input, i) => ({
        input,
        expectedResult: (trainingData.expectedResults || [])[i++] || []
      }))
      .sort(() => Math.random() - 0.5)
    const numberOfPartitions = this.neurons.reduce((acc, value) => acc + value.length, 0)
    return Array(numberOfPartitions)
      .fill(0)
      .map((_, i) => {
        let counter = 0
        const first = (associatedInputsAndResults.length / numberOfPartitions) * i
        const last = Math.min(
          first + (this.miniBatchLength || associatedInputsAndResults.length),
          (associatedInputsAndResults.length / numberOfPartitions) * (i + 1) - 1
        )
        return {
          inputs: associatedInputsAndResults
            .slice(first, last)
            .map(association => association.input),
          theory:
            trainingData.theory ||
            (() => (trainingData.expectedResults || []).slice(first, last)[counter++] || [])
        }
      })
  }

  private adjust = (owner: any, fieldName: string, render: () => number) => {
    let increment = 0.0000000002
    let adjustment = 0
    let lastAdustment = 0
    while (increment > 0.0000000001) {
      const actualCost = render()
      owner[fieldName] -= increment
      const leftNewCost = render()
      owner[fieldName] += increment * 2
      const rightNewCost = render()
      owner[fieldName] -= increment
      const direction =
        leftNewCost < rightNewCost && leftNewCost < actualCost
          ? -1
          : rightNewCost < leftNewCost && rightNewCost < actualCost
          ? 1
          : leftNewCost < rightNewCost && leftNewCost < actualCost
          ? -1
          : rightNewCost < leftNewCost && rightNewCost < actualCost
          ? 1
          : leftNewCost < actualCost
          ? -1
          : rightNewCost < actualCost
          ? 1
          : 0
      owner[fieldName] += direction * increment
      lastAdustment = adjustment
      if (adjustment + direction * increment === lastAdustment) {
        return adjustment + direction * increment
      }
      adjustment += direction * increment
      increment = direction === 0 ? increment / 2 : increment * 2
    }
    return adjustment
  }
}
