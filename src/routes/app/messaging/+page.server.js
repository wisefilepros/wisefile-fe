import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		const result = await apiFetchServer('/api/messages', {
			cookie: cookieHeader
		});

		console.log('Loaded data for /api/messages:', result);

		return { result };
	} catch (error) {
		console.error('Page load error for /api/messages:', error);
		return { error: error.message };
	}
}
