<script>
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { apiFetch } from '$lib/api/fetchWithBase';

	export let expanded = true; // passed in from sidebar layout

	async function handleLogout() {
		try {
			await apiFetch('/api/auth/logout', { method: 'POST' });
		} catch (e) {
			console.warn('Logout error:', e);
		}
		auth.set({ isAuthenticated: false, user: null, role: null });
		goto('/');
	}
</script>

<button
	on:click={handleLogout}
	class="flex w-full items-center rounded p-2 text-left text-white hover:bg-gray-700"
>
	<i class="fa-sharp-duotone fa-regular fa-power-off w-6 text-center"></i>
	<span class={`ml-2 ${!expanded ? 'hidden' : ''}`}>Logout</span>
</button>
