import { nodeId } from "./nodeid.mjs";
import fetch from "node-fetch";
import { promiseTimeout } from "./timeoutPromise.mjs";

const HEARTBEAT = 120;
const electionTimeout = () => timing(150, 300);

const blue = (str) => `\x1b[34m${str}\x1b[89m\x1b[0m`;
const orange = (str) => `\x1b[93m${str}\x1b[39m\x1b[0m`;
const green = (str) => `\x1b[32m${str}\x1b[89m\x1b[0m`;

const q = async (url) =>
  await result(
    await fetch(url).catch((err) => {
      return { status: 500, error: err.code, ok: false };
    })
  );

const result = async (res) =>
  res.ok
    ? { status: res.status, data: await res.json() }
    : { status: res.status, error: res.error };

const timing = (min, max) => Math.floor(Math.random() * (max - min) + min);

const askForVote = (term) => async (node) => {
  const id = nodeId(node);
  // console.log(blue(`asking for vote on node [${id}](${node})`));
  const { error, data } = await promiseTimeout(
    HEARTBEAT,
    q(`${node}/vote/${term}/${id}`)
  ).catch((error) => ({ error }));
  if (error) {
    return { vote: false, id, term };
  }
  // console.log(green(`result of asking for vote: ${JSON.stringify(data)}`));
  // console.log(id, !error);
  const { result: vote } = data;
  return { vote, id, term };
};

//                 [object] => boolean
const countMajorityVotes = (total, o) => {
  const _votes = o
    .filter(({ vote }) => vote)
    .map(({ id }) => id)
    .reduce((c, p) => [p, ...c], []);
  const votes = _votes.reduce((a, c) => a + 1, 0);
  const majority = votes / total >= 0.5;
  // console.log("counting", _votes, _votes.length);
  // console.log(votes, total, votes / total, majority);
  return majority;
};

const noSelf = (id) => (node) => nodeId(node) !== id;

export const Raft = (url, nodes) => {
  const Id = nodeId(url);
  // const Ids = nodes
  //   .map((node) => ({ [nodeId(node)]: node }))
  //   .reduce((a, c) => ({ ...a, ...c }), {});

  const States = ["Follower", "Candidate", "Leader"];

  let electionCountdown;
  let termsVotes = {};
  let term = 0;
  let state = 0;
  let heardFromLeader = false;
  let heartbeatInterval;

  const askForVotes = async (term) => nodes.map(askForVote(term));
  // append entries
  const heartbeat = async () => {
    console.log("\x1Bc");
    console.log(`${Id}: 💓 [${term}]`);
    const others = nodes.filter(noSelf(Id));
    return await Promise.all(
      others.map((node) =>
        q(`${node}/append/${term}/${Id}`).catch(console.error)
      )
    );
  };

  const candidate = async () => {
    state = 1;
    let _term = term;
    const majority = countMajorityVotes(
      nodes.length,
      await Promise.all(await askForVotes(_term))
    );
    if (majority) {
      // console.log("majority found for term", _term, Id);
      if (_term === term) {
        state = 2;
      }
    } else {
      // console.log("not voted in");
      state = 0;
    }
    return majority;
  };

  const vote = (term, id) => {
    // console.debug("voting in progress", term, termsVotes);
    resetElectionTimer();
    console.log("vote: ", !termsVotes[term], termsVotes);
    if (!termsVotes[term]) {
      // console.log(`Y ${term} ${id}`);
      // note that you voted for this term
      termsVotes[term] = true;
      return true;
    } else {
      // console.log(`N ${term} ${id}`);
      // do not vote
      return false;
    }
  };

  const election = async () => {
    if (!heardFromLeader && state === 0) {
      term += 1;
      console.debug(
        orange(
          "leader election timeout exceeded, candidating now for term",
          term
        )
      );
      const win = await candidate(term);
      if (win) {
        // console.log("🍾", win);
        heartbeatInterval = setInterval(heartbeat, HEARTBEAT);
        clearInterval(electionCountdown);
      }
    }
  };

  const resetElectionTimer = () => {
    if (electionCountdown) {
      clearInterval(electionCountdown);
    }
    electionCountdown = setInterval(election, electionTimeout());
  };

  return {
    init: () => {
      console.log(`started raft with id: [${Id}](${url})`);
      resetElectionTimer();
      setInterval(() => {
        // console.log("!");
        heardFromLeader = false;
      }, electionTimeout());
    },
    reset: (_term) => {
      heardFromLeader = true;
      if (_term > term) {
        term = _term;
      }
      resetElectionTimer();
    },
    voteReset: (_term) => {
      state = 0;
      clearInterval(heartbeatInterval);
      if (_term > term) {
        term = _term;
      }
      resetElectionTimer();
    },
    state: () => ({
      state: States[state],
      term,
    }),
    wouldVoteinTerm: (term, id) => vote(term, id),
  };
};
