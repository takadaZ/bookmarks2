import * as background from './background';

export const mergedSlices = {
  ...background.slices,
};

export const mergedConnects = [
  background.connect,
];
