# neural-network

Example usage of the library :
> neural network to guess if a point is inside a circle or not

```javascript
 const network = new Network({
    name: "First result will be on if the point is inside the circle",
    numberByLayer: [3, 2], // if length > 2, the network will have hidden layers
    parameters: [ // parameters are different criterias to inspect
      ({ x, y }: { x: number; y: number }) => Math.abs(x),
      ({ x, y }: { x: number; y: number }) => Math.abs(y),
      ({ x, y }: { x: number; y: number }) => x * x + y * y,
    ],
    trainings: { // the network will learn some examples before running
      inputs: Array(100).fill(1).map(() => ({
        x: Math.floor(Math.random() * 500 - 250) / 100,
        y: Math.floor(Math.random() * 500 - 250) / 100,
      })),
      theory: ({ x, y }: ({ x: number; y: number })) =>
        Math.pow(x, 2) + Math.pow(y, 2) > 1 ? [0, 1] : [1, 0],
      }
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
      `${JSON.stringify(coords)} => network : ${network.process(coords)}`,
    )
  );
```
