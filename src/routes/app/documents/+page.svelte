<script>
	import UploadModal from '$lib/components/UploadModal.svelte'; // Create this next
	export let data;
	
	let documents = data?.result || [];
	let searchTerm = '';
	let showUploadModal = false;

	function filteredDocuments() {
		const search = searchTerm.toLowerCase();
		return documents.filter((doc) =>
			[doc.client_id, doc.case_id, doc.name, doc.file_type, doc.description, doc.uploaded_by]
				.filter(Boolean)
				.some((val) => val.toLowerCase().includes(search))
		);
	}
</script>

<div class="mb-4 flex items-center gap-4">
	<input
		type="text"
		placeholder="Search documents..."
		bind:value={searchTerm}
		class="flex-grow rounded-md border border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-blue-300 focus:outline-none focus:ring"
	/>
	<button
		on:click={() => (showUploadModal = true)}
		class="shrink-0 rounded bg-gray-700 px-4 py-2 text-sm text-white shadow hover:bg-gray-800"
	>
		Upload Document
	</button>
</div>

<div class="overflow-x-auto rounded border border-gray-300">
	<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
		<thead class="sticky top-0 z-10 bg-gray-700 text-xs font-medium uppercase text-white">
			<tr>
				<th class="px-4 py-2">Client</th>
				<th class="px-4 py-2">Case</th>
				<th class="px-4 py-2">Name</th>
				<th class="px-4 py-2">Type</th>
				<th class="px-4 py-2">Description</th>
				<th class="px-4 py-2">Uploaded By</th>
				<th class="px-4 py-2">Uploaded At</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200">
			{#each filteredDocuments() as doc}
				<tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
					<td class="px-4 py-2">{doc.client_id}</td>
					<td class="px-4 py-2">{doc.case_id}</td>
					<td class="px-4 py-2">{doc.name}</td>
					<td class="px-4 py-2">{doc.file_type}</td>
					<td class="px-4 py-2">{doc.description}</td>
					<td class="px-4 py-2">{doc.uploaded_by}</td>
					<td class="px-4 py-2">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
				</tr>
			{:else}
				<tr>
					<td colspan="7" class="px-4 py-2 italic text-gray-400 text-center">No documents found</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if showUploadModal}
	<UploadModal on:close={() => (showUploadModal = false)} />
{/if}
