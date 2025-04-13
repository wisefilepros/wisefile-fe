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
			const user = await apiFetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			auth.set({ isAuthenticated: true, user, role: user.role });
			goto('/dashboard');
		} catch (err) {
			error = err.message;
		}
	}

	onMount(() => {
		auth.set({ isAuthenticated: false, user: null, role: null });
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<div class="w-full max-w-sm space-y-6 rounded-lg bg-white p-8 shadow-md">
		<h1 class="text-center text-2xl font-bold text-gray-800">WiseFile</h1>

		{#if error}
			<p class="rounded bg-red-100 p-2 text-center text-sm text-red-700">{error}</p>
		{/if}

		<form on:submit|preventDefault={handleLogin} class="space-y-4">
			<input
				type="email"
				placeholder="Email address"
				bind:value={email}
				required
				class="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
			/>

			<input
				type="password"
				placeholder="Password"
				bind:value={password}
				required
				class="w-full rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
			/>

			<button
				type="submit"
				class="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
			>
				Log in
			</button>
		</form>
	</div>
</div>
