<script lang="ts">
  import { isShortcutsModalOpen } from '../stores/editorStore';
  import { Keyboard, X } from 'lucide-svelte';

  const shortcutList = [
    { key: 'M', desc: 'Move Tool (Drag selection or active layer)' },
    { key: 'S', desc: 'Marquee Rectangular Selection' },
    { key: 'W', desc: 'Magic Wand (Flood / Contiguous Select)' },
    { key: 'Q', desc: 'Freehand Lasso Selection' },
    { key: 'Shift + Drag/Click', desc: 'Add to Selection (Union)' },
    { key: 'Alt/Opt + Drag/Click', desc: 'Subtract from Selection (Difference)' },
    { key: 'B', desc: 'Pencil Stitch Tool' },
    { key: 'E', desc: 'Eraser Tool' },
    { key: 'F', desc: 'Flood Fill (Paint Bucket)' },
    { key: 'I', desc: 'Eyedropper (Color Picker)' },
    { key: 'L', desc: 'Line Tool' },
    { key: 'R', desc: 'Rectangle Tool' },
    { key: 'O', desc: 'Ellipse / Oval Tool' },
    { key: 'T', desc: 'Typography / Text Tool' },
    { key: 'Shift + Drag', desc: 'Constrain Shape (Square / Circle / 45°)' },
    { key: 'R (Stamp / Paste)', desc: 'Rotate Active Stamp or Paste 90° CW' },
    { key: 'H (Stamp / Paste)', desc: 'Flip Stamp or Paste Horizontally' },
    { key: 'V (Stamp / Paste)', desc: 'Flip Stamp or Paste Vertically' },
    { key: 'H', desc: 'Pan / Hand Tool' },
    { key: 'Space + Drag', desc: 'Temporary Pan Canvas' },
    { key: '2-Finger Swipe', desc: 'Smooth Trackpad Pan' },
    { key: 'Cmd/Ctrl + N', desc: 'New Canvas Project' },
    { key: 'Cmd/Ctrl + S', desc: 'Save Pattern (.xstitch)' },
    { key: 'Cmd/Ctrl + X', desc: 'Cut Selection' },
    { key: 'Cmd/Ctrl + C', desc: 'Copy Selection' },
    { key: 'Cmd/Ctrl + V', desc: 'Paste Stitches (Floating)' },
    { key: 'Enter', desc: 'Commit Floating Stitches' },
    { key: 'Cmd/Ctrl + A', desc: 'Select All' },
    { key: 'Cmd/Ctrl + D', desc: 'Deselect Selection' },
    { key: 'Cmd/Ctrl + Shift + I', desc: 'Invert Selection' },
    { key: 'Del / Backspace', desc: 'Delete Selected Stitches' },
    { key: 'Cmd/Ctrl + Z', desc: 'Undo Stitch Action' },
    { key: 'Cmd/Ctrl + Shift + Z', desc: 'Redo Stitch Action' },
    { key: 'Cmd/Ctrl + 0', desc: 'Fit Canvas to Screen' },
    { key: 'Esc', desc: 'Cancel Shape / Stamp / Deselect' }
  ];
</script>

{#if $isShortcutsModalOpen}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#262632]">
        <div class="flex items-center space-x-2">
          <Keyboard class="text-indigo-400" size={18} />
          <h3 class="font-bold text-white text-sm">Keyboard Shortcuts</h3>
        </div>
        <button
          class="text-gray-400 hover:text-white p-1 rounded hover:bg-[#323242]"
          on:click={() => isShortcutsModalOpen.set(false)}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Body -->
      <div class="p-4 overflow-y-auto max-h-[60vh] space-y-2 text-xs">
        {#each shortcutList as sc}
          <div class="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#272733] border border-[#343444]">
            <span class="text-gray-300">{sc.desc}</span>
            <kbd class="px-2 py-0.5 rounded bg-[#181822] border border-[#404052] font-mono font-semibold text-indigo-300 text-[11px]">
              {sc.key}
            </kbd>
          </div>
        {/each}
      </div>

      <!-- Footer -->
      <div class="p-3 bg-[#191922] border-t border-gray-800 flex justify-end">
        <button
          class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          on:click={() => isShortcutsModalOpen.set(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
