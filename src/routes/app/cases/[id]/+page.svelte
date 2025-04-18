<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { page } from '$app/stores';
	import { apiFetch } from '$lib/api/fetchWithBase';

	export let data;
	let { user } = $auth;
	let activeTab = 'details';
	let progressContainer;
	let isAtStart = true;
	let isAtEnd = false;
	let showFeeForm = false;
	let messageContent = '';
	let isSending = false;
	let messages = data?.messages || [];
	let caseDetails = data?.caseRecord || null;
	let statuses = data?.caseStatuses || [];
	let currentUser = data?.me?._id || '';
	let caseId = caseDetails?._id || '';
	let isEditingDetails = false;
	let editableDetails = {};
	let originalDetails = {};
	let newStatus = '';

	function scrollLeft() {
		progressContainer.scrollBy({ left: -200, behavior: 'smooth' });
		updateScrollState();
	}

	function scrollRight() {
		progressContainer.scrollBy({ left: 200, behavior: 'smooth' });
		updateScrollState();
	}

	function updateScrollState() {
		isAtStart = progressContainer.scrollLeft <= 0;
		isAtEnd =
			progressContainer.scrollLeft + progressContainer.clientWidth >= progressContainer.scrollWidth;
	}

	function formatDate(date) {
		return date ? new Date(date).toLocaleDateString('en-US') : '—';
	}

	async function sendMessage() {
		if (!messageContent.trim()) return;
		isSending = true;

		try {
			const payload = {
				case_id: caseId,
				sender_id: currentUser,
				recipient_ids: [],
				content: messageContent.trim(),
				message_type: 'text',
				visible_to_users: true
			};

			const newMessage = await apiFetch('/api/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			messages = [...messages, newMessage];
			messageContent = '';
		} catch (err) {
			console.error('Failed to send message:', err);
			alert('Failed to send message.');
		} finally {
			isSending = false;
		}
	}

	function enableEdit() {
		isEditingDetails = true;
		editableDetails = {
			court_case_number: caseDetails?.court_case_number || '',
			court_decision: caseDetails?.court_decision || '',
			attorney_id: caseDetails?.attorney_id || '',
			operator_id: caseDetails?.operator_id || ''
		};
		originalDetails = { ...editableDetails };
	}

	async function saveStatus() {
		if (!newStatus || newStatus === caseDetails.status) return;
		await apiFetch(`/api/cases/${caseDetails._id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: newStatus })
		});
		caseDetails.status = newStatus;
		newStatus = '';
	}

	async function saveCaseDetails() {
		await apiFetch(`/api/cases/${caseDetails._id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				court_case_number: editableDetails.court_case_number,
				court_decision: editableDetails.court_decision,
				attorney_id: editableDetails.attorney_id,
				operator_id: editableDetails.operator_id
			})
		});
		caseDetails = { ...caseDetails, ...editableDetails };
		isEditingDetails = false;
	}

	function cancelCaseEdit() {
		editableDetails = { ...originalDetails };
		isEditingDetails = false;
	}
</script>

