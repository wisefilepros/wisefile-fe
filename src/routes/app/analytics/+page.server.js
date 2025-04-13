import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		const result = await apiFetchServer('/api/analytics', {
			cookie: cookieHeader
		});

		console.log('Loaded data for /api/analytics:', result);

		return { result };
	} catch (error) {
		console.error('Page load error for /api/analytics:', error);
		return { error: error.message };
	}
}
