<script>
	import { createEventDispatcher } from 'svelte';
	import { apiFetch } from '$lib/api/fetchWithBase';
	const dispatch = createEventDispatcher();

	let name = '';
	let description = '';
	let case_id = '';
	let client_id = '';
	let tags = '';
	let is_confidential = false;
	let is_temporary = false;
	let type = '';
	let file = null;
	let isUploading = false;
	let errorMessage = '';

	async function handleUpload() {
		if (!file) {
			errorMessage = 'Please select a file to upload.';
			return;
		}

		isUploading = true;
		errorMessage = '';

		const formData = new FormData();
		formData.append('file', file);
		formData.append('name', name);
		formData.append('description', description);
		formData.append('case_id', case_id);
		formData.append('client_id', client_id);
		formData.append('tags', tags);
		formData.append('type', type);
		formData.append('is_confidential', is_confidential.toString());
		formData.append('is_temporary', is_temporary.toString());

		try {
			await apiFetch('/api/documents', {
				method: 'POST',
				body: formData
			});

			dispatch('close');
		} catch (err) {
			console.error('Upload error:', err);
			errorMessage = 'Failed to upload document.';
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
	<div class="relative w-full max-w-lg rounded bg-white p-6 shadow-lg">
		<h2 class="mb-4 text-lg font-semibold">Upload Document</h2>

		{#if errorMessage}
			<div class="mb-2 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
				{errorMessage}
			</div>
		{/if}

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="name" class="text-sm font-medium">Name</label>
				<input bind:value={name} class="mt-1 w-full rounded border px-2 py-1 text-sm" />
			</div>

			<div>
				<label for="type" class="text-sm font-medium">Type</label>
				<input bind:value={type} class="mt-1 w-full rounded border px-2 py-1 text-sm" />
			</div>

			<div>
				<label for="client_id" class="text-sm font-medium">Client ID</label>
				<input bind:value={client_id} class="mt-1 w-full rounded border px-2 py-1 text-sm" />
			</div>

			<div>
				<label for="case_id" class="text-sm font-medium">Case ID</label>
				<input bind:value={case_id} class="mt-1 w-full rounded border px-2 py-1 text-sm" />
			</div>

			<div class="col-span-2">
				<label for="tags" class="text-sm font-medium">Tags (comma-separated)</label>
				<input bind:value={tags} class="mt-1 w-full rounded border px-2 py-1 text-sm" />
			</div>

			<div class="col-span-2">
				<label for="description" class="text-sm font-medium">Description</label>
				<textarea
					bind:value={description}
					rows="2"
					class="mt-1 w-full rounded border px-2 py-1 text-sm"
				></textarea>
			</div>

			<div class="flex items-center gap-2">
				<input id="confidential" type="checkbox" bind:checked={is_confidential} />
				<label for="confidential" class="text-sm">Confidential</label>
			</div>

			<div class="flex items-center gap-2">
				<input id="temporary" type="checkbox" bind:checked={is_temporary} />
				<label for="temporary" class="text-sm">Temporary</label>
			</div>

			<div class="col-span-2">
				<label for="file" class="text-sm font-medium">File</label>
				<input
					type="file"
					accept="*/*"
					on:change={(e) => (file = e.target.files[0])}
					class="mt-1 w-full text-sm"
				/>
			</div>
		</div>

		<div class="mt-6 flex justify-end gap-2">
			<button
				on:click={() => dispatch('close')}
				class="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
				type="button"
			>
				Cancel
			</button>
			<button
				on:click={handleUpload}
				class="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
				disabled={isUploading}
			>
				{isUploading ? 'Uploading...' : 'Upload'}
			</button>
		</div>
	</div>
</div>
