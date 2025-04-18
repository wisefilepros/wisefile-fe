<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { apiFetch } from '$lib/api/fetchWithBase';

	export let show = false;
	export let user = null; // if editing

	const dispatch = createEventDispatcher();

	let form = {
		full_name: '',
		email: '',
		phone_number: '',
		role: 'client'
	};

	let original = {};
	let isSaving = false;
	let error = '';

	onMount(() => {
		if (user) {
			form = {
				full_name: user.full_name,
				email: user.email,
				phone_number: user.phone_number,
				role: user.role
			};
			original = { ...form };
		} else {
			form = { full_name: '', email: '', phone_number: '', role: 'client' };
			original = {};
		}
	});

	function getChangedFields() {
		const changed = {};
		for (const key in form) {
			if (form[key] !== original[key]) {
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
				if (Object.keys(updates).length === 0) {
					close();
					return;
				}
				await apiFetch(`/api/users/${user._id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updates)
				});
			} else {
				await apiFetch('/api/users', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(form)
				});
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
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						bind:value={form.full_name}
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
					<input
						id="email"
						type="email"
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
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						bind:value={form.phone_number}
					/>
				</div>

				<div>
					<label for="role" class="block text-sm font-medium text-gray-700">Role</label>
					<select
						id="role"
						class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
						bind:value={form.role}
					>
						<option value="admin">Admin</option>
						<option value="client">Client</option>
						<option value="operations">Operations</option>
						<option value="attorney">Attorney</option>
					</select>
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
					disabled={isSaving}
				>
					{isSaving ? 'Saving...' : 'Save'}
				</button>
			</div>
		</div>
	</div>
{/if}
