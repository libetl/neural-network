import { Network } from './network.ts'
import { readDatabase } from './mixedNationalInstituteOfStandardsAndTechnologyReader.ts'
/*
Deno.test('should gives random results with not trained network', () => {
  const network = new Network({
    numberByLayer: [4, 4, 2],
    parameters: [
      ({ x, y }: { x: number; y: number }) => x * x + y * y,
      ({ x, y }: { x: number; y: number }) => x,
      ({ x, y }: { x: number; y: number }) => y,
      ({ x, y }: { x: number; y: number }) => x * y
    ]
  })

  network.process({ x: 0, y: 0 })
  network.process({ x: 0, y: 1 })
  network.process({ x: 1, y: 0 })
  network.process({ x: 2, y: 0 })
  network.process({ x: 3, y: 3 })
})

Deno.test('should compute cost summary', () => {
  const network = new Network({
    numberByLayer: [4, 4, 2],
    parameters: [
      ({ x, y }: { x: number; y: number }) => x * x + y * y,
      ({ x, y }: { x: number; y: number }) => x,
      ({ x, y }: { x: number; y: number }) => y,
      ({ x, y }: { x: number; y: number }) => x * y
    ]
  })

  network.costSummaryOf({
    inputs: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 3 }
    ],
    expectedResults: [
      [1, 0],
      [1, 0],
      [1, 0],
      [0, 1],
      [0, 1]
    ]
  })
})

Deno.test('should compute cost summary with a function', () => {
  const network = new Network({
    numberByLayer: [4, 4, 2],
    parameters: [
      ({ x, y }: { x: number; y: number }) => x * x + y * y,
      ({ x, y }: { x: number; y: number }) => x,
      ({ x, y }: { x: number; y: number }) => y,
      ({ x, y }: { x: number; y: number }) => x * y
    ]
  })

  network.costSummaryOf({
    inputs: Array(100)
      .fill(1)
      .map(_ => ({
        x: Math.random() * 5 - 2.5,
        y: Math.random() * 5 - 2.5
      })),
    theory: ({ x, y }: { x: number; y: number }) =>
      Math.pow(x, 2) + Math.pow(y, 2) > 1 ? [0] : [1]
  })
})

Deno.test('should train and learn with a function', () => {
  const inputs = Array(5000)
    .fill(1)
    .map(() => ({
      x: Math.floor(Math.random() * 50000 - 25000) / 100,
      y: Math.floor(Math.random() * 50000 - 25000) / 100
    }))
    .concat(
      Array(1000)
        .fill(1)
        .map(() => ({
          x: Math.floor(Math.random() * 500 - 250) / 100,
          y: Math.floor(Math.random() * 500 - 250) / 100
        }))
    )
    .concat(
      Array(4000)
        .fill(1)
        .map(() => ({
          x: Math.floor(Math.random() * 300 - 150) / 100,
          y: Math.floor(Math.random() * 300 - 150) / 100
        }))
    )
    .sort(() => Math.random() - 0.5)
  const network = new Network({
    numberByLayer: [2, 1],
    miniBatchLength: 10000,
    activationFunction: 'sigmoid',
    randomInit: false,
    parameters: [
      ({ x, y }: { x: number; y: number }) => Math.abs(x),
      ({ x, y }: { x: number; y: number }) => Math.abs(y)
    ]
  })

  const gradientDescentResult = network.getGradientDescent({
    inputs,
    theory: ({ x, y }: { x: number; y: number }) =>
      Math.pow(x, 2) + Math.pow(y, 2) > 1 ? [-4] : [15]
  })

  const trainedNetwork = network.apply(gradientDescentResult.weightsAndBiases)

  console.log('results')
  ;[
    { x: 0, y: 0 },
    { x: -0.2, y: 0.34 },
    { x: -0.02, y: 0.01 },
    { x: -0.9, y: 0.4 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 3 },
    { x: -5, y: 6 },
    { x: -24, y: -6 },
    { x: 24, y: 24 }
  ].map(coords =>
    console.log(
      `${JSON.stringify(coords)} => random : ${network.process(
        coords
      )}, trained: ${trainedNetwork.process(coords)}`
    )
  )
})

Deno.test('loaded weights and biases', () => {
  const network = new Network({
    numberByLayer: [1, 1],
    activationFunction: 'sigmoid',
    randomInit: false,
    parameters: [({ x, y }: { x: number; y: number }) => x * x + y * y],
    weightsAndBiases: [
      // was imported from training
      [{ bias: -1.44, weights: [] }],
      [{ bias: 2, weights: [-5] }]
    ]
  })

  console.log("results (true if coords are in a [1, 1] circle)");
  [
    { x: 0, y: 0 },
    { x: -0.2, y: 0.34 },
    { x: -0.02, y: 0.01 },
    { x: -0.9, y: 0.4 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 3 },
    { x: -5, y: 6 },
    { x: -24, y: -6 },
    { x: 24, y: 24 },
  ].map((coords) =>
    console.log(
      `${JSON.stringify(coords)} => ${network.process(coords)[0] > 0.5}`,
    )
  );
})

Deno.test('loaded from intense training in UI (x^2 + y^2 < 1)', () => {
  const network = new Network({
    numberByLayer: [2, 4, 1],
    activationFunction: 'sigmoid',
    randomInit: false,
    parameters: [
      ({ x, y }: { x: number; y: number }) => x,
      ({ x, y }: { x: number; y: number }) => y
    ],
    weightsAndBiases: [
      [
        { bias: -0.10071499664092819, weights: [] },
        { bias: -0.15018810063963497, weights: [] }
      ],
      [
        { bias: -2.8468035812909434, weights: [5.45721869905237, -3.148199059174658] },
        { bias: -5.242078727744964, weights: [-3.3284653639142725, 10.876261776883684] },
        { bias: -12.976066169035779, weights: [36.003431279150426, 6.242494143417826] },
        { bias: -20.989904892589315, weights: [13.402075212498223, 51.79564730855186] }
      ],
      [
        {
          bias: -5.425858592065819,
          weights: [-58.58740543154484, -32.269696973037284, 18.54140361818438, 10.084452534168838]
        }
      ]
    ]
  })

  console.log('results (true if coords are in a [1, 1] circle)')
  ;[
    { x: 0, y: 0 },
    { x: -0.2, y: 0.34 },
    { x: -0.02, y: 0.01 },
    { x: -0.9, y: 0.4 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 3 },
    { x: -5, y: 6 },
    { x: -24, y: -6 },
    { x: 24, y: 24 }
  ].map(coords => console.log(`${JSON.stringify(coords)} => ${network.process(coords)[0]}`))
})

Deno.test('mixed national institute of standards and technology', async () => {
  const images = await readDatabase()
  const network = new Network<{ label: number; bitmap: number[][] }>({
    numberByLayer: [784, 40, 15, 10],
    miniBatchLength: 10,
    randomInit: true,
    afterEachNeuronTraining: (network, round, iteration, total) => {
      const encoder = new TextEncoder()
      Deno.writeFileSync(
        'mnist.json',
        encoder.encode(
          JSON.stringify({
            iteration,
            weightsAndBiases: network.getWeightsAndBiases()
          })
        )
      )
      console.log(`round ${round + 1}, iteration ${iteration + 1} / ${total}`)
    },
    parameters: Array(784)
      .fill(0)
      .map((_, i) => ({ label, bitmap }) => {
        const column = i % 28
        const row = Math.floor(i / 28)
        if (!bitmap || !bitmap[row] || bitmap[row][column] === undefined) {
          return 0
        }
        return bitmap[row][column] / 255.0
      }),
    trainings: {
      inputs: images || [],
      theory: ({ label, bitmap }: { label: number; bitmap: number[][] }) => {
        const result = Array(10).fill(0)
        result[label] = 1
        return result
      }
    }
  })

  const trainingResult = network.costSummaryOf({
    inputs: images?.slice(0, 1) || [],
    theory: ({ label, bitmap }: { label: number; bitmap: number[][] }) => {
      const result = Array(10).fill(0)
      result[label] = 1
      return result
    }
  })
})*/

Deno.test('forward and backward propagation', () => {
  const inputs = Array(100)
    .fill(1)
    .map(() => ({
      x: Math.floor(Math.random() * 500 - 250) / 100,
      y: Math.floor(Math.random() * 500 - 250) / 100
    }))

  const trainings = {
    inputs,
    theory: ({ x, y }: { x: number; y: number }) =>
      Math.pow(x, 2) + Math.pow(y, 2) > 1 ? [0] : [1]
  }

  const network = new Network({
    name: 'Network',
    numberByLayer: [2, 4, 1],
    parameters: [
      ({ x, y }: { x: number; y: number }) => x,
      ({ x, y }: { x: number; y: number }) => y
    ]
  })
  const forwardAndBackwardPropagation = network.forwardAndBackwardPropagation(trainings)
  console.log(JSON.stringify(forwardAndBackwardPropagation))
})
