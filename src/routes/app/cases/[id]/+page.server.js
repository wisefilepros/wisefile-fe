import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, cookies }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		const caseId = params.id;
		const result = await apiFetchServer(`/api/cases/${caseId}`, {
			cookie: cookieHeader
		});

		console.log('Loaded data for /api/cases/:id:', result);

		return { caseRecord: result };
	} catch (error) {
		console.error('Page load error for /api/cases/[id]:', error);
		return { error: error.message };
	}
}
