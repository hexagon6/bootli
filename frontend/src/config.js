const q = async (url) => await result(await fetch(url));

const result = async (res) =>
  res.ok
    ? { status: res.status, data: await res.json() }
    : { status: res.status, error: res };

const timing = (min, max) => Math.floor(Math.random() * (max - min) + min);

export const getCluster = async (url) => {
  const { data, error } = await q(`${url}/hosts`);
  return { hosts: data, error };
};

export const getState = async (url, node) => {
  const { data: state, error } = await q(`${url}/state`);
  // console.log(node, state);
  return { state: state, error };
};

const init = async (configUrl) => {
  const { hosts } = await getCluster(configUrl);
  console.debug("bootstrapped with ", hosts);
  // const timings = timing(1500, 3500);
  Object.entries(hosts).map(([node, url]) =>
    setInterval(() => getState(url, node), 10000)
  );
  console.log("initialized");
};

// console.log("start");
// init("http://localhost:4107");
