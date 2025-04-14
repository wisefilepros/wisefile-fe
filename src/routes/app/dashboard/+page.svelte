<script>
	import { auth } from '$lib/stores/auth';
	export let data;

	const openCases = data?.result?.openCases ?? 0;
	const unpaidInvoices = data?.result?.unpaidInvoices ?? 0;
	const unreadMessages = data?.result?.unreadMessages ?? 0;
	const activityLog = data?.result?.activityLog ?? [];

	function capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
</script>

<h1 class="mb-4 text-3xl font-bold">Welcome, {$auth.user?.full_name || 'User'}!</h1>

<!-- Top Metrics -->
<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
	<div class="rounded bg-white p-6 shadow">
		<h2 class="text-lg font-semibold text-gray-700">Open Cases</h2>
		<p class="text-2xl font-bold text-gray-900">{openCases}</p>
	</div>
	<div class="rounded bg-white p-6 shadow">
		<h2 class="text-lg font-semibold text-gray-700">Unpaid Invoices</h2>
		<p class="text-2xl font-bold text-gray-900">{unpaidInvoices}</p>
	</div>
	<div class="rounded bg-white p-6 shadow">
		<h2 class="text-lg font-semibold text-gray-700">Unread Messages</h2>
		<p class="text-2xl font-bold text-gray-900">{unreadMessages}</p>
	</div>
</div>

<!-- Table for Activity Log -->
<div class="mt-6 max-h-[calc(100vh-24px)] overflow-hidden rounded-lg bg-white shadow-md">
	<div class="max-h-[calc(100vh-24px)] overflow-y-auto">
		<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
			<thead class="sticky top-0 z-10 bg-gray-700 text-xs font-medium uppercase text-white">
				<tr>
					<th class="px-4 py-2">Action</th>
					<th class="px-4 py-2">Details</th>
					<th class="px-4 py-2">User ID</th>
					<th class="px-4 py-2">Timestamp</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each activityLog as log, i}
					<tr class="odd:bg-white even:bg-gray-100 hover:bg-gray-200">
						<td class="px-4 py-2"
							>{capitalizeFirstLetter(log.action)} {capitalizeFirstLetter(log.entity_type)}</td
						>
						<td class="px-4 py-2">{log.details}</td>
						<td class="px-4 py-2">{log.user_id}</td>
						<td class="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
					</tr>
				{:else}
					<tr>
						<td class="px-4 py-2 italic text-gray-400" colspan="4"> No activity found </td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
