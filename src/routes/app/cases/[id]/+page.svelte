<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { page } from '$app/stores';
	import { apiFetch } from '$lib/api/fetchWithBase';

	export let data;
	console.log('Case details data:', data);
	let { user } = $auth;
	let selectedCaseId = data._id;
	let messages = data.messages ?? [];
	let activeTab = 'details';
	let progressContainer;
	let isAtStart = true;
	let isAtEnd = false;
	let showFeeForm = false;
	let messageContent = '';
	let isSending = false;
	let caseDetails = data?.caseRecord || null;
	let statuses = data?.caseStatuses || [];
	let currentUser = data?.me?._id || '';
	let caseId = caseDetails?._id || '';
	let isEditingDetails = false;
	let editableDetails = {};
	let originalDetails = {};
	let newStatus = '';
	let selectedRecipients = [];
	let selectedCC = [];
	let showRecipientDropdown = false;
	let showCCDropdown = false;
	let newFee = { type: '', amount: '', date: '' };
	let fees = data?.case?.fees ?? [];
	let newNote = '';
	let isSavingNote = false;

	const participantSet = new Map();

	messages.forEach((msg) => {
		if (msg.sender_id && typeof msg.sender_id === 'object') {
			participantSet.set(msg.sender_id._id, msg.sender_id);
		}
		msg.recipient_ids?.forEach((r) => {
			if (r && typeof r === 'object') {
				participantSet.set(r._id, r);
			}
		});
	});

	const participantOptions = Array.from(participantSet.values());

	// Users from same client (excluding current user)
	const ccOptions =
		data?.client?.users
			?.filter((u) => u._id !== currentUser)
			.map((u) => ({
				_id: u._id,
				full_name: u.full_name
			})) ?? [];

	function toggleSelection(list, id) {
		const idx = list.indexOf(id);
		if (idx !== -1) {
			list.splice(idx, 1);
		} else {
			list.push(id);
		}

		// Force reactivity
		if (list === selectedRecipients) {
			selectedRecipients = [...list];
		} else if (list === selectedCC) {
			selectedCC = [...list];
		}
	}

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
			const allRecipientIds = [...selectedRecipients, ...selectedCC];

			const payload = {
				case_id: caseId,
				sender_id: currentUser,
				recipient_ids: allRecipientIds,
				message_type: 'text',
				content: messageContent.trim(),
				visible_to_users: true
			};

			const newMessage = await apiFetch('/messages', {
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

	async function submitFeeForm(event) {
		event.preventDefault();

		if (!newFee.type || !newFee.amount) {
			alert('Fee type and amount are required.');
			return;
		}

		try {
			const payload = {
				case_id: caseId,
				client_id: user.client_id,
				type: newFee.type,
				amount: parseFloat(newFee.amount),
				description: '', // Optionally add description later
				created_at: newFee.date ? new Date(newFee.date).toISOString() : undefined
			};

			const res = await apiFetch('/fees', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			fees = [...fees, res]; // Push to local list
			newFee = { type: '', amount: '', date: '' };
			showFeeForm = false;
		} catch (err) {
			console.error('Fee creation failed:', err);
			alert('Failed to add fee.');
		}
	}

	async function saveInternalNote() {
		if (!newNote.trim()) return;

		try {
			isSavingNote = true;

			const payload = {
				internal_notes: [
					...(caseDetails.internal_notes ?? []),
					{
						note: newNote,
						user_id: user._id,
						date: new Date().toISOString()
					}
				]
			};

			const res = await apiFetch(`/cases/${caseDetails._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) throw new Error('Failed to save note');

			const updated = await res.json();
			caseDetails.internal_notes = updated.internal_notes;
			newNote = '';
		} catch (err) {
			console.error('Error saving internal note:', err);
			alert('Could not save note.');
		} finally {
			isSavingNote = false;
		}
	}

	async function uploadDocument(event) {
		const file = event.target.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('client_id', user.client_id); // or $auth.user.client_id
		formData.append('type', 'case'); // optional, categorize as needed
		formData.append('case_id', caseDetails._id);

		try {
			const res = await apiFetch('/documents', {
				method: 'POST',
				body: formData
			});
			const uploaded = await res.json();
			caseDetails.documents.push(uploaded);
		} catch (err) {
			console.error('Upload failed:', err);
			alert('Failed to upload document.');
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
		await apiFetch(`/cases/${caseDetails._id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: newStatus })
		});
		caseDetails.status = newStatus;
		newStatus = '';
	}

	async function saveCaseDetails() {
		await apiFetch(`/cases/${caseDetails._id}`, {
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
					<p class="text-sm font-semibold">Court Name:</p>
					<p class="text-sm text-gray-800">{caseDetails?.court_name}</p>
				</div>
				<div>
					<p class="text-sm font-semibold">End Date:</p>
					<p class="text-sm text-gray-800">{caseDetails?.end_date || '—'}</p>
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
				<!-- Assigned Attorney -->
				<div>
					<p class="text-sm font-semibold">Assigned Attorney:</p>
					{#if isEditingDetails}
						<select
							class="w-full rounded border px-2 py-1 text-sm"
							bind:value={editableDetails.attorney_id}
						>
							<option value="">Select Attorney</option>
							{#each data?.case?.dropdowns?.attorneys ?? [] as attorney}
								<option value={attorney._id}>{attorney.full_name}</option>
							{/each}
						</select>
					{:else}
						<p class="text-sm text-gray-800">
							{caseDetails?.attorney_id?.full_name ?? '—'}
						</p>
					{/if}
				</div>

				<!-- Assigned Operator -->
				<div>
					<p class="text-sm font-semibold">Assigned Operator:</p>
					{#if isEditingDetails}
						<select
							class="w-full rounded border px-2 py-1 text-sm"
							bind:value={editableDetails.operator_id}
						>
							<option value="">Select Operator</option>
							{#each data?.case?.dropdowns?.operators ?? [] as operator}
								<option value={operator._id}>{operator.full_name}</option>
							{/each}
						</select>
					{:else}
						<p class="text-sm text-gray-800">
							{caseDetails?.operator_id?.full_name ?? '—'}
						</p>
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

		<!-- Add New Note -->
		{#if ['admin', 'operations'].includes(user?.role)}
			<div class="mb-4">
				<textarea
					class="w-full rounded border border-gray-400 bg-gray-800 p-2 text-sm text-white"
					bind:value={newNote}
					placeholder="Add an internal note..."
				></textarea>
				<div class="mt-2 flex justify-end">
					<button
						class="rounded bg-white px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-200 disabled:opacity-50"
						on:click={saveInternalNote}
						disabled={isSavingNote || !newNote.trim()}
					>
						{isSavingNote ? 'Saving...' : 'Save Note'}
					</button>
				</div>
			</div>
		{/if}

		<!-- Notes Table -->
		<div class="max-h-[calc(100vh-250px)] overflow-y-auto">
			<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
				<thead class="sticky top-0 z-10 bg-gray-700 text-xs font-medium uppercase text-white">
					<tr>
						<th class="pb-1">Note</th>
						<th class="pb-1">User</th>
						<th class="pb-1">Date</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-300">
					{#if data?.caseDetails?.internal_notes}
						{#each caseDetails.internal_notes as note}
							<tr>
								<td class="py-2">{note.note}</td>
								<td class="py-2 text-gray-200">{note.user?.full_name || '—'}</td>
								<td class="py-2 text-gray-400">
									{new Date(note.date).toLocaleString()}
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td class="py-2 italic text-gray-300" colspan="3">No notes available.</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
{:else if activeTab === 'messages'}
	<div class="flex h-[60vh] flex-col rounded border border-gray-300 bg-white">
		<div class="border-b bg-gray-700 px-4 py-3 font-bold text-white">Message Thread</div>
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
			<!-- Recipient & CC Dropdowns -->
			<div class="mb-4 flex flex-wrap gap-4">
				<!-- Recipients -->
				<div class="relative w-1/2">
					<label for="recipients" class="mb-1 block text-xs font-semibold text-gray-700"
						>Send To</label
					>
					<button
						type="button"
						class="flex min-h-[42px] w-full cursor-pointer flex-wrap items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm"
						on:click={() => (showRecipientDropdown = !showRecipientDropdown)}
					>
						<span class="text-gray-400">
							{selectedRecipients.length === 0
								? 'Select recipient(s)'
								: `${selectedRecipients.length} selected`}
						</span>
					</button>

					{#if showRecipientDropdown}
						<div
							class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded border border-gray-300 bg-white shadow"
						>
							{#each participantOptions as option}
								<label class="flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-gray-50">
									<input
										type="checkbox"
										checked={selectedRecipients.includes(option._id)}
										on:change={() => toggleSelection(selectedRecipients, option._id)}
										class="mr-2"
									/>
									{option.full_name}
								</label>
							{/each}
						</div>
					{/if}
				</div>

				<!-- CC -->
				<div class="relative w-1/2">
					<label for="cc" class="mb-1 block text-xs font-semibold text-gray-700">CC</label>
					<button
						type="button"
						class="flex min-h-[42px] w-full cursor-pointer flex-wrap items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm"
						on:click={() => (showCCDropdown = !showCCDropdown)}
						on:keydown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								showCCDropdown = !showCCDropdown;
							}
						}}
					>
						<span class="text-gray-400">
							{selectedCC.length === 0 ? 'Select CC(s)' : `${selectedCC.length} selected`}
						</span>
					</button>

					{#if showCCDropdown}
						<div
							class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded border border-gray-300 bg-white shadow"
						>
							{#each ccOptions as option}
								<label class="flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-gray-50">
									<input
										type="checkbox"
										checked={selectedCC.includes(option._id)}
										on:change={() => toggleSelection(selectedCC, option._id)}
										class="mr-2"
									/>
									{option.full_name}
								</label>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Message Input -->
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
					disabled={!messageContent.trim() || isSending || selectedRecipients.length === 0}
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

			{#if caseDetails?.rentFeesClaims}
				<table class="min-w-full text-left text-sm">
					<thead class="bg-gray-100">
						<tr>
							<th class="px-4 py-2 font-semibold">Type</th>
							<th class="px-4 py-2 font-semibold">Amount</th>
							<th class="px-4 py-2 font-semibold">Description</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#if caseDetails.rentFeesClaims.baseRent > 0 && caseDetails.rentFeesClaims.monthsUnpaid > 0}
							<tr>
								<td class="px-4 py-2">Rent</td>
								<td class="px-4 py-2">
									${(
										caseDetails.rentFeesClaims.baseRent * caseDetails.rentFeesClaims.monthsUnpaid
									).toFixed(2)}
								</td>
								<td class="px-4 py-2">
									Base Rent x {caseDetails.rentFeesClaims.monthsUnpaid} months
								</td>
							</tr>
						{/if}

						{#if caseDetails.rentFeesClaims.lateFee > 0 && caseDetails.rentFeesClaims.lateMonths > 0}
							<tr>
								<td class="px-4 py-2">Late Fees</td>
								<td class="px-4 py-2">
									${(
										caseDetails.rentFeesClaims.lateFee * caseDetails.rentFeesClaims.lateMonths
									).toFixed(2)}
								</td>
								<td class="px-4 py-2">
									Late Fee x {caseDetails.rentFeesClaims.lateMonths} months
								</td>
							</tr>
						{/if}

						{#if caseDetails.rentFeesClaims.filingFee > 0}
							<tr>
								<td class="px-4 py-2">Filing Fee</td>
								<td class="px-4 py-2">${caseDetails.rentFeesClaims.filingFee.toFixed(2)}</td>
								<td class="px-4 py-2">One-time court filing fee</td>
							</tr>
						{/if}

						{#each caseDetails.rentFeesClaims.miscDebts as debt}
							<tr>
								<td class="px-4 py-2">Misc</td>
								<td class="px-4 py-2">${debt.amount?.toFixed(2)}</td>
								<td class="px-4 py-2">{debt.description}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p class="text-sm italic text-gray-500">No rent or claim details found for this case.</p>
			{/if}
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

			{#if fees.length > 0}
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
						{#each fees as fee}
							<tr>
								<td class="px-4 py-2">{fee.type}</td>
								<td class="px-4 py-2">${fee.amount.toFixed(2)}</td>
								<td class="px-4 py-2">
									{new Date(fee.created_at).toLocaleDateString()}
								</td>
								<td class="px-4 py-2">
									{fee.created_by?.full_name || '—'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p class="text-sm italic text-gray-500">No fees recorded yet.</p>
			{/if}
		</div>

		<!-- New Fee Form -->
		{#if showFeeForm && ['admin', 'operations'].includes(user?.role)}
			<div class="rounded border border-gray-200 bg-gray-50 p-4">
				<h4 class="mb-2 text-sm font-semibold">Add File Fee</h4>
				<form class="grid grid-cols-3 gap-4" on:submit={submitFeeForm}>
					<div class="col-span-1">
						<label for="fee-type" class="block text-sm font-medium text-gray-700">Fee Type</label>
						<input
							type="text"
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							bind:value={newFee.type}
							placeholder="e.g. Service Fee"
						/>
					</div>
					<div class="col-span-1">
						<label for="fee-amount" class="block text-sm font-medium text-gray-700">Amount</label>
						<input
							type="number"
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							bind:value={newFee.amount}
							placeholder="$"
							min="0"
							step="0.01"
						/>
					</div>
					<div class="col-span-1">
						<label for="fee-date" class="block text-sm font-medium text-gray-700">Date</label>
						<input
							type="date"
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							bind:value={newFee.date}
						/>
					</div>
					<div class="col-span-3 flex justify-end">
						<button
							type="submit"
							class="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-800"
						>
							Save Fee
						</button>
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
			<!-- Upload Button -->
			<input
				id="file-upload"
				type="file"
				accept="application/pdf,image/*"
				on:change={uploadDocument}
				class="hidden"
			/>
			<button
				on:click={() => document.getElementById('file-upload').click()}
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
				{#each caseDetails.documents as doc}
					<tr>
						<td class="px-4 py-2">
							<a href={doc.file_url} target="_blank" class="text-blue-600 hover:underline">
								{doc.name || 'Unnamed File'}
							</a>
						</td>
						<td class="px-4 py-2">{doc.file_type || '—'}</td>
						<td class="px-4 py-2">{doc.description || '—'}</td>
						<td class="px-4 py-2">{doc.uploaded_by?.full_name || '—'}</td>
						<td class="px-4 py-2">
							{new Date(doc.uploaded_at).toLocaleDateString(undefined, {
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
						</td>
					</tr>
				{/each}
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
