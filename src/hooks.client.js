import { auth } from '$lib/stores/auth';

let hasChecked = false;

export async function handle({ event, resolve }) {
	if (hasChecked) return resolve(event);
	hasChecked = true;

	console.log('[HOOKS] Running /me check');

	const isPublic = event.url.pathname === '/' || event.url.pathname === '/login';

	if (isPublic) {
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
