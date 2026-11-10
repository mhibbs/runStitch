<script lang="ts">
  import type { StitchType } from '../types';

  export let type: StitchType = 'full';
  export let size: number = 19;
  export let color: string | null = null;
  export let showCellBox: boolean = true;

  $: fillHex = color || 'currentColor';
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class="shrink-0 select-none"
  aria-hidden="true"
>
  {#if showCellBox}
    <!-- Subtle Aida stitch cell frame so X/half-stitches read as grid stitches, not UI cancel/slash icons -->
    <rect
      x="2.25"
      y="2.25"
      width="19.5"
      height="19.5"
      rx="3.5"
      stroke="currentColor"
      stroke-opacity="0.38"
      stroke-width="1.35"
    />
    <!-- 4 Aida corner pinholes -->
    <circle cx="5.5" cy="5.5" r="1" fill="currentColor" fill-opacity="0.45" />
    <circle cx="18.5" cy="5.5" r="1" fill="currentColor" fill-opacity="0.45" />
    <circle cx="5.5" cy="18.5" r="1" fill="currentColor" fill-opacity="0.45" />
    <circle cx="18.5" cy="18.5" r="1" fill="currentColor" fill-opacity="0.45" />
  {/if}

  {#if type === 'half_forward'}
    <!-- Outer silhouette outline (matches toolbar icon style) -->
    <line x1="6.2" y1="17.8" x2="17.8" y2="6.2" stroke="currentColor" stroke-width="6.6" stroke-linecap="round" />
    <!-- Dark separation trench -->
    <line x1="6.2" y1="17.8" x2="17.8" y2="6.2" stroke="#14141d" stroke-width="4.6" stroke-linecap="round" />
    <!-- Plump thread core in active floss color -->
    <line x1="6.2" y1="17.8" x2="17.8" y2="6.2" stroke={fillHex} stroke-width="2.9" stroke-linecap="round" />
  {:else if type === 'half_back'}
    <!-- Outer silhouette outline -->
    <line x1="6.2" y1="6.2" x2="17.8" y2="17.8" stroke="currentColor" stroke-width="6.6" stroke-linecap="round" />
    <!-- Dark separation trench -->
    <line x1="6.2" y1="6.2" x2="17.8" y2="17.8" stroke="#14141d" stroke-width="4.6" stroke-linecap="round" />
    <!-- Plump thread core in active floss color -->
    <line x1="6.2" y1="6.2" x2="17.8" y2="17.8" stroke={fillHex} stroke-width="2.9" stroke-linecap="round" />
  {:else}
    <!-- Full Cross Stitch (X): Bottom strand (/) under Top strand (\) -->
    <!-- Unified outer light outline for both strands -->
    <line x1="6.2" y1="17.8" x2="17.8" y2="6.2" stroke="currentColor" stroke-width="6.6" stroke-linecap="round" />
    <line x1="6.2" y1="6.2" x2="17.8" y2="17.8" stroke="currentColor" stroke-width="6.6" stroke-linecap="round" />

    <!-- Bottom strand (/) dark trench + colored thread core -->
    <line x1="6.2" y1="17.8" x2="17.8" y2="6.2" stroke="#14141d" stroke-width="4.6" stroke-linecap="round" />
    <line x1="6.2" y1="17.8" x2="17.8" y2="6.2" stroke={fillHex} stroke-width="2.9" stroke-linecap="round" />

    <!-- Top strand (\) dark trench + colored thread core crossing cleanly over bottom strand -->
    <line x1="6.2" y1="6.2" x2="17.8" y2="17.8" stroke="#14141d" stroke-width="4.8" stroke-linecap="round" />
    <line x1="6.2" y1="6.2" x2="17.8" y2="17.8" stroke={fillHex} stroke-width="2.9" stroke-linecap="round" />
  {/if}
</svg>

