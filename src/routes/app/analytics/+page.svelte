<script>
	import { auth } from '$lib/stores/auth';
	export let data;

	let analytics = data?.result || [];
	let search = '';
	let selectedMonth = '';
	let selectedState = '';

	let months = [];
	let states = [];

	const uniqueMonths = new Set();
	const uniqueStates = new Set();
	analytics.forEach((row) => {
		if (row.month) uniqueMonths.add(row.month);
		if (row.state) uniqueStates.add(row.state);
	});
	months = [...uniqueMonths];
	states = [...uniqueStates];

	function filteredAnalytics() {
		return analytics.filter((row) => {
			const searchMatch = Object.entries(row)
				.filter(([key]) => !['month', 'state'].includes(key))
				.some(([_, val]) => val?.toString().toLowerCase().includes(search.toLowerCase()));

			const monthMatch = selectedMonth ? row.month === selectedMonth : true;
			const stateMatch = selectedState ? row.state === selectedState : true;

			return searchMatch && monthMatch && stateMatch;
		});
	}

	function downloadCSV() {
		const headers = [
			'Month',
			'Client',
			'Case Number',
			'File Type',
			'Address',
			'State',
			$auth.role === 'client' ? 'Expense' : 'Revenue'
		];
		const rows = filteredAnalytics().map((row) => [
			row.month,
			row.client,
			row.caseNumber,
			row.fileType,
			row.address,
			row.state,
			row.revenue ?? ''
		]);

		const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'analytics.csv';
		link.click();
	}
</script>

<div class="mb-4 flex flex-wrap items-center gap-4">
	<input
		type="text"
		placeholder="Search all but Month and State..."
		bind:value={search}
		class="flex-grow rounded border border-gray-300 px-4 py-2 text-sm shadow-sm"
	/>

	<select
		bind:value={selectedMonth}
		class="rounded border border-gray-300 px-2 py-2 text-sm text-gray-700 shadow-sm"
	>
		<option value="">All Months</option>
		{#each months as m}
			<option value={m}>{m}</option>
		{/each}
	</select>

	<select
		bind:value={selectedState}
		class="rounded border border-gray-300 px-2 py-2 text-sm text-gray-700 shadow-sm"
	>
		<option value="">All States</option>
		{#each states as s}
			<option value={s}>{s}</option>
		{/each}
	</select>

	<button
		on:click={downloadCSV}
		class="shrink-0 rounded bg-gray-700 px-4 py-2 text-sm text-white shadow hover:bg-gray-800"
	>
		Download
	</button>
</div>

<div class="overflow-x-auto rounded border border-gray-300">
	<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
		<thead class="sticky top-0 z-10 bg-gray-700 text-xs font-medium uppercase text-white">
			<tr>
				<th class="px-4 py-2">Month</th>
				<th class="px-4 py-2">Client</th>
				<th class="px-4 py-2">Case #</th>
				<th class="px-4 py-2">File Type</th>
				<th class="px-4 py-2">Address</th>
				<th class="px-4 py-2">State</th>
				<th class="px-4 py-2">{$auth.role === 'client' ? 'Expense' : 'Revenue'}</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200">
			{#each filteredAnalytics() as row}
				<tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
					<td class="px-4 py-2">{row.month}</td>
					<td class="px-4 py-2">{row.client}</td>
					<td class="px-4 py-2">{row.caseNumber}</td>
					<td class="px-4 py-2">{row.fileType}</td>
					<td class="px-4 py-2">{row.address}</td>
					<td class="px-4 py-2">{row.state}</td>
					<td class="px-4 py-2">{row.revenue ?? '—'}</td>
				</tr>
			{:else}
				<tr>
					<td colspan="7" class="px-4 py-2 text-center italic text-gray-400"> No results found </td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
