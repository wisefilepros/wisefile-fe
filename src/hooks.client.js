import { auth } from '$lib/stores/auth';

export async function handle({ event, resolve }) {
	try {
		const res = await fetch('/api/auth/me', { credentials: 'include' });
		if (res.ok) {
			const user = await res.json();
			auth.set({
				isAuthenticated: true,
				user,
				role: user.role
			});
		}
	} catch (err) {
		console.error('Error fetching user:', err);
		auth.set({
			isAuthenticated: false,
			user: null,
			role: null
		});
	}
	return resolve(event);
}
