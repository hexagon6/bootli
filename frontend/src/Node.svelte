<script>
  import { writable } from "svelte/store";

  import { getState } from "./config.js";
  import NodeImage from "./NodeImage.svelte";

  export let url;
  export let id;
  let state = writable({ state: "Unknown" });
  state.update(() => getState(url));
  setInterval(() => state.update(() => getState(url)), 1000);
</script>

<style>
  .frame {
    border: 1px solid black;
  }
</style>

<div class="frame">
  <div class="frame">Node {id}: {url}</div>
  <dd>
    {#await $state}
      <NodeImage state="Unknown" term="" />
    {:then result}
      <NodeImage state={result.state.state} term={result.state.term} />
    {:catch error}
      <NodeImage state="Offline" term="" />
    {/await}
  </dd>
</div>
