import * as background from './background';

export const slices = {
  ...background.slices,
};

export const connects = [
  background.connect,
];
