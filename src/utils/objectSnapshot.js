export const getStableJson = (value) => JSON.stringify(value);

export const cloneJson = (value) => JSON.parse(JSON.stringify(value));

export const hasJsonChanged = (left, right) =>
  getStableJson(left) !== getStableJson(right);
