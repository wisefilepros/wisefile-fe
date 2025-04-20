<script>
	import { createEventDispatcher } from 'svelte';
	import { apiFetch } from '$lib/api/fetchWithBase';

	export let show = false;
	export let client = null;

	const dispatch = createEventDispatcher();

	let form = {
		display_name: '',
		legal_name: '',
		phone_number: '',
		email: '',
		mailing_address: emptyAddress(),
		billing_address: emptyAddress(),
		physical_address: emptyAddress(),
		management_companies: []
	};

	let sameAsMailingForBilling = false;
	let sameAsMailingForPhysical = false;
	let isSaving = false;
	let error = '';

	function emptyAddress() {
		return {
			address: '',
			city: '',
			state: '',
			zip: ''
		};
	}

	// Keep address copies in sync
	$: if (sameAsMailingForBilling) {
		form.billing_address = { ...form.mailing_address };
	}
	$: if (sameAsMailingForPhysical) {
		form.physical_address = { ...form.mailing_address };
	}

	// Reset form on modal open
	$: if (show) {
		if (client) {
			form = {
				display_name: client.display_name,
				legal_name: client.legal_name,
				phone_number: client.phone_number,
				email: client.email,
				mailing_address: client.mailing_address || emptyAddress(),
				billing_address: client.billing_address || emptyAddress(),
				physical_address: client.physical_address || emptyAddress(),
				management_companies: client.management_companies?.map((mc) => ({ ...mc })) || []
			};
		} else {
			form = {
				display_name: '',
				legal_name: '',
				phone_number: '',
				email: '',
				mailing_address: emptyAddress(),
				billing_address: emptyAddress(),
				physical_address: emptyAddress(),
				management_companies: []
			};
		}

		error = '';
		sameAsMailingForBilling = false;
		sameAsMailingForPhysical = false;
	}

	function getChangedFields() {
		const changed = {};
		for (const key in form) {
			if (JSON.stringify(form[key]) !== JSON.stringify(client?.[key])) {
				changed[key] = form[key];
			}
		}
		return changed;
	}

	function addManagementCompany() {
		form.management_companies = [
			...form.management_companies.map((mc) => ({ ...mc })),
			{ name: '', users: [] }
		];
	}

	function removeManagementCompany(index) {
		form.management_companies = form.management_companies
			.map((mc) => ({ ...mc }))
			.filter((_, i) => i !== index);
	}

	async function submit() {
		isSaving = true;
		error = '';

		try {
			if (client) {
				const updates = getChangedFields();
				if (Object.keys(updates).length > 0) {
					await apiFetch(`/api/clients/${client._id}`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(updates)
					});
				}
			} else {
				await apiFetch('/api/clients', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(form)
				});
			}

			dispatch('refresh');
			dispatch('close');
		} catch (err) {
			error = err.message || 'Failed to save client';
		} finally {
			isSaving = false;
		}
	}

	function close() {
		dispatch('close');
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
		<div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded bg-white p-6 shadow-xl">
			<h2 class="mb-4 text-lg font-semibold">{client ? 'Edit' : 'Create'} Client</h2>

			{#if error}
				<div class="mb-2 rounded bg-red-100 px-4 py-2 text-sm text-red-700">{error}</div>
			{/if}

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="display_name" class="block text-sm font-medium text-gray-700"
						>Display Name</label
					>
					<input
						id="display_name"
						type="text"
						autocomplete="off"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						bind:value={form.display_name}
					/>
				</div>

				<div>
					<label for="legal_name" class="block text-sm font-medium text-gray-700">Legal Name</label>
					<input
						id="legal_name"
						type="text"
						autocomplete="off"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						bind:value={form.legal_name}
					/>
				</div>

				<div>
					<label for="phone_number" class="block text-sm font-medium text-gray-700"
						>Phone Number</label
					>
					<input
						id="phone_number"
						type="text"
						autocomplete="off"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						bind:value={form.phone_number}
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
					<input
						id="email"
						type="email"
						autocomplete="off"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						bind:value={form.email}
					/>
				</div>
			</div>

			<div class="mt-6 space-y-4">
				<h3 class="text-sm font-semibold text-gray-700">Addresses</h3>
				{#each ['mailing', 'billing', 'physical'] as type}
					<fieldset class="rounded border p-4">
						<legend class="text-xs font-medium uppercase text-gray-500">{type} Address</legend>

						{#if type !== 'mailing'}
							<label class="mb-2 flex items-center gap-2 text-xs text-gray-600">
								<input
									type="checkbox"
									checked={type === 'billing' ? sameAsMailingForBilling : sameAsMailingForPhysical}
									on:change={(e) => {
										if (type === 'billing') {
											sameAsMailingForBilling = e.target.checked;
											if (e.target.checked) {
												form.billing_address = { ...form.mailing_address };
											}
										} else {
											sameAsMailingForPhysical = e.target.checked;
											if (e.target.checked) {
												form.physical_address = { ...form.mailing_address };
											}
										}
									}}
								/>
								Same as mailing address
							</label>
						{/if}

						<div class="grid grid-cols-2 gap-4">
							<input
								type="text"
								class="col-span-2 rounded border border-gray-300 px-3 py-2 text-sm"
								placeholder="Address"
								bind:value={form[`${type}_address`].address}
							/>
							<input
								type="text"
								class="rounded border border-gray-300 px-3 py-2 text-sm"
								placeholder="City"
								bind:value={form[`${type}_address`].city}
							/>
							<input
								type="text"
								class="rounded border border-gray-300 px-3 py-2 text-sm"
								placeholder="State"
								bind:value={form[`${type}_address`].state}
							/>
							<input
								type="text"
								class="rounded border border-gray-300 px-3 py-2 text-sm"
								placeholder="ZIP"
								bind:value={form[`${type}_address`].zip}
							/>
						</div>
					</fieldset>
				{/each}

				<h3 class="text-sm font-semibold text-gray-700">Management Companies</h3>
				<div class="space-y-4">
					{#each form.management_companies as mc, index (index)}
						<div class="rounded border border-gray-300 p-4">
							<label for="company_name" class="block text-xs font-medium text-gray-700"
								>Company Name</label
							>
							<input
								type="text"
								class="mb-2 mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
								bind:value={mc.name}
							/>
							<label for="users" class="block text-xs font-medium text-gray-700"
								>Users (future select)</label
							>
							<div class="text-xs italic text-gray-500">User selection coming soon</div>
							<button
								type="button"
								class="mt-2 text-xs text-red-500 hover:underline"
								on:click={() => removeManagementCompany(index)}
							>
								Remove
							</button>
						</div>
					{/each}
					<button
						type="button"
						class="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
						on:click={addManagementCompany}
					>
						+ Add Management Company
					</button>
				</div>
			</div>

			<div class="mt-6 flex justify-end gap-2">
				<button
					on:click={close}
					type="button"
					class="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
				>
					Cancel
				</button>
				<button
					on:click={submit}
					type="button"
					class="rounded bg-gray-700 px-4 py-2 text-sm text-white shadow hover:bg-gray-800 disabled:opacity-50"
					disabled={isSaving ||
						!form.display_name ||
						!form.legal_name ||
						!form.phone_number ||
						!form.email}
				>
					{isSaving ? 'Saving...' : 'Save'}
				</button>
			</div>
		</div>
	</div>
{/if}
