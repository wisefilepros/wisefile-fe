<script>
	export let showModal = false;
	export let closeModal;
</script>

{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
			<h2 class="mb-4 text-xl font-semibold">This is a modal</h2>
			<button class="rounded bg-black px-4 py-2 text-white" on:click={closeModal}>Close</button>
		</div>
	</div>
{/if}
