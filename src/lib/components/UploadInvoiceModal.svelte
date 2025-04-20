<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { apiFetch } from '$lib/api/fetchWithBase';

	const dispatch = createEventDispatcher();

	let clients = [];
	let cases = [];
	let fees = [];

	let selectedClientId = '';
	let selectedCaseId = '';
	let selectedFeeIds = [];
	let description = '';
	let invoiceDate = '';
	let dueDate = '';
	let isSubmitting = false;
	let error = '';

	let amount = 0;

	async function fetchClients() {
		try {
			clients = await apiFetch('/clients');
		} catch (err) {
			console.error('Failed to fetch clients', err);
		}
	}

	async function fetchCases() {
		if (!selectedClientId) return;
		try {
			cases = await apiFetch(`/cases?client_id=${selectedClientId}`);
		} catch (err) {
			console.error('Failed to fetch cases', err);
		}
	}

	async function fetchFees() {
		if (!selectedCaseId) return;
		try {
			fees = await apiFetch(`/fees?case_id=${selectedCaseId}`);
		} catch (err) {
			console.error('Failed to fetch fees', err);
		}
	}

	$: if (selectedFeeIds.length && fees.length) {
		amount = fees
			.filter((f) => selectedFeeIds.includes(f._id))
			.reduce((sum, f) => sum + (f.amount || 0), 0);
	}

	onMount(fetchClients);
	$: fetchCases();
	$: fetchFees();

	async function submitInvoice() {
		if (!selectedClientId || !selectedCaseId || !invoiceDate || !dueDate) {
			error = 'Please fill out all required fields.';
			return;
		}

		const payload = {
			client_id: selectedClientId,
			case_id: selectedCaseId,
			amount,
			invoice_date: invoiceDate,
			due_date: dueDate,
			description,
			associated_fees: selectedFeeIds
		};

		try {
			isSubmitting = true;
			error = '';

			// await apiFetch('/api/invoices', {
			//   method: 'POST',
			//   body: JSON.stringify(payload),
			//   headers: { 'Content-Type': 'application/json' }
			// });

			dispatch('close');
		} catch (err) {
			console.error('Error submitting invoice', err);
			error = 'Failed to submit invoice';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
	<div class="relative w-full max-w-lg rounded bg-white p-6 shadow-lg">
		<h2 class="mb-4 text-lg font-semibold">Upload Invoice</h2>

		{#if error}
			<div class="mb-2 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</div>
		{/if}

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="client" class="text-sm font-medium">Client</label>
				<select id="client" bind:value={selectedClientId} class="mt-1 w-full rounded border px-2 py-1 text-sm">
					<option value="">Select client</option>
					{#each clients as c}
						<option value={c._id}>{c.display_name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="case" class="text-sm font-medium">Case</label>
				<select id="case" bind:value={selectedCaseId} class="mt-1 w-full rounded border px-2 py-1 text-sm">
					<option value="">Select case</option>
					{#each cases as c}
						<option value={c._id}>{c.case_number}</option>
					{/each}
				</select>
			</div>

			<div class="col-span-2">
				<label for="fees" class="text-sm font-medium">Associated Fees</label>
				<select
					multiple
					bind:value={selectedFeeIds}
					class="mt-1 h-24 w-full rounded border px-2 py-1 text-sm"
					id="fees"
				>
					{#each fees as f}
						<option value={f._id}>{f.description} (${f.amount})</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="invoiceDate" class="text-sm font-medium">Invoice Date</label>
				<input
					type="date"
					bind:value={invoiceDate}
					class="mt-1 w-full rounded border px-2 py-1 text-sm"
					id="invoiceDate"
				/>
			</div>

			<div>
				<label for="dueDate" class="text-sm font-medium">Due Date</label>
				<input
					type="date"
					bind:value={dueDate}
					class="mt-1 w-full rounded border px-2 py-1 text-sm"
					id="dueDate"
				/>
			</div>

			<div class="col-span-2">
				<label for="description" class="text-sm font-medium">Description</label>
				<textarea
					bind:value={description}
					rows="2"
					class="mt-1 w-full rounded border px-2 py-1 text-sm"
					id="description"
				></textarea>
			</div>

			<div class="col-span-2 text-sm text-gray-600">
				Amount: <span class="font-semibold text-black">${amount.toFixed(2)}</span>
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
				on:click={submitInvoice}
				class="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Uploading...' : 'Submit'}
			</button>
		</div>
	</div>
</div>
