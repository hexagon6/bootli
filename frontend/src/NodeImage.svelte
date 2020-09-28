<script>
  export let state;
  export let term;
  const classMap = {
    Follower: "f",
    Candidate: "c",
    Leader: "l",
    Unknown: "u",
    Offline: "o",
  };
</script>

<style>
  circle {
    transition: fill 0.4s ease;
  }

  .node {
    stroke: black;
    stroke-width: 5px;
  }

  .f {
    stroke-opacity: 0;
    fill: rgb(70, 130, 180);
  }

  .c {
    stroke-opacity: 1;
    fill: rgb(70, 130, 180);
    stroke-dasharray: 5px, 5px;
  }

  .l {
    stroke-opacity: 1;
    fill: rgb(70, 130, 180);
  }

  .o {
    stroke-opacity: 0;
    fill: rgb(70, 0, 0);
  }

  .u {
    stroke-opacity: 0;
    fill: rgb(0, 100, 0);
  }
</style>

<div>
  <svg width="50" height="50">
    <g transform="translate(25, 25)">
      {#if state}
        <circle class="{classMap[state]} node" r="22.9" />
        <g transform="translate(0,4)">
          <text font-size="10" text-anchor="middle" fill="white">{state}</text>
        </g>
        {#if term}
          <g transform="translate(0,12)">
            <text font-size="8" text-anchor="middle" fill="white">
              term: {term}
            </text>
          </g>
        {/if}
      {/if}
    </g></svg>
</div>
