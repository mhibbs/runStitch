<script lang="ts">
  import { isImageUrlModalOpen, addReferenceImageLayer } from '../stores/editorStore';
  import { X, Globe, Image as ImageIcon, Link as LinkIcon, Loader2, CheckCircle2, AlertTriangle } from 'lucide-svelte';

  let imageUrl = '';
  let layerName = 'Web Image';
  let isTesting = false;
  let previewLoaded = false;
  let previewError = '';
  let naturalWidth = 0;
  let naturalHeight = 0;
  let imgElement: HTMLImageElement;

  // Sample curated URLs for quick test
  const quickSamples = [
    {
      name: 'Retro Coffee Mug',
      url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
    },
    {
      name: 'Geometric Botanical',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80'
    },
    {
      name: 'Pixel Heart Icon',
      url: 'https://raw.githubusercontent.com/feathericons/feather/master/icons/heart.svg'
    }
  ];

  function handleTestUrl() {
    previewLoaded = false;
    previewError = '';
    const trimmed = imageUrl.trim();
    if (!trimmed) return;

    isTesting = true;
    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    testImg.onload = () => {
      naturalWidth = testImg.naturalWidth;
      naturalHeight = testImg.naturalHeight;
      previewLoaded = true;
      isTesting = false;
    };
    testImg.onerror = () => {
      // Try again without crossOrigin in case CORS header isn't sent
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        naturalWidth = fallbackImg.naturalWidth;
        naturalHeight = fallbackImg.naturalHeight;
        previewLoaded = true;
        isTesting = false;
      };
      fallbackImg.onerror = () => {
        previewError = 'Could not load image from this URL. Make sure it is a valid, publicly accessible image link.';
        previewLoaded = false;
        isTesting = false;
      };
      fallbackImg.src = trimmed;
    };
    testImg.src = trimmed;
  }

  function handleApplySample(sample: { name: string; url: string }) {
    imageUrl = sample.url;
    layerName = sample.name;
    handleTestUrl();
  }

  async function handleImport() {
    const trimmed = imageUrl.trim();
    if (!trimmed) return;

    await addReferenceImageLayer(
      trimmed,
      layerName.trim() || 'Web Image',
      naturalWidth || undefined,
      naturalHeight || undefined
    );
    close();
  }

  function close() {
    isImageUrlModalOpen.set(false);
    imageUrl = '';
    layerName = 'Web Image';
    previewLoaded = false;
    previewError = '';
  }
</script>

{#if $isImageUrlModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
    <!-- Click backdrop to close -->
    <button
      type="button"
      aria-label="Close backdrop"
      class="fixed inset-0 w-full h-full cursor-default bg-transparent -z-10"
      on:click={close}
    ></button>

    <div
      class="bg-[#181822] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-[#1f1f2e]">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Globe size={18} />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white">Import Image from Web URL</h3>
            <p class="text-gray-400 text-[11px]">Add an online reference image or photo to your design</p>
          </div>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
          on:click={close}
        >
          <X size={16} />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 space-y-4 text-xs">
        <!-- URL Input -->
        <div>
          <label for="img-url-input" class="block text-gray-300 font-medium mb-1.5 flex items-center justify-between">
            <span>Image Web URL</span>
            <span class="text-[10px] text-gray-500">Direct link (.png, .jpg, .webp, .svg)</span>
          </label>
          <div class="flex space-x-2">
            <div class="relative flex-1">
              <input
                id="img-url-input"
                type="url"
                bind:value={imageUrl}
                placeholder="https://example.com/artwork.jpg"
                on:blur={handleTestUrl}
                on:keydown={(e) => e.key === 'Enter' && handleTestUrl()}
                class="w-full bg-[#20202c] border border-gray-700 rounded-xl px-3.5 py-2 pl-9 text-white text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
              />
              <LinkIcon size={14} class="absolute left-3 top-2.5 text-gray-500 pointer-events-none" />
            </div>
            <button
              type="button"
              class="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium transition-colors border border-gray-700 cursor-pointer"
              on:click={handleTestUrl}
            >
              Check URL
            </button>
          </div>
        </div>

        <!-- Layer Name -->
        <div>
          <label for="img-layer-name" class="block text-gray-300 font-medium mb-1">Layer Label</label>
          <input
            id="img-layer-name"
            type="text"
            bind:value={layerName}
            placeholder="e.g. Reference Portrait"
            class="w-full bg-[#20202c] border border-gray-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
          />
        </div>

        <!-- Quick Samples -->
        <div>
          <span class="block text-gray-400 text-[11px] font-medium mb-1.5">Try a Sample Online Image:</span>
          <div class="flex flex-wrap gap-2">
            {#each quickSamples as sample}
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg bg-[#222232] hover:bg-indigo-900/30 border border-gray-700/70 hover:border-indigo-500/50 text-[11px] text-gray-300 hover:text-white transition-all cursor-pointer"
                on:click={() => handleApplySample(sample)}
              >
                {sample.name}
              </button>
            {/each}
          </div>
        </div>

        <!-- Live Preview Box -->
        <div class="border border-gray-800 rounded-xl bg-[#14141c] p-3 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
          {#if isTesting}
            <div class="flex flex-col items-center space-y-2 text-gray-400">
              <Loader2 size={24} class="animate-spin text-indigo-400" />
              <span class="text-xs">Connecting & loading image...</span>
            </div>
          {:else if previewLoaded}
            <div class="flex flex-col items-center space-y-2 w-full">
              <img
                src={imageUrl}
                alt="URL Preview"
                class="max-h-[120px] max-w-full object-contain rounded-lg border border-gray-700/60 shadow"
              />
              <div class="flex items-center space-x-2 text-emerald-400 text-[11px]">
                <CheckCircle2 size={13} />
                <span>Ready ({naturalWidth} × {naturalHeight} px)</span>
              </div>
            </div>
          {:else if previewError}
            <div class="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs flex items-start space-x-2 text-left">
              <AlertTriangle size={15} class="flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{previewError}</span>
            </div>
          {:else}
            <div class="flex flex-col items-center space-y-1.5 text-gray-500 text-center py-4">
              <ImageIcon size={28} class="opacity-40" />
              <p class="text-xs">Enter a valid image URL above to preview it here</p>
              <p class="text-[10px] text-gray-600">Tip: You can also copy any image and press Cmd+V to paste directly!</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 bg-[#1b1b26] border-t border-gray-800 flex items-center justify-between">
        <button
          type="button"
          class="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-[#282838] text-xs font-medium transition-colors cursor-pointer"
          on:click={close}
        >
          Cancel
        </button>

        <button
          type="button"
          class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-40"
          disabled={!imageUrl.trim() || isTesting}
          on:click={handleImport}
        >
          <Globe size={14} />
          <span>Add Image Layer</span>
        </button>
      </div>
    </div>
  </div>
{/if}
