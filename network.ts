import * as Neural from './typings.ts'

const activationFunctions: { [name: string]: Neural.ActivationFunction } = {
  tanh: {
    apply: (number: number) => Math.tanh(number),

    derivative: (number: number) => {
      const result = activationFunctions.tanh.apply(number)
      return 1 - result * result
    }
  },
  sigmoid: {
    apply: (number: number) => 1 / (1 + Math.exp(-number)),

    derivative: (number: number) => {
      const result = activationFunctions.sigmoid.apply(number)
      return result * (1 - result)
    }
  },
  exponentialLinearUnit: {
    apply: (number: number) => (number > 0 ? number : 15 * (Math.exp(number) - 1)),
    derivative: (number: number) => (number > 0 ? 1 : Math.exp(number))
  },
  rectifiedLinearUnit: {
    apply: (number: number) => Math.max(number, 0),
    derivative: (number: number) => (number > 0 ? 1 : 0)
  }
}

class Neuron implements Neural.Neuron {
  bias: number
  constructor(bias: number) {
    this.bias = bias
  }
}

class InputNeuron<T> extends Neuron {
  execute: (input: T) => number
  constructor(execute: (input: T) => number, bias: number) {
    super(bias)
    this.execute = execute
    this.bias = bias
  }

  process = (input: T) => {
    const combined = this.execute(input)
    return combined + this.bias
  }

  copy = (bias?: number) => new InputNeuron(this.execute, bias === undefined ? this.bias : bias)

  toString = () => JSON.stringify({ type: 'input', bias: this.bias })
}

class HiddenLayerNeuron extends Neuron {
  weights: Neural.Link[]
  constructor(weights: Neural.Link[], bias: number) {
    super(bias)
    this.weights = weights
  }

  compute(input: Neural.SavedValue[]) {
    const combined = input.reduce(
      (acc, { neuron, number }) =>
        acc + number * (this.weights.find(w => w.neuron === neuron) || { number: 0 }).number,
      0
    )
    return combined + this.bias
  }

  process = (input: Neural.SavedValue[]) => this.compute(input)

  copy = (weights?: Neural.Link[], bias?: number) =>
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
  constructor(weights: Neural.Link[], bias: number) {
    super(weights, bias)
  }

  process = (input: Neural.SavedValue[]) => {
    return super.compute(input)
  }

  copy = (weights?: Neural.Link[], bias?: number) =>
    new OutputNeuron(
      weights === undefined ? this.weights : weights,
      bias === undefined ? this.bias : bias
    )

  toString = () =>
    JSON.stringify({
      type: 'output',
      weights: this.weights.map((n, i) => [{ num: i, weight: n.number }]),
      bias: this.bias
    })
}

