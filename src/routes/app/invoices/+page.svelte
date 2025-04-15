<script>
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/api/fetchWithBase';
	import UploadInvoiceModal from '$lib/components/UploadInvoiceModal.svelte';
	import { auth } from '$lib/stores/auth';

	let invoices = [];
	let searchTerm = '';
	let showUploadModal = false;
	let selectedStatus = '';

	async function loadInvoices() {
		try {
			invoices = await apiFetch('/api/invoices');
		} catch (err) {
			console.error('Failed to fetch invoices:', err);
		}
	}

	function filteredInvoices() {
		return invoices.filter((inv) => {
			const search = searchTerm.toLowerCase();
			const matchesStatus = selectedStatus ? inv.status === selectedStatus : true;
			const matchesSearch = [
				inv.client_id,
				inv.case_id,
				inv.status,
				inv.amount?.toString(),
				inv.invoice_date,
				inv.due_date
			]
				.filter(Boolean)
				.some((val) => val.toString().toLowerCase().includes(search));

			return matchesStatus && matchesSearch;
		});
	}

	onMount(loadInvoices);
</script>

<div class="mb-4 flex items-center gap-4">
	<input
		type="text"
		placeholder="Search documents..."
		bind:value={searchTerm}
		class="flex-grow rounded-md border border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-blue-300 focus:outline-none focus:ring"
	/>

	<select
		bind:value={selectedStatus}
		class="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
		>
		<option value="">All Statuses</option>
		<option value="unpaid">Unpaid</option>
		<option value="paid">Paid</option>
		<option value="overdue">Overdue</option>
	</select>

	{#if ['admin', 'operations'].includes($auth.role)}
		<button
			on:click={() => (showUploadModal = true)}
			class="shrink-0 rounded bg-gray-700 px-4 py-2 text-sm text-white shadow hover:bg-gray-800"
		>
			Upload Invoice
		</button>
	{/if}
</div>

<div class="overflow-x-auto rounded border border-gray-300">
	<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
		<thead class="sticky top-0 z-10 bg-gray-700 text-xs font-medium uppercase text-white">
			<tr>
				<th class="px-4 py-2">Client</th>
				<th class="px-4 py-2">Case</th>
				<th class="px-4 py-2">Status</th>
				<th class="px-4 py-2">Amount</th>
				<th class="px-4 py-2">Issue Date</th>
				<th class="px-4 py-2">Due Date</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200">
			{#each filteredInvoices() as inv}
				<tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
					<td class="px-4 py-2">{inv.client_id}</td>
					<td class="px-4 py-2">{inv.case_id}</td>
					<td class="px-4 py-2 capitalize">{inv.status}</td>
					<td class="px-4 py-2">${inv.amount?.toFixed(2)}</td>
					<td class="px-4 py-2">{new Date(inv.invoice_date).toLocaleDateString()}</td>
					<td class="px-4 py-2">{new Date(inv.due_date).toLocaleDateString()}</td>
				</tr>
			{:else}
				<tr>
					<td colspan="6" class="px-4 py-2 text-center italic text-gray-400">
						No invoices found
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if showUploadModal}
	<UploadInvoiceModal on:close={() => (showUploadModal = false)} />
{/if}
