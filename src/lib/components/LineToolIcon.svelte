<script lang="ts">
  export let size: number = 18;
</script>

<!-- Geometric Line Segment Icon with endpoint vertices so it never looks like a half-stitch -->
<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class="shrink-0 select-none"
  aria-hidden="true"
>
  <line
    x1="6.5"
    y1="17.5"
    x2="17.5"
    y2="6.5"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
  />
  <circle
    cx="5"
    cy="19"
    r="2.4"
    fill="#1f1f26"
    stroke="currentColor"
    stroke-width="2"
  />
  <circle
    cx="19"
    cy="5"
    r="2.4"
    fill="#1f1f26"
    stroke="currentColor"
    stroke-width="2"
  />
</svg>

