# neural-network

## Example usage of the library :
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
    { x: 0, y: 0 }, // should be in
    { x: -0.2, y: 0.34 },  // should be in
    { x: -0.002, y: 0.014 },  // should be in
    { x: -0.9, y: 0.4 },  // should be ... very close to out
    { x: 0, y: 1 },  // should be ... very close to out
    { x: 1, y: 0 },  // should be ... very close to out
    { x: 2, y: 0 },  // should be out
    { x: 3, y: 3 },  // should be out
    { x: -40, y: -6 },  // should be out
    { x: 53, y: 53 },  // should be out
  ].map((coords) =>
    console.log(
      `${JSON.stringify(coords)} => network : ${network.process(coords)}`,
    )
  );
```

## Known issue
The results, even when activated, are sometimes very far from 1, 
but there are some noticeable differences between non-activation and activation
