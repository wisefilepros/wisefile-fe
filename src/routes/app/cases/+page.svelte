<script>
	import { auth } from '$lib/stores/auth';
	import CaseCreationModal from '$lib/components/CaseCreationModal.svelte';
	export let data;

	const cases = data?.result ?? [];
	let searchTerm = '';
	let selectedOperator = '';
	let selectedAttorney = '';
	let selectedCourt = '';

	let showModal = false;
	const openModal = () => (showModal = true);
	const closeModal = () => (showModal = false);

	const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString() : '—');

	// Create unique lists for dropdown filters
	const operatorOptions = [...new Set(cases.map((c) => c.operator?.full_name).filter(Boolean))];
	const attorneyOptions = [...new Set(cases.map((c) => c.attorney?.full_name).filter(Boolean))];
	const courtOptions = [...new Set(cases.map((c) => c.court_name).filter(Boolean))];

	const filteredCases = () =>
		cases.filter((c) => {
			const matchesSearch = Object.values(c)
				.join(' ')
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
			const matchesOperator = !selectedOperator || c.operator?.full_name === selectedOperator;
			const matchesAttorney = !selectedAttorney || c.attorney?.full_name === selectedAttorney;
			const matchesCourt = !selectedCourt || c.court_name === selectedCourt;
			return matchesSearch && matchesOperator && matchesAttorney && matchesCourt;
		});

	function clearFilters() {
		searchTerm = '';
		selectedOperator = '';
		selectedAttorney = '';
		selectedCourt = '';
	}
</script>

<!-- Search + Filter Controls -->
<div class="mb-4 flex flex-wrap items-center justify-between gap-4">
	<!-- Search Bar -->
	<div class="flex flex-grow items-center gap-2">
		<input
			type="text"
			placeholder="Search cases..."
			bind:value={searchTerm}
			class="flex-grow rounded-md border border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-blue-300 focus:outline-none focus:ring"
		/>
	</div>

	<!-- Dropdown Filters -->
	<div class="flex items-center gap-2">
		<select
			bind:value={selectedOperator}
			class="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
		>
			<option value="">All Operators</option>
			{#each operatorOptions as op}
				<option value={op}>{op}</option>
			{/each}
		</select>

		<select
			bind:value={selectedAttorney}
			class="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
		>
			<option value="">All Attorneys</option>
			{#each attorneyOptions as at}
				<option value={at}>{at}</option>
			{/each}
		</select>

		<select
			bind:value={selectedCourt}
			class="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
		>
			<option value="">All Courts</option>
			{#each courtOptions as ct}
				<option value={ct}>{ct}</option>
			{/each}
		</select>

		<button
			on:click={clearFilters}
			disabled={!searchTerm && !selectedOperator && !selectedAttorney && !selectedCourt}
			class="rounded-md bg-gray-400 px-3 py-2 text-sm text-white hover:bg-gray-500"
		>
			Clear
		</button>
	</div>

	<!-- New Case Button -->
	{#if $auth.user?.role === 'client'}
		<button
			class="whitespace-nowrap rounded-md bg-gray-700 px-4 py-2 text-white shadow-sm hover:bg-gray-800"
			on:click={openModal}
		>
			+ New Case
		</button>
	{/if}
</div>

<!-- Scrollable Table -->
<div class="rounded-lg bg-white shadow-md">
	<div class="max-h-[calc(100vh-250px)] overflow-y-auto">
		<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
			<thead class="sticky top-0 z-10 bg-gray-700 text-xs font-medium uppercase text-white">
				<tr>
					<th class="px-4 py-2">Client</th>
					<th class="px-4 py-2">Case #</th>
					<th class="px-4 py-2">Status</th>
					<th class="px-4 py-2">Property</th>
					<th class="px-4 py-2">Jurisdiction</th>
					<th class="px-4 py-2">Created</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each filteredCases() as c}
					<tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
						<td class="px-4 py-2">{c.client?.display_name ?? c.client_id}</td>
						<td class="px-4 py-2">
							<a href={`/app/cases/${c._id}`} class="text-gray-700 hover:underline">
								{c.case_number}
							</a>
						</td>
						<td class="px-4 py-2">{c.status}</td>
						<td class="px-4 py-2">{c.property?.formatted_address ?? c.property_id}</td>
						<td class="px-4 py-2">{c.court_name ?? '—'}</td>
						<td class="px-4 py-2">{formatDate(c.created_at)}</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="px-4 py-2 italic text-gray-400">No cases found</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Modal for Case Creation -->
{#if showModal}
	<CaseCreationModal on:close={closeModal} />
{/if}
