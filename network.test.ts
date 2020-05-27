import { Network } from "./network.ts";
import { readDatabase } from "./mixedNationalInstituteOfStandardsAndTechnologyReader.ts";

Deno.test("should gives random results with not trained network", () => {
  const network = new Network({
    numberByLayer: [4, 4, 2],
    parameters: [
      ({ x, y }: { x: number; y: number }) => x * x + y * y,
      ({ x, y }: { x: number; y: number }) => x,
      ({ x, y }: { x: number; y: number }) => y,
      ({ x, y }: { x: number; y: number }) => x * y,
    ],
  });

  network.process({ x: 0, y: 0 });
  network.process({ x: 0, y: 1 });
  network.process({ x: 1, y: 0 });
  network.process({ x: 2, y: 0 });
  network.process({ x: 3, y: 3 });
});

Deno.test("should compute cost summary", () => {
  const network = new Network({
    numberByLayer: [4, 4, 2],
    parameters: [
      ({ x, y }: { x: number; y: number }) => x * x + y * y,
      ({ x, y }: { x: number; y: number }) => x,
      ({ x, y }: { x: number; y: number }) => y,
      ({ x, y }: { x: number; y: number }) => x * y,
    ],
  });

  network.costSummaryOf({
    inputs: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 3 },
    ],
    expectedResults: [[1, 0], [1, 0], [1, 0], [0, 1], [0, 1]],
  });
});

Deno.test("should compute cost summary with a function", () => {
  const network = new Network({
    numberByLayer: [4, 4, 2],
    parameters: [
      ({ x, y }: { x: number; y: number }) => x * x + y * y,
      ({ x, y }: { x: number; y: number }) => x,
      ({ x, y }: { x: number; y: number }) => y,
      ({ x, y }: { x: number; y: number }) => x * y,
    ],
  });

  network.costSummaryOf({
    inputs: Array(100).fill(1).map((_) => ({
      x: Math.random() * 5 - 2.5,
      y: Math.random() * 5 - 2.5,
    })),
    theory: ({ x, y }: ({ x: number; y: number })) =>
      Math.pow(x, 2) + Math.pow(y, 2) > 1 ? [0] : [1],
  });
});

Deno.test("should train and learn with a function", () => {
  const inputs = Array(10000).fill(1).map(() => ({
    x: Math.floor(Math.random() * 500 - 250) / 100,
    y: Math.floor(Math.random() * 500 - 250) / 100,
  }));

  const network = new Network({
    numberByLayer: [1, 1],
    miniBatchLength: 100,
    activationFunction: "sigmoid",
    randomInit: false,
    parameters: [
      ({ x, y }: { x: number; y: number }) => x * x + y * y,
    ],
  });

  const trainingResult = network.trainAndGetGradientDescent({
    inputs,
    theory: ({ x, y }: ({ x: number; y: number })) =>
      Math.pow(x, 2) + Math.pow(y, 2) > 1 ? [0] : [1],
  });

  const trainedNetwork = network.apply(trainingResult.weightsAndBiases);

  console.log("results");
  [
    { x: 0, y: 0 },
    { x: -0.2, y: 0.34 },
    { x: -0.002, y: 0.014 },
    { x: -0.9, y: 0.4 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 3 },
    { x: -40, y: -6 },
    { x: 53, y: 53 },
  ].map((coords) =>
    console.log(
      `${JSON.stringify(coords)} => random : ${
        network.process(coords)
      }, trained: ${trainedNetwork.process(coords)}`,
    )
  );
});

Deno.test("prepared network and trained network", () => {
  const inputs = Array(100).fill(1).map(() => ({
    x: Math.floor(Math.random() * 500 - 250) / 100,
    y: Math.floor(Math.random() * 500 - 250) / 100,
  }));

  const trainings = {
    inputs,
    theory: ({ x, y }: ({ x: number; y: number })) =>
      Math.pow(x, 2) + Math.pow(y, 2) > 1 ? [0, 1] : [1, 0],
  };

  const network0 = new Network({
    name: "Network 1",
    numberByLayer: [3, 2],
    parameters: [
      ({ x, y }: { x: number; y: number }) => Math.abs(x),
      ({ x, y }: { x: number; y: number }) => Math.abs(y),
      ({ x, y }: { x: number; y: number }) => x * x + y * y,
    ],
  });
  const trainingResult = network0.trainAndGetGradientDescent(trainings);
  const network1 = network0.apply(trainingResult.weightsAndBiases);

  const network2 = new Network({
    name: "Network 2",
    numberByLayer: [3, 2],
    parameters: [
      ({ x, y }: { x: number; y: number }) => Math.abs(x),
      ({ x, y }: { x: number; y: number }) => Math.abs(y),
      ({ x, y }: { x: number; y: number }) => x * x + y * y,
    ],
    trainings,
  });
  console.log("results");
  [
    { x: 0, y: 0 },
    { x: -0.2, y: 0.34 },
    { x: -0.002, y: 0.014 },
    { x: -0.9, y: 0.4 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 3 },
    { x: -40, y: -6 },
    { x: 53, y: 53 },
  ].map((coords) =>
    console.log(
      `${JSON.stringify(coords)} => network1 : ${
        network1.process(coords)
      }, network2: ${network2.process(coords)}`,
    )
  );
});

Deno.test("mixed national institute of standards and technology", async () => {
  const images = await readDatabase();
  const network = new Network<{ label: number; bitmap: number[][] }>({
    numberByLayer: [784, 40, 15, 10],
    parameters: Array(784).fill(0).map((_, i) =>
      ({ label, bitmap }) => {
        const column = i % 28;
        const row = Math.floor(i / 28);
        if (!bitmap || !bitmap[row] || bitmap[row][column] === undefined) {
          return 0;
        }
        return bitmap[row][column] / 255.0;
      }
    ),
  });

  const trainingResult = network.costSummaryOf({
    inputs: images?.slice(0, 1) || [],
    theory: ({ label, bitmap }: { label: number; bitmap: number[][] }) => {
      const result = Array(10).fill(0);
      result[label] = 1;
      return result;
    },
  });
});
