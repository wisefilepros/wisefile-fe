<script>
	import { goto } from '$app/navigation';
	import { apiFetch } from '$lib/api/fetchWithBase';
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let error = '';

	async function handleLogin() {
		error = '';

		try {
			const res = await apiFetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			if (!res.ok) {
				throw new Error('Login failed. Please check your credentials.');
			}
			const user = await res.json();

			auth.set({
				isAuthenticated: true,
				user,
				role: user.role
			});

			goto('/dashboard');
		} catch (err) {
			error = err.message;
		}
	}

	onMount(() => {
		auth.set({ isAuthenticated: false, user: null, role: null }); // reset auth
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100 px-4">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow">
		<h1 class="mb-6 text-2xl font-bold">Log In</h1>

		{#if error}
			<p class="mb-4 text-sm text-red-600">{error}</p>
		{/if}

		<form on:submit|preventDefault={handleLogin} class="space-y-4">
			<input
				type="email"
				placeholder="Email"
				bind:value={email}
				required
				class="w-full rounded border border-gray-300 px-3 py-2"
			/>

			<input
				type="password"
				placeholder="Password"
				bind:value={password}
				required
				class="w-full rounded border border-gray-300 px-3 py-2"
			/>

			<button
				type="submit"
				class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>
				Log In
			</button>
		</form>
	</div>
</div>