export class Network<T> implements Neural.Network<T> {
  private readonly neurons: Neuron[][]
  private readonly name: string
  private readonly activationFunction: Neural.ActivationFunctionName
  private readonly miniBatchLength?: number
  private readonly randomInit?: boolean
  private readonly afterEachNeuronTraining?: Neural.AfterEachNeuronTraining<T>

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
    weightsAndBiases?: Neural.WeightsAndBias[][]
    trainings?: Neural.TrainingDataset<T>
    miniBatchLength?: number
    activationFunction?: Neural.ActivationFunctionName
    randomInit?: boolean
    afterEachNeuronTraining?: Neural.AfterEachNeuronTraining<T>
  }) {
    this.name = name || 'anonymous network'
    this.miniBatchLength = miniBatchLength
    this.activationFunction = activationFunction || 'sigmoid'
    this.afterEachNeuronTraining = afterEachNeuronTraining
    this.randomInit = randomInit
    this.neurons = numberByLayer
      .map(n => Array(n).fill(0))
      .reduce((acc, value, i) => {
        return [
          ...acc,
          value.map((_, j) => {
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
                      (weightsAndBias.weights || [])[k] ||
                      (randomInit !== false ? Math.random() : 0)
                  })),
                  weightsAndBias.bias || (randomInit !== false ? Math.random() : 0)
                )
              : new HiddenLayerNeuron(
                  acc[i - 1].map((neuron2: Neuron, k: number) => ({
                    neuron: neuron2,
                    number:
                      (weightsAndBias.weights || [])[k] ||
                      (randomInit !== false ? Math.random() : 0)
                  })),
                  weightsAndBias.bias || (randomInit !== false ? Math.random() : 0)
                )
          })
        ]
      }, [])
    if (trainings && trainings.inputs.length) {
      const weightsAndBiases = this.trainWithGradientDescent(trainings).weightsAndBiases
      const trainedNetwork = this.apply(weightsAndBiases)
      this.neurons.splice(0, this.neurons.length)
      Array.prototype.push.apply(this.neurons, trainedNetwork.neurons)
    }
  }

  process = (input: T): Neural.ProcessResult[][] =>
    this.neurons.slice(1).reduce(
      (acc: Neural.ProcessResult[][], layer: Neuron[]) =>
        acc.concat([
          layer.map(n => {
            const rawValue = (n as HiddenLayerNeuron).process(acc.slice(-1)[0])
            return {
              neuron: n,
              rawValue,
              number: activationFunctions[this.activationFunction].apply(rawValue)
            }
          })
        ]),
      [
        this.neurons[0].map(n => {
          const rawValue = (n as InputNeuron<T>).process(input)
          return {
            neuron: n,
            rawValue,
            number: activationFunctions[this.activationFunction].apply(rawValue)
          }
        })
      ]
    )

  costSummaryOf = (trainingDataFromInput: Neural.TrainingDataset<T>): Neural.CostSummary => {
    let i = 0
    const { inputs, theory } = trainingDataFromInput.theory
      ? trainingDataFromInput
      : {
          inputs: trainingDataFromInput.inputs,
          theory: () => (trainingDataFromInput.expectedResults || [])[i++] || []
        }
    const costs = inputs.map((input: T) => {
      const result = this.process(input).slice(-1)[0]
      const expectedResult = theory!(input)
      const cost = result.reduce((acc, r, i) => acc + Math.pow(r.number - expectedResult[i], 2), 0)
      return cost
    })
    return { costs, average: costs.reduce((a: number, b: number) => a + b, 0) / inputs.length }
  }

  trainWithBackwardPropagation = (
    trainingDataFromInput: Neural.TrainingDataset<T>
  ): Neural.TrainingResult<T> => {
    const forwardAndBackwardPropagation = (trainingDataFromInput: Neural.TrainingDataset<T>) => {
      const activationDerivative = activationFunctions[this.activationFunction].derivative
      const trainingPartitions = this.partitionsOf(trainingDataFromInput)
      const partition = trainingPartitions[Math.floor(Math.random() * trainingPartitions.length)]
      return partition.inputs.map((input: T) => {
        const resultTable = this.process(input)
        const result = resultTable.slice(-1)[0].map(r => r.number)
        const expectedResult = partition.theory!(input)
        const derivatives: Neural.Derivatives[][] = Array(resultTable.length)
          .fill(0)
          .map((_, i): Neural.Derivatives[] =>
            Array(resultTable[i].length)
              .fill(0)
              .map((_, j) => ({
                outputError: 0,
                inputError: 0,
                accumulatedFromInputError: 0,
                numberOfAccumulatedErrors: 0,
                linksDerivatives: !(this.neurons[i][j] instanceof HiddenLayerNeuron)
                  ? []
                  : (this.neurons[i][j] as HiddenLayerNeuron).weights.map(weight => ({
                      neuron: weight.neuron,
                      outputError: 0,
                      number: 0,
                      accumulatedError: 0,
                      numberOfAccumulatedErrors: 0
                    }))
              }))
          )

        derivatives.slice(-1)[0].forEach((derivative, i) => {
          derivative.outputError = result[i] - expectedResult[i]
        })

        resultTable
          .slice()
          .reverse()
          .forEach((layer, invI) => {
            const i = resultTable.length - 1 - invI
            layer.forEach((subResult, j) => {
              const error = derivatives[i][j]
              const toCompensate = error.outputError * activationDerivative(subResult.rawValue)
              Object.assign(error, {
                inputError: toCompensate,
                accumulatedFromInputError: error.accumulatedFromInputError + toCompensate,
                numberOfAccumulatedErrors: error.numberOfAccumulatedErrors + 1
              })
            })
            layer.forEach((_, j) => {
              const derivative = derivatives[i][j]
              const neuron = this.neurons[i][j]
              if (neuron instanceof HiddenLayerNeuron) {
                neuron.weights
                  .filter(weight => !weight.dead)
                  .forEach(weight => {
                    const resultOfSourceNeuron =
                      resultTable[i - 1][this.neurons[i - 1].indexOf(weight.neuron as Neuron)]
                        .number
                    const outputError = derivative.inputError * resultOfSourceNeuron
                    const linkDerivative = derivative.linksDerivatives.find(
                      (linkDerivative1: Neural.Link) => linkDerivative1.neuron === weight.neuron
                    )!

                    Object.assign(linkDerivative, {
                      neuron: weight.neuron,
                      outputError,
                      accumulatedError: linkDerivative.accumulatedError + outputError,
                      numberOfAccumulatedErrors: linkDerivative.numberOfAccumulatedErrors + 1
                    })
                  })
              }
            })
            ;(i > 1 ? derivatives[i - 1] : []).forEach((derivative, j) => {
              derivative.outputError = this.neurons[i]
                .flatMap(n => {
                  const outputWeight = (n as HiddenLayerNeuron).weights.find(
                    w => w.neuron === this.neurons[i - 1][j]
                  )
                  return {
                    weight: outputWeight?.number,
                    inputError: derivatives[i][this.neurons[i].indexOf(n)].inputError
                  }
                })
                .reduce((acc, value) => acc + value!.weight! * value!.inputError, 0)
            })
          })

        return { input, derivatives }
      })
    }

    const applyDerivatives = (
      listOfDerivatives: Neural.Derivatives[][][],
      learningRate: number = 0.03,
      regularizationRate: number = 0
    ) => {
      const l1Regularization = (w: number) => (w < 0 ? -1 : w > 0 ? 1 : 0)
      const clone = this.clone()
      listOfDerivatives.forEach(derivatives =>
        derivatives.forEach((derivativesLayer, i) =>
          derivativesLayer.forEach((derivative, j) => {
            clone.neurons[i][j].bias -=
              derivative.numberOfAccumulatedErrors === 0
                ? 0
                : (learningRate * derivative.accumulatedFromInputError) /
                  derivative.numberOfAccumulatedErrors

            derivative.linksDerivatives.forEach((linkDerivative: Neural.Link, k: number) => {
              const weight = (clone.neurons[i][j] as HiddenLayerNeuron).weights[k]
              const diff =
                -(learningRate / linkDerivative.numberOfAccumulatedErrors) *
                linkDerivative.accumulatedError
              const regularization =
                learningRate *
                regularizationRate *
                (regularizationRate === 0 ? 0 : l1Regularization(weight.number))
              if (
                Math.sign(weight.number - diff) !== Math.sign(weight.number - diff - regularization)
              ) {
                weight.dead = true
                weight.number = 0
              } else weight.number = weight.number - diff - regularization
            })
          })
        )
      )
      return clone
    }

    const trainedNetwork = applyDerivatives(
      forwardAndBackwardPropagation(trainingDataFromInput).map(
        (mapping: any) => mapping.derivatives
      )
    )

    const remainingCosts = trainedNetwork.costSummaryOf(this.partitionsOf(trainingDataFromInput)[0])
    return {
      trainedNetwork: trainedNetwork as Neural.Network<T>,
      weightsAndBiases: trainedNetwork.getWeightsAndBiases(),
      remainingCost: remainingCosts.average,
      remainingCostList: remainingCosts.costs
    }
  }

  trainWithGradientDescent = (
    trainingDataFromInput: Neural.TrainingDataset<T>
  ): Neural.TrainingResult<T> => {
    const adjust = (owner: any, fieldName: string, render: () => number) => {
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
                        adjust(
                          weight,
                          'number',
                          () =>
                            clone.costSummaryOf(
                              trainingPartitions[iteration % trainingPartitions.length]
                            ).average
                        )
                      )
                    : [],
                bias: adjust(
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
        weights: ((n as any).weights || []).map((w: Neural.SavedValue) => w.number)
      }))
    )

  getNeurons = () => this.neurons.map(l => l.map(n => (n as any).copy())) as Neural.Neuron[][]

  apply = (weightsAndBiases: Neural.WeightsAndBias[][]) =>
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

  private partitionsOf = (trainingData: Neural.TrainingDataset<T>): Neural.TrainingDataset<T>[] => {
    if (!this.miniBatchLength) return [trainingData]
    const associatedInputsAndResults = trainingData.inputs
      .map((input: T, i: number) => ({
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
            .map((association: any) => association.input),
          theory:
            trainingData.theory ||
            (() => (trainingData.expectedResults || []).slice(first, last)[counter++] || [])
        }
      })
  }
}
