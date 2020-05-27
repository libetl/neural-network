# neural-network

## Example usage of the library

> neural network to guess if a point is inside a circle or not

```javascript
  const network = new Network({
    numberByLayer: [2, 1], // if length > 2, the network will have hidden layers
    miniBatchLength: 10000, // to reduce the wait for the cost computation
    activationFunction: "sigmoid",
    randomInit: false, // true to start with random weights and biases
    parameters: [ // parameters are different criterias to inspect
      ({ x, y }: { x: number; y: number }) => Math.abs(x),
      ({ x, y }: { x: number; y: number }) => Math.abs(y),
    ],
    trainings: { // the network will learn some examples before running
      inputs: Array(5000).fill(1).map(() => ({
        x: Math.floor(Math.random() * 50000 - 25000) / 100,
        y: Math.floor(Math.random() * 50000 - 25000) / 100,
      })).concat(
        Array(1000).fill(1).map(() => ({
          x: Math.floor(Math.random() * 500 - 250) / 100,
          y: Math.floor(Math.random() * 500 - 250) / 100,
        })),
      ).concat(
        Array(4000).fill(1).map(() => ({
          x: Math.floor(Math.random() * 300 - 150) / 100,
          y: Math.floor(Math.random() * 300 - 150) / 100,
        })),
      ).sort(() => Math.random() - 0.5),
      // make sure to cover a lot of cases in the training data
      theory: ({ x, y }: ({ x: number; y: number })) =>
        Math.pow(x, 2) + Math.pow(y, 2) > 1 ? [-4] : [15],
      // the theory can be replaced with an expectedResults array if
      // there is no theory (inputs[k] has for result expectedResults[k])
      // in any case, the result should activate the OutputNeuron you need
      // (if you want to activate the third one, it should be [0, 0, x]
      // with x > 1)
    },
  });

  console.log("results");
  [
    { x: 0, y: 0 }, // should be in
    { x: -0.2, y: 0.34 }, // should be in
    { x: -0.02, y: 0.01 }, // should be in
    { x: -0.9, y: 0.4 }, // should be ... very close to out
    { x: 0, y: 1 }, // should be ... very close to out
    { x: 1, y: 0 }, // should be ... very close to out
    { x: 2, y: 0 }, // should be out
    { x: 3, y: 3 }, // should be out
    { x: -5, y: 6 }, // should be out
    { x: -24, y: -6 }, // should be out
    { x: -40, y: -6 }, // should be out
    { x: 24, y: 24 }, // should be out
  ].map((coords) =>
    console.log(
      `${JSON.stringify(coords)} => network : ${network.process(coords)}`,
    )
  );
```

## Known issue

The results, even when activated, are sometimes very far from 1,
but there are some noticeable differences between non-activation and activation
