<script>
	import { createEventDispatcher, afterUpdate } from 'svelte';
	import { apiFetch } from '$lib/api/fetchWithBase';

	export let show = false;
	export let user = null;
	export let clients = [];

	const dispatch = createEventDispatcher();

	let form = {
		full_name: '',
		email: '',
		phone_number: '',
		role: '',
		password: '',
		client_id: ''
	};

	let original = {};
	let isSaving = false;
	let error = '';

	$: if (show) {
		if (user && user._id !== original?._id) {
			form = {
				full_name: user.full_name || '',
				email: user.email || '',
				phone_number: user.phone_number || '',
				role: user.role || '',
				password: '',
				client_id: user.client_id?.toString() || ''
			};
			original = { ...form, _id: user._id };
		} else if (!user && !original._id) {
			form = {
				full_name: '',
				email: '',
				phone_number: '',
				role: '',
				password: '',
				client_id: ''
			};
			original = {};
		}
	}

	function getChangedFields() {
		const changed = {};
		for (const key in form) {
			if (key !== 'password' && form[key] !== original[key]) {
				changed[key] = form[key];
			}
		}
		return changed;
	}

	async function submit() {
		isSaving = true;
		error = '';

		try {
			if (user) {
				const updates = getChangedFields();

				if (Object.keys(updates).length > 0) {
					await apiFetch(`/api/users/${user._id}`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(updates)
					});
				}

				if (form.password.trim()) {
					await apiFetch('/api/passwords/reset', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ user_id: user._id, new_password: form.password.trim() })
					});
				}
			} else {
				const newUser = await apiFetch('/api/users', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						full_name: form.full_name,
						email: form.email,
						phone_number: form.phone_number,
						role: form.role,
						client_id: form.client_id
					})
				});

				if (form.password.trim()) {
					await apiFetch('/api/passwords', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ user_id: newUser._id, password: form.password.trim() })
					});
				}
			}

			dispatch('refresh');
			close();
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
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
		<div class="w-full max-w-lg rounded bg-white p-6 shadow-xl">
			<h2 class="mb-4 text-lg font-semibold">{user ? 'Edit' : 'Create'} User</h2>

			{#if error}
				<div class="mb-2 rounded bg-red-100 px-4 py-2 text-sm text-red-700">{error}</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label for="full_name" class="block text-sm font-medium text-gray-700">Full Name</label>
					<input
						id="full_name"
						type="text"
						autocomplete="off"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						bind:value={form.full_name}
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
					<label for="role" class="block text-sm font-medium text-gray-700">Role</label>
					<select
						id="role"
						autocomplete="off"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						bind:value={form.role}
					>
						<option disabled value="">Select role</option>
						<option value="admin">Admin</option>
						<option value="client">Client</option>
						<option value="operations">Operations</option>
						<option value="attorney">Attorney</option>
					</select>
				</div>

				<div>
					<label for="client_id" class="block text-sm font-medium text-gray-700"
						>Associated Company</label
					>
					<select
						id="client_id"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						bind:value={form.client_id}
					>
						<option value="">No Associated Company</option>
						{#each clients as client}
							<option value={client._id}>{client.display_name} – ({client.legal_name})</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						{user ? 'Temporary Password (optional)' : 'Password'}
					</label>
					<input
						id="password"
						type="password"
						autocomplete="off"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						bind:value={form.password}
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
					on:click={submit}
					class="rounded bg-gray-700 px-4 py-2 text-sm text-white shadow hover:bg-gray-800 disabled:opacity-50"
					disabled={isSaving || !form.full_name || !form.email || !form.phone_number || !form.role}
				>
					{isSaving ? 'Saving...' : 'Save'}
				</button>
			</div>
		</div>
	</div>
{/if}
