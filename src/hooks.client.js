import { auth } from '$lib/stores/auth';

export async function handle({ event, resolve }) {
	const isPublicRoute = event.url.pathname === '/login';

	if (isPublicRoute) {
		auth.set({ isAuthenticated: false, user: null, role: null, loading: false });
		return resolve(event);
	}

	try {
		const res = await fetch('/api/auth/me', { credentials: 'include' });

		if (res.ok) {
			const user = await res.json();
			auth.set({
				isAuthenticated: true,
				user,
				role: user.role,
				loading: false
			});
		} else {
			auth.set({ isAuthenticated: false, user: null, role: null, loading: false });
		}
		// eslint-disable-next-line no-unused-vars
	} catch (err) {
		auth.set({ isAuthenticated: false, user: null, role: null, loading: false });
	}

	return resolve(event);
}
