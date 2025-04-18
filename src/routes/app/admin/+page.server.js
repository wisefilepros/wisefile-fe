import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

// Rewrite this function to pull from both /api/users and /api/clients and return the data in a single object
/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		const [usersResult, clientsResult] = await Promise.all([
			apiFetchServer('/api/users', { cookie: cookieHeader }),
			apiFetchServer('/api/clients', { cookie: cookieHeader })
		]);
		if (!usersResult || !clientsResult) {
			throw new Error('Failed to fetch data from one or both APIs');
		}
		const result = {
			users: usersResult,
			clients: clientsResult
		};
		console.log('Loaded data for /api/users and /api/clients:', result);
		return { result };
	} catch (error) {
		console.error('Page load error:', error);
		return { error: error.message };
	}
}
