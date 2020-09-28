<script>
  import Node from "./Node.svelte";
  import { getCluster, getState } from "./config.js";
  // FIXME: get configuration based on available hosts via ping endpoint
  const portRange = [4100, 4110];
  const configUrl = "http://localhost:4107";
  const cluster = getCluster(configUrl);
  // export let hosts = "no hosts";
</script>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }

  p {
    font-weight: bold;
  }

  .error {
    background-color: "red";
    color: "white";
  }
</style>

<main>
  <h1>Raft viewer</h1>
  <dl>
    {#await cluster}
      <p>getting config</p>
    {:then config}
      {#each config.hosts as host, id}
        <div>
          <Node url={host} {id} />
        </div>
      {/each}
    {:catch error}
      <div class="error">error [{error}]</div>
    {/await}
  </dl>
</main>
