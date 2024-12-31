
 export interface Network<T> {
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

 export interface Neuron {}

 export interface SavedValue {
    neuron: Neuron;
    number: number;
  }

 export type Link = SavedValue & { accumulatedError: number; numberOfAccumulatedErrors: number; dead?: boolean }
 export type ProcessResult = SavedValue & { rawValue: number }

 export interface TrainingDataset<T> {
    inputs: T[]
    expectedResults?: number[][]
    rounds?: number
    theory?: (input: T) => number[]
  }

 export interface CostSummary {
    costs: number[]
    average: number
  }

 export interface TrainingResult<T> {
    weightsAndBiases: WeightsAndBias[][]
    remainingCost: number
    remainingCostList: number[]
    trainedNetwork: Network<T>
  }

 export interface WeightsAndBias {
    bias?: number
    weights?: number[]
  }

 export interface Derivatives {
    outputError: number
    inputError: number
    accumulatedFromInputError: number
    numberOfAccumulatedErrors: number
    linksDerivatives: {
      neuron: Neuron;
      outputError: number;
      number: number;
      accumulatedError: number
      numberOfAccumulatedErrors: number
    }[]
  }

  export type AfterEachNeuronTraining<T> = (
    network: Network<T>,
    round: number,
    iteration: number,
    total: number
  ) => void

  export type ActivationFunction = {
    apply: (x: number) => number
    derivative: (x: number) => number
  }

  export type ActivationFunctionName = keyof {
    [name: string]: ActivationFunction
  }
  
