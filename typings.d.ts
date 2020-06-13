declare namespace Neural {
  interface Network<T> {
    process: (input: T) => ProcessResult[][]
    costSummaryOf: (trainingDataFromInput: TrainingDataset<T>) => CostSummary
    trainWithBackwardPropagation: (trainingDataFromInput: TrainingDataset<T>) => TrainingResult<T>
    trainWithGradientDescent: (trainingDataFromInput: TrainingDataset<T>) => TrainingResult<T>
    getWeightsAndBiases: () => WeightsAndBias[][]
    apply: (weightsAndBiases: WeightsAndBias[][]) => Network<T>
    clone: () => Network<T>
    getNeurons: () => Neuron[][]
    toString: () => string
  }

  interface Neuron {}

  interface SavedValue {
    neuron: Neuron
    number: number
  }

  type Link = SavedValue & { dead?: boolean }
  type ProcessResult = SavedValue & { rawValue: number }

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

  interface Derivatives {
    outputError: number
    inputError: number
    accumulatedFromInputError: number
    numberOfAccumulatedErrors: number
    linksDerivatives: {
      neuron: Neuron
      outputError: number
      accumulatedError: number
      numberOfAccumulatedErrors: number
    }[]
  }

  type AfterEachNeuronTraining<T> = (
    network: Network<T>,
    round: number,
    iteration: number,
    total: number
  ) => void

  type ActivationFunction = {
    apply: (x: number) => number
    derivative: (x: number) => number
  }

  type ActivationFunctionName = keyof {
    [name: string]: ActivationFunction
  }
}
