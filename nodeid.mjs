import { hash } from "./hash.mjs";

export const nodeId = (node) => {
  const hashedId = hash(node);
  return [].slice.call(hashedId, 0, 4).join("");
};
