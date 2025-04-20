<script>
	import { createEventDispatcher } from 'svelte';
	import { apiFetch } from '$lib/api/fetchWithBase';

	export let show = false;
	export let user = null;
	export let clients = [];

	const dispatch = createEventDispatcher();

	let isSaving = false;
	let error = '';

	let full_name = '';
	let email = '';
	let phone_number = '';
	let role = '';
	let password = '';
	let client_id = '';

	// Reset fields on open
	$: if (show) {
		if (user) {
			full_name = user.full_name || '';
			email = user.email || '';
			phone_number = user.phone_number || '';
			role = user.role || '';
			client_id = user.client_id?.toString() || '';
			password = '';
		} else {
			full_name = '';
			email = '';
			phone_number = '';
			role = '';
			client_id = '';
			password = '';
		}
	}

	async function submit() {
		isSaving = true;
		error = '';

		try {
			if (user) {
				const updates = {
					full_name,
					email,
					phone_number,
					role,
					client_id
				};

				await apiFetch(`/api/users/${user._id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updates)
				});

				if (password.trim()) {
					await apiFetch('/api/passwords/reset', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ user_id: user._id, new_password: password.trim() })
					});
				}
			} else {
				const newUser = await apiFetch('/api/users', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ full_name, email, phone_number, role, client_id })
				});

				if (password.trim()) {
					await apiFetch('/api/passwords', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ user_id: newUser._id, password: password.trim() })
					});
				}
			}

			dispatch('refresh');
			dispatch('close');
		} catch (err) {
			error = err.message || 'Failed to save user';
		} finally {
			isSaving = false;
		}
	}

	function close() {
		dispatch('close');
	}
</script>

{#if show}
	<!-- Hidden form to block browser autofill -->
	<form style="display: none;">
		<input type="text" name="username" autocomplete="username" />
		<input type="password" name="password" autocomplete="current-password" />
	</form>

	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
		<div class="w-full max-w-lg rounded bg-white p-6 shadow-xl">
			<h2 class="mb-4 text-lg font-semibold">{user ? 'Edit' : 'Create'} User</h2>

			{#if error}
				<div class="mb-2 rounded bg-red-100 px-4 py-2 text-sm text-red-700">{error}</div>
			{/if}

			<form autocomplete="off" on:submit|preventDefault={submit}>
				<div class="space-y-4">
					<div>
						<label for="new_full_name" class="block text-sm font-medium text-gray-700">Full Name</label>
						<input
							type="text"
							name="new_full_name"
							autocomplete="off"
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							bind:value={full_name}
						/>
					</div>

					<div>
						<label for="new_email" class="block text-sm font-medium text-gray-700">Email</label>
						<input
							type="email"
							name="new_email"
							autocomplete="off"
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							bind:value={email}
						/>
					</div>

					<div>
						<label for="new_phone" class="block text-sm font-medium text-gray-700">Phone Number</label>
						<input
							type="text"
							name="new_phone"
							autocomplete="off"
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							bind:value={phone_number}
						/>
					</div>

					<div>
						<label for="new_role" class="block text-sm font-medium text-gray-700">Role</label>
						<select
							name="new_role"
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							bind:value={role}
						>
							<option disabled value="">Select role</option>
							<option value="admin">Admin</option>
							<option value="client">Client</option>
							<option value="operations">Operations</option>
							<option value="attorney">Attorney</option>
						</select>
					</div>

					<div>
						<label for="new_client_id" class="block text-sm font-medium text-gray-700">Associated Company</label>
						<select
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							bind:value={client_id}
						>
							<option value="">No Associated Company</option>
							{#each clients as client}
								<option value={client._id}>{client.display_name} – ({client.legal_name})</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="new_client_id" class="block text-sm font-medium text-gray-700">
							Associated Company
						</label>
						<select
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							bind:value={client_id}
						>
							<option value="">No Associated Company</option>
							{#each clients as client}
								<option value={client._id}>{client.display_name} – ({client.legal_name})</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="new_password" class="block text-sm font-medium text-gray-700">
							{user ? 'Temporary Password (optional)' : 'Password'}
						</label>
						<input
							type="password"
							name="new_password"
							autocomplete="new-password"
							class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
							bind:value={password}
							placeholder={user ? 'Leave blank to keep unchanged' : ''}
						/>
					</div>
				</div>

				<div class="mt-6 flex justify-end gap-2">
					<button
						on:click={close}
						class="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
						type="button"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded bg-gray-700 px-4 py-2 text-sm text-white shadow hover:bg-gray-800 disabled:opacity-50"
						disabled={isSaving || !full_name || !email || !role}
					>
						{isSaving ? 'Saving...' : 'Save'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
