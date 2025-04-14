import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		const result = await apiFetchServer('/api/cases', {
			cookie: cookieHeader
		});

		console.log('Loaded data for /api/cases:', result);

		return { result };
	} catch (error) {
		console.error('Page load error for /api/cases:', error);
		return { error: error.message };
	}
}

// Multiple api call example
// import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

// /** @type {import('./$types').PageServerLoad} */
// export async function load({ cookies }) {
// 	const cookieHeader = cookies.get('accessToken')
// 		? `accessToken=${cookies.get('accessToken')}`
// 		: '';

// 	try {
// 		const [cases, invoices, messages, activityLogs] = await Promise.all([
// 			apiFetchServer('/api/cases', { cookie: cookieHeader }),
// 			apiFetchServer('/api/invoices', { cookie: cookieHeader }),
// 			apiFetchServer('/api/messages', { cookie: cookieHeader }),
// 			apiFetchServer('/api/activitylogs', { cookie: cookieHeader }) // or /api/dashboard/activity
// 		]);

// 		return {
// 			cases,
// 			invoices,
// 			messages,
// 			activityLogs
// 		};
// 	} catch (err) {
// 		console.error('Dashboard load failed:', err);
// 		return {
// 			error: 'Failed to load dashboard data'
// 		};
// 	}
// }
