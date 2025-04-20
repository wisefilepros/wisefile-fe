import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		// Use /me to get the user's ID
		const me = await apiFetchServer('/api/auth/me', { cookie: cookieHeader });
		const result = await apiFetchServer(`/api/users/${me._id}`, {
			cookie: cookieHeader
		});

		return { user: result };
	} catch (error) {
		console.error('Page load error for /api/users/:id (Settings):', error);
		return { error: error.message };
	}
}
