import { auth } from '$lib/stores/auth';

export async function handle({ event, resolve }) {
	try {
		const res = await fetch('/api/auth/me', { credentials: 'include' });
		if (res.ok) {
			const user = await res.json();
			auth.set({ isAuthenticated: true, user, role: user.role });
		}
	} catch (e) {
		// silently fail
        console.error('Failed to fetch user info:', e);
	}
	return resolve(event);
}
