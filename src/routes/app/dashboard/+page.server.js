import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		const result = await apiFetchServer('/api/dashboard', {
			cookie: cookieHeader
		});

		console.log('Loaded data for /api/dashboard:', result);

		return { result };
	} catch (error) {
		console.error('Page load error for /api/dashboard:', error);
		return { error: error.message };
	}
}
