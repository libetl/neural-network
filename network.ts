class Neuron {
  sigmoid(number: number) {
    return 1 / (1 + Math.exp(-number));
  }
}

interface SavedValue {
  neuron: Neuron;
  number: number;
}

interface TrainingDataset<T> {
  inputs: T[];
  expectedResults?: number[][];
  theory?: (input: T) => number[];
}

interface CostSummary {
  costs: number[];
  average: number;
}

interface TrainingResult<T> {
  weightsAndBiases: WeightsAndBias[][];
  remainingCost: number;
  remainingCostList: number[];
  trainedNetwork: Network<T>;
}

interface WeightsAndBias {
  bias?: number;
  weights?: number[];
}

class InputNeuron<T> extends Neuron {
  execute: (input: T) => number;
  bias: number;

  constructor(execute: (input: T) => number, bias: number) {
    super();
    this.execute = execute;
    this.bias = bias;
  }

  process = (input: T) => {
    const combined = this.execute(input);
    return 1 / (1 + Math.exp(-(combined + this.bias)));
  };

  copy = (bias?: number) =>
    new InputNeuron(this.execute, bias === undefined ? this.bias : bias);

  toString = () => (JSON.stringify({ type: "input", bias: this.bias }));
}

class HiddenLayerNeuron extends Neuron {
  weights: SavedValue[];
  bias: number;

  constructor(weights: SavedValue[], bias: number) {
    super();
    this.bias = bias;
    this.weights = weights;
  }

  compute(input: SavedValue[]) {
    const combined = input.reduce(
      (acc, { neuron, number }) =>
        acc +
        (number *
          (this.weights.find((w) => w.neuron === neuron) || { number: 0 })
            .number),
      0,
    );
    return 1 / (1 + Math.exp(-(combined + this.bias)));
  }

  process = (input: SavedValue[]) => this.compute(input);

  copy = (weights?: SavedValue[], bias?: number) =>
    new HiddenLayerNeuron(
      weights === undefined ? this.weights : weights,
      bias === undefined ? this.bias : bias,
    );

  toString = () => (JSON.stringify({
    type: "normal",
    weights: this.weights.map((n, i) => [{ num: i, weight: n.number }]),
    bias: this.bias,
  }));
}

class OutputNeuron extends HiddenLayerNeuron {
  private result: number;

  constructor(weights: SavedValue[], bias: number, result?: number) {
    super(weights, bias);
    this.result = result === undefined ? 0 : result;
  }

  process = (input: SavedValue[]) => {
    this.result = super.compute(input);
    return this.result;
  };

  copy = (weights?: SavedValue[], bias?: number) =>
    new OutputNeuron(
      weights === undefined ? this.weights : weights,
      bias === undefined ? this.bias : bias,
      this.result,
    );

  toString = () => (JSON.stringify({
    type: "output",
    result: this.result,
    weights: this.weights.map((n, i) => [{ num: i, weight: n.number }]),
    bias: this.bias,
  }));
}

export class Network<T> {
  private readonly neurons: Neuron[][];
  private readonly name: string;
  private readonly miniBatchLength?: number;
  constructor({
    name,
    numberByLayer,
    parameters,
    weightsAndBiases,
    trainings,
    miniBatchLength,
  }: {
    name?: string;
    numberByLayer: number[];
    parameters: ((input: T) => number)[];
    weightsAndBiases?: WeightsAndBias[][];
    trainings?: TrainingDataset<T>;
    miniBatchLength?: number;
  }) {
    this.name = name || "anonymous network";
    this.miniBatchLength = miniBatchLength;
    this.neurons = numberByLayer.map((n) => Array(n).fill(0));
    this.neurons.forEach((array, i, network) => {
      for (let j = 0; j < array.length; j++) {
        const weightsAndBias = (((weightsAndBiases || [])[i]) || [])[j] ||
          { weights: [] };
        array[j] = i === 0
          ? new InputNeuron(
            parameters[j],
            weightsAndBias.bias || Math.random(),
          )
          : i === numberByLayer.length - 1
          ? new OutputNeuron(
            network[i - 1].map((neuron2, k) => ({
              neuron: neuron2,
              number: (weightsAndBias.weights || [])[k] || Math.random(),
            })),
            weightsAndBias.bias || Math.random(),
          )
          : new HiddenLayerNeuron(
            network[i - 1].map((neuron2, k) => ({
              neuron: neuron2,
              number: (weightsAndBias.weights || [])[k] || Math.random(),
            })),
            weightsAndBias.bias || Math.random(),
          );
      }
    });
    if (trainings && trainings.inputs.length) {
      const weightsAndBiases =
        this.trainAndGetGradientDescent(this.subsetOf(trainings))
          .weightsAndBiases;
      const trainedNetwork = this.apply(weightsAndBiases);
      this.neurons.splice(0, this.neurons.length);
      Array.prototype.push.apply(
        this.neurons,
        trainedNetwork.neurons,
      );
    }
  }