<!-- Case Heading -->
<h1 class="mb-2 text-xl font-bold">Case #{caseDetails?.case_number}</h1>
{#if caseDetails}
	<div class="mb-6 w-full rounded-lg bg-gray-100 shadow-md">
		<div class="flex items-center">
			<button
				on:click={scrollLeft}
				class="shrink-0 rounded bg-gray-300 px-2 py-1 text-sm font-bold hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={isAtStart}
			>
				&lt;
			</button>
			<div class="mx-2 min-w-0 flex-1 overflow-hidden">
				<div
					bind:this={progressContainer}
					class="scrollbar-hide flex gap-2 overflow-x-auto scroll-smooth py-1"
				>
					{#each statuses as status}
						<div
							class="flex min-w-fit shrink-0 rounded-md px-4 py-2 text-xs font-semibold transition-all"
							class:bg-blue-600={status === caseDetails.status}
							class:text-white={status === caseDetails.status}
							class:bg-gray-300={status !== caseDetails.status}
						>
							{status}
						</div>
					{/each}
				</div>
			</div>
			<button
				on:click={scrollRight}
				class="shrink-0 rounded bg-gray-300 px-2 py-1 text-sm font-bold hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={isAtEnd}
			>
				&gt;
			</button>
		</div>
	</div>
{/if}

<!-- Tabs -->
<div class="border-b border-gray-300">
	<nav class="-mb-px flex space-x-8">
		<button
			class={`rounded-t px-3 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-l border-r border-t bg-white' : 'text-gray-600 hover:text-black'}`}
			on:click={() => (activeTab = 'details')}>Case Details</button
		>
		<button
			class={`rounded-t px-3 py-2 text-sm font-medium ${activeTab === 'messages' ? 'border-l border-r border-t bg-white' : 'text-gray-600 hover:text-black'}`}
			on:click={() => (activeTab = 'messages')}>Messages</button
		>
		<button
			class={`rounded-t px-3 py-2 text-sm font-medium ${activeTab === 'fees' ? 'border-l border-r border-t bg-white' : 'text-gray-600 hover:text-black'}`}
			on:click={() => (activeTab = 'fees')}>Fees</button
		>
		<button
			class={`rounded-t px-3 py-2 text-sm font-medium ${activeTab === 'documents' ? 'border-l border-r border-t bg-white' : 'text-gray-600 hover:text-black'}`}
			on:click={() => (activeTab = 'documents')}>Documents</button
		>
	</nav>
</div>

{#if activeTab === 'details'}
	<div class="grid grid-cols-3 gap-2">
		<!-- Main Case Details -->
		<div
			class={`${user.role === 'client' || user.role === 'attorney' ? 'col-span-3' : 'col-span-2'} space-y-4 rounded border bg-white p-4 shadow`}
		>
			<div class="flex justify-between">
				<h3 class="text-lg font-semibold">Case Information</h3>
				{#if user.role === 'admin' || user.role === 'operations'}
					<button
						on:click={enableEdit}
						class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Edit</button
					>
				{/if}
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-sm font-semibold">Case Type:</p>
					<p class="text-sm text-gray-800">{caseDetails?.type}</p>
				</div>
				<div>
					<p class="text-sm font-semibold">Property Address:</p>
					<p class="text-sm text-gray-800">{caseDetails?.property_id}</p>
				</div>

				<div>
					<p class="text-sm font-semibold">Start Date:</p>
					<p class="text-sm text-gray-800">{caseDetails?.start_date || '—'}</p>
				</div>
				<div>
					<p class="text-sm font-semibold">End Date:</p>
					<p class="text-sm text-gray-800">{caseDetails?.end_date || '—'}</p>
				</div>

				<div>
					<p class="text-sm font-semibold">Court Name:</p>
					<p class="text-sm text-gray-800">{caseDetails?.court_name}</p>
				</div>
				<div>
					<p class="text-sm font-semibold">Court Case #:</p>
					{#if isEditingDetails}
						<input
							type="text"
							class="w-full rounded border px-2 py-1 text-sm"
							bind:value={editableDetails.court_case_number}
						/>
					{:else}
						<p class="text-sm text-gray-800">{caseDetails?.court_case_number}</p>
					{/if}
				</div>

				<div>
					<p class="text-sm font-semibold">Court Decision:</p>
					{#if isEditingDetails}
						<input
							type="text"
							class="w-full rounded border px-2 py-1 text-sm"
							bind:value={editableDetails.court_decision}
						/>
					{:else}
						<p class="text-sm text-gray-800">{caseDetails?.court_decision}</p>
					{/if}
				</div>
				<div>
					<p class="text-sm font-semibold">Plaintiff:</p>
					<p class="text-sm text-gray-800">{caseDetails?.client_id}</p>
				</div>

				<div>
					<p class="text-sm font-semibold">Defendant:</p>
					<p class="text-sm text-gray-800">{caseDetails?.tenant_id}</p>
				</div>
				<div>
					<p class="text-sm font-semibold">Assigned Attorney:</p>
					{#if isEditingDetails}
						<select
							class="w-full rounded border px-2 py-1 text-sm"
							bind:value={editableDetails.attorney_id}
						>
							<option value="">Select Attorney</option>
							<!-- populate with real attorney list later -->
						</select>
					{:else}
						<p class="text-sm text-gray-800">{caseDetails?.attorney_id}</p>
					{/if}
				</div>

				<div>
					<p class="text-sm font-semibold">Assigned Operator:</p>
					{#if isEditingDetails}
						<select
							class="w-full rounded border px-2 py-1 text-sm"
							bind:value={editableDetails.operator_id}
						>
							<option value="">Select Operator</option>
							<!-- populate with real operator list later -->
						</select>
					{:else}
						<p class="text-sm text-gray-800">{caseDetails?.operator_id}</p>
					{/if}
				</div>
			</div>

			{#if isEditingDetails}
				<div class="mt-4 gap-2 text-right">
					<button
						class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
						on:click={saveCaseDetails}
					>
						Save
					</button>
					<button
						class="rounded bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400"
						on:click={cancelCaseEdit}
					>
						Cancel
					</button>
				</div>
			{/if}
		</div>

		<!-- Operations Toolbox -->
		{#if user.role === 'admin' || user.role === 'operations'}
			<div class="rounded border bg-gray-700 p-4 text-white shadow">
				<h3 class="mb-2 text-sm font-semibold">Operations Toolbox</h3>
				<div class="space-y-2">
					<label for="status" class="block text-xs">Update Status:</label>
					<select
						id="status"
						bind:value={newStatus}
						class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-black"
					>
						<option value="">Select a status</option>
						{#each statuses as status}
							<option value={status}>{status}</option>
						{/each}
					</select>
					<button
						class="mt-2 rounded bg-white px-3 py-1 text-sm text-gray-900 hover:bg-gray-200"
						on:click={saveStatus}
						disabled={!newStatus || newStatus === caseDetails.status}>Save Status</button
					>
				</div>
			</div>
		{/if}
	</div>

	<!-- Internal Notes -->
	<div class="mt-2 rounded border bg-gray-700 p-4 text-white">
		<h3 class="mb-2 text-sm font-semibold">Internal Notes</h3>
		<div class="max-h-[calc(100vh-250px)] overflow-y-auto">
			<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
				<thead class="sticky top-0 z-10 bg-gray-700 text-xs font-medium uppercase text-white">
					<tr>
						<th class="pb-1">Note</th>
						<th class="pb-1">User</th>
						<th class="pb-1">Date</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					<tr>
						<td class="py-1 italic text-gray-300" colspan="3">No notes available.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
{:else if activeTab === 'messages'}
	<div class="flex h-[60vh] flex-col rounded border border-gray-300 bg-white">
		<div class="border-b px-4 py-3 font-bold bg-gray-700 text-white">Message Thread</div>
		<div class="flex-1 space-y-4 overflow-y-auto px-6 py-4">
			{#each messages.filter((msg) => msg.case_id === caseId) as msg}
				<div
					class={`flex flex-col space-y-1 ${msg.sender_id === currentUser ? 'items-end' : 'items-start'}`}
				>
					<div class="mb-1 text-xs font-semibold text-gray-500">
						{msg.sender_id === currentUser ? 'You' : `Sender: ${msg.sender_id.slice(0, 6)}`}
					</div>
					<div
						class={`max-w-[75%] rounded-xl border px-4 py-2 text-sm shadow ${msg.sender_id === currentUser ? 'border-blue-200 bg-blue-100 text-gray-800' : 'border-gray-300 bg-gray-100 text-gray-800'}`}
					>
						{msg.content}
					</div>
					<div class="mt-1 text-[11px] italic text-gray-400">
						{new Date(msg.created_at).toLocaleString()}
					</div>
				</div>
			{/each}
		</div>
		<div class="border-t bg-gray-50 px-4 py-3">
			<form on:submit|preventDefault={sendMessage} class="flex gap-2">
				<input
					type="text"
					bind:value={messageContent}
					placeholder="Type your message..."
					class="flex-1 rounded border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-300 focus:outline-none focus:ring"
				/>
				<button
					type="submit"
					class="rounded bg-gray-700 px-4 py-2 text-sm text-white shadow hover:bg-gray-800 disabled:opacity-50"
					disabled={!messageContent.trim() || isSending}
				>
					{isSending ? 'Sending...' : 'Send'}
				</button>
			</form>
		</div>
	</div>
{:else if activeTab === 'fees'}
	<!-- Fees Tab Content -->
	<div class="space-y-6 rounded border border-gray-300 bg-white p-4">
		<!-- Client-Entered Fees (Rent/Fees/Claims) -->
		<div>
			<h3 class="mb-2 text-lg font-semibold">Client-Entered Fees</h3>
			<!-- Replace with dynamic data later -->
			<table class="min-w-full text-left text-sm">
				<thead class="bg-gray-100">
					<tr>
						<th class="px-4 py-2 font-semibold">Type</th>
						<th class="px-4 py-2 font-semibold">Amount</th>
						<th class="px-4 py-2 font-semibold">Description</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					<tr>
						<td class="px-4 py-2">Rent</td>
						<td class="px-4 py-2">$1,000.00</td>
						<td class="px-4 py-2">April Rent</td>
					</tr>
					<tr>
						<td class="px-4 py-2">Fee</td>
						<td class="px-4 py-2">$50.00</td>
						<td class="px-4 py-2">Late Fee</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- File Fees Section -->
		<div>
			<div class="flex items-center justify-between">
				<h3 class="mb-2 text-lg font-semibold">File Fees</h3>
				{#if ['admin', 'operations'].includes(user?.role)}
					<button
						on:click={() => (showFeeForm = !showFeeForm)}
						class="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-800"
					>
						{showFeeForm ? 'Cancel' : 'Add Fee'}
					</button>
				{/if}
			</div>
			<!-- Replace with dynamic data later -->
			<table class="min-w-full text-left text-sm">
				<thead class="bg-gray-100">
					<tr>
						<th class="px-4 py-2 font-semibold">Type</th>
						<th class="px-4 py-2 font-semibold">Amount</th>
						<th class="px-4 py-2 font-semibold">Date</th>
						<th class="px-4 py-2 font-semibold">Added By</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					<tr>
						<td class="px-4 py-2">Court Filing Fee</td>
						<td class="px-4 py-2">$75.00</td>
						<td class="px-4 py-2">04/10/2025</td>
						<td class="px-4 py-2">Admin</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- New Fee Form (Admin/Ops Only) -->
		{#if showFeeForm && ['admin', 'operations'].includes(user?.role)}
			<div class="rounded border border-gray-200 bg-gray-50 p-4">
				<h4 class="mb-2 text-sm font-semibold">Add File Fee</h4>
				<form class="grid grid-cols-3 gap-4">
					<div class="col-span-1">
						<label for="fee-type" class="block text-sm font-medium text-gray-700">Fee Type</label>
						<input
							type="text"
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							placeholder="e.g. Service Fee"
						/>
					</div>
					<div class="col-span-1">
						<label for="amount" class="block text-sm font-medium text-gray-700">Amount</label>
						<input
							type="number"
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							placeholder="$"
						/>
					</div>
					<div class="col-span-1">
						<label for="date" class="block text-sm font-medium text-gray-700">Date</label>
						<input
							type="date"
							id="date"
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						/>
					</div>
					<div class="col-span-3 flex justify-end">
						<button
							type="submit"
							class="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-800"
							>Save Fee</button
						>
					</div>
				</form>
			</div>
		{/if}
	</div>
{:else if activeTab === 'documents'}
	<div class="rounded border border-gray-300 bg-white p-4">
		<h3 class="mb-4 text-lg font-semibold">Documents & Invoices</h3>

		<div class="mb-4 flex items-center gap-4">
			<input
				type="text"
				placeholder="Search documents..."
				class="flex-grow rounded-md border border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-blue-300 focus:outline-none focus:ring"
			/>
			<button
				class="shrink-0 rounded bg-gray-700 px-4 py-2 text-sm text-white shadow hover:bg-gray-800"
			>
				Upload Document
			</button>
		</div>

		<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
			<thead class="bg-gray-700 text-xs font-medium uppercase text-white">
				<tr>
					<th class="px-4 py-2">Name</th>
					<th class="px-4 py-2">Type</th>
					<th class="px-4 py-2">Description</th>
					<th class="px-4 py-2">Uploaded By</th>
					<th class="px-4 py-2">Uploaded At</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				<tr>
					<td class="px-4 py-2">Lease Agreement</td>
					<td class="px-4 py-2">PDF</td>
					<td class="px-4 py-2">Lease signed by tenant</td>
					<td class="px-4 py-2">Jane Smith</td>
					<td class="px-4 py-2">04/10/2025</td>
				</tr>
				<tr>
					<td class="px-4 py-2">Invoice #123</td>
					<td class="px-4 py-2">Invoice</td>
					<td class="px-4 py-2">Legal filing fee</td>
					<td class="px-4 py-2">John Doe</td>
					<td class="px-4 py-2">04/12/2025</td>
				</tr>
			</tbody>
		</table>
	</div>
{/if}

<style>
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
		height: 0;
		width: 0;
	}
</style>
