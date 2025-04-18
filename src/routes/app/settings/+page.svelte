<script>
	import { apiFetch } from '$lib/api/fetchWithBase';
	export let data;

	let user = data?.user || null;

	let form = {
		full_name: '',
		email: '',
		phone_number: '',
		new_password: '',
		current_password: ''
	};

	let original = {};
	let isSaving = false;
	let error = '';
	let success = '';

	// 🧠 Safely populate form once when the modal/page shows
	$: if (user && Object.keys(original).length === 0) {
		Object.assign(form, {
			full_name: user.full_name || '',
			email: user.email || '',
			phone_number: user.phone_number || '',
			new_password: '',
			current_password: ''
		});
		original = { ...form };
	}

	function getChangedFields() {
		const changed = {};
		for (const key in form) {
			if (key !== 'new_password' && key !== 'current_password' && form[key] !== original[key]) {
				changed[key] = form[key];
			}
		}
		return changed;
	}

	async function saveProfile() {
		isSaving = true;
		error = '';
		success = '';

		try {
			const updates = getChangedFields();

			if (Object.keys(updates).length > 0) {
				await apiFetch(`/api/users/${user._id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updates)
				});
				success = 'Profile updated successfully';
				Object.assign(original, updates); // ✅ Sync new values into original
			}

			if (form.new_password.trim() && form.current_password.trim()) {
				await apiFetch('/api/passwords/update', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						current_password: form.current_password.trim(),
						new_password: form.new_password.trim()
					})
				});
				success = 'Password updated successfully';
				form.new_password = '';
				form.current_password = '';
			}
		} catch (err) {
			error = err.message || 'Failed to save changes';
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="max-w-2xl px-6 py-10">
	<h1 class="mb-6 text-2xl font-semibold text-gray-800">Account Settings</h1>

	{#if error}
		<div class="mb-4 rounded bg-red-100 px-4 py-2 text-sm text-red-700">{error}</div>
	{/if}

	{#if success}
		<div class="mb-4 rounded bg-green-100 px-4 py-2 text-sm text-green-700">{success}</div>
	{/if}

	<form on:submit|preventDefault={saveProfile} autocomplete="off" class="space-y-6">
		<!-- Profile Info -->
		<div class="space-y-4">
			<div>
				<label for="full_name" class="block text-sm font-medium text-gray-700">Full Name</label>
				<input
					type="text"
					name="full_name"
					autocomplete="off"
					class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
					bind:value={form.full_name}
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
				<input
					type="email"
					name="email"
					autocomplete="off"
					disabled
					class="mt-1 w-full cursor-not-allowed rounded border border-gray-200 bg-gray-100 px-3 py-2 text-sm shadow-sm"
					value={form.email}
				/>
			</div>

			<div>
				<label for="phone_number" class="block text-sm font-medium text-gray-700"
					>Phone Number</label
				>
				<input
					type="text"
					name="phone_number"
					autocomplete="off"
					class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
					bind:value={form.phone_number}
				/>
			</div>
		</div>

		<hr class="border-t border-gray-200" />

		<!-- Password Update -->
		<div class="space-y-4">
			<h2 class="text-sm font-semibold text-gray-700">Update Password</h2>

			<div>
				<label for="current_password" class="block text-sm font-medium text-gray-700"
					>Current Password</label
				>
				<input
					type="password"
					name="current_password"
					autocomplete="current-password"
					class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
					bind:value={form.current_password}
				/>
			</div>

			<div>
				<label for="new_password" class="block text-sm font-medium text-gray-700"
					>New Password</label
				>
				<input
					type="password"
					name="new_password"
					autocomplete="new-password"
					class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm"
					bind:value={form.new_password}
				/>
			</div>
		</div>

		<hr class="border-t border-gray-200" />

		<!-- Preferences Placeholder -->
		<div>
			<h2 class="text-sm font-semibold text-gray-700">Preferences</h2>
			<p class="text-xs italic text-gray-500">Coming soon: theme, notifications, and more...</p>
		</div>

		<div class="flex justify-end">
			<button
				type="submit"
				class="rounded bg-gray-700 px-4 py-2 text-sm text-white shadow hover:bg-gray-800 disabled:opacity-50"
				disabled={isSaving || (!form.full_name && !form.phone_number)}
			>
				{isSaving ? 'Saving...' : 'Save Changes'}
			</button>
		</div>
	</form>
</div>