  process = (input: T) =>
    this.neurons.slice(1).reduce(
      (acc: SavedValue[], layer: Neuron[]) =>
        layer.map((n) => ({
          neuron: n,
          number: (n as HiddenLayerNeuron).process(acc),
        })),
      this.neurons[0].map((n) => ({
        neuron: n,
        number: (n as InputNeuron<T>).process(input),
      })),
    ).map((savedValue) => (savedValue as SavedValue).number);

  costSummaryOf = (trainingDataFromInput: TrainingDataset<T>): CostSummary => {
    let i = 0;
    const { inputs, theory } = trainingDataFromInput.theory
      ? trainingDataFromInput
      : {
        inputs: trainingDataFromInput.inputs,
        theory: () => (trainingDataFromInput.expectedResults || [])[i++] || [],
      };
    const costs = inputs.map((input) => {
      const result = this.process(input);
      const expectedResult = theory!(input);
      const cost = result.reduce(
        (acc, r, i) => acc + Math.pow(r - expectedResult[i], 2),
        0,
      );
      return cost;
    });
    return { costs, average: costs.reduce((a, b) => a + b, 0) / inputs.length };
  };

  trainAndGetGradientDescent = (
    trainingDataFromInput: TrainingDataset<T>,
  ): TrainingResult<T> => {
    let i = 0;
    const trainingDataSubset = this.subsetOf(trainingDataFromInput);
    const clone = this.clone();
    const weightsAndBiases = clone.neurons.slice().reverse().map((layer) =>
      layer.map((neuron) => ({
        weights: neuron instanceof HiddenLayerNeuron
          ? (neuron as HiddenLayerNeuron).weights.map((weight) =>
            clone.adjust(
              weight,
              "number",
              () => clone.costSummaryOf(trainingDataSubset).average,
            )
          )
          : [],
        bias: clone.adjust(
          neuron,
          "bias",
          () => clone.costSummaryOf(trainingDataSubset).average,
        ),
      }))
    ).reverse();
    const remainingCosts = clone.costSummaryOf(trainingDataSubset);
    return {
      weightsAndBiases,
      remainingCost: remainingCosts.average,
      remainingCostList: remainingCosts.costs,
      trainedNetwork: clone,
    };
  };

  apply = (weightsAndBiases: WeightsAndBias[][]) =>
    new Network<T>({
      name: `trained from '${this.name}'`,
      numberByLayer: this.neurons.map((l) => l.length),
      parameters: this.neurons[0].map((n) => (n as InputNeuron<T>).execute),
      weightsAndBiases,
    });

  clone = () =>
    new Network<T>({
      name: `cloned from '${this.name}'`,
      numberByLayer: this.neurons.map((l) => l.length),
      parameters: this.neurons[0].map((n) => (n as InputNeuron<T>).execute),
      weightsAndBiases: this.neurons.map((l) =>
        l.map((n) => (
          {
            bias: (n as any).bias,
            weights: ((n as any).weights || []).map((w: SavedValue) =>
              w.number
            ),
          }
        ))
      ),
    });

  toString = () =>
    `Network
  name : ${this.name}
  ${this.neurons.map((layer, i) => `layer ${i}: ${layer}`).join("\n   ")}`;

  private subsetOf = (trainingData: TrainingDataset<T>) => {
    if (!this.miniBatchLength) return trainingData;

    const associatedInputsAndResults = trainingData.inputs.map((input, i) => ({
      input,
      expectedResult: (trainingData.expectedResults || [])[i++] ||
        [],
    })).sort(() => Math.random() - 0.5).slice(
      0,
      Math.min(trainingData.inputs.length, this.miniBatchLength),
    );

    let i = 0;
    return {
      inputs: associatedInputsAndResults.map((association) =>
        association.input
      ),
      theory: trainingData.theory ||
        (() => (trainingData.expectedResults || [])[i++] || []),
    };
  };

  private adjust = (owner: any, fieldName: string, render: () => number) => {
    let increment = 0.0000000002;
    let adjustment = 0;
    while (increment > 0.0000000001) {
      const actualCost = render();
      owner[fieldName] -= increment;
      const leftNewCost = render();
      owner[fieldName] += increment * 2;
      const rightNewCost = render();
      owner[fieldName] -= increment;
      const direction = leftNewCost < rightNewCost && leftNewCost < actualCost
        ? -1
        : rightNewCost < leftNewCost && rightNewCost < actualCost
        ? 1
        : 0;
      owner[fieldName] += direction * increment;
      adjustment += direction * increment;
      increment = direction === 0 ? increment / 2 : increment * 2;
    }
    return adjustment;
  };
}
