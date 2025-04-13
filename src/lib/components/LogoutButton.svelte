<script>
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { apiFetch } from '$lib/api/fetchWithBase';

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

<button class="text-sm text-red-600 hover:underline" on:click={handleLogout}> Log Out </button>
