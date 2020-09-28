import polka from "polka";
import cors from "cors";

import { hash } from "./hash.mjs";
import { Raft } from "./raft.mjs";

const [, , PORT, hostsString] = process.argv;

const hosts = hostsString.split(",");
let counter = 0;

const countIncrement = () => {
  counter += 1;
};

let store = {};

let Store = () => {
  return {
    update: (k) => (v) => {
      store = { ...store, [k]: v };
    },
    get: (k) => store[k],
  };
};

const storeHandler = (req, res, next) => {
  req.store = Store(store);
  next();
};

const randomPort = (min = 3031, max = 3331) => {
  const portrange = [min, max];

  return parseInt(Math.floor(Math.random() * (max - min) + min));
};

const raft = Raft(`http://localhost:${PORT}`, hosts);
raft.init();

const _json = (res, payload) => {
  res.writeHead(200, {
    "Content-Type": "application/json",
  });
  const json = JSON.stringify(payload);
  res.end(json);
};

polka()
  .use(storeHandler, cors())
  .get("/ping/", (req, res) => _json(res, "pong"))
  .get("/hash/:data", (req, res) => {
    const input = decodeURI(req.params.data);
    const output = hash(input);
    console.log("(hash)", input, output);
    res.end(output);
  })
  .get("/hosts/", (req, res) => _json(res, hosts))
  .get("/boot/", (req, res) => {
    res.end(`(boot): on port ${PORT}`);
  })
  .get("/state/", (req, res) => {
    const state = raft.state();
    const { store } = req;
    const { state: _state, term } = state;
    // console.info(`[${state} / ${term}]`);
    // console.log("blub:", store.get("blub"));
    // store.update("blub")("what" + counter);
    // countIncrement();
    // console.log("blub:", store.get("blub"));
    _json(res, state);
  })
  .get("/vote/:term/:id", (req, res) => {
    const { id, term } = req.params;
    const { state, term: _term } = raft.state();
    console.log(`/vote/: node ${id} wants me to vote for it in term ${term}`);
    raft.voteReset(parseInt(term, 10));
    const result = raft.wouldVoteinTerm(term, id);
    _json(res, { id, result, term });
  })
  .get("/append/:term/:id", (req, res) => {
    const { id, term } = req.params;
    // console.log("/append/", term, id);
    // console.log("/append/ got heartbeat from ", id, term);
    console.log("\x1Bc");
    console.log(`listening to ${id} [${term}]\r`);
    raft.reset(parseInt(term, 10));
    _json(res, {});
  })
  .get("/store/:key", (req, res) => {
    const key = decodeURI(req.params.key);
    console.log(`/store/: I was tasked to store some data at: [${key}]`);
    res.end(`message received`);
  })
  .listen(PORT, (err) => {
    if (err) throw err;
    console.log(`(listen): Running on localhost:${PORT}`);
  });
