import sha256 from "sha256-wasm";

//           string -> string (hex)
export const hash = (input) =>
  sha256().update(Buffer.from(input), "utf8").digest("hex");
