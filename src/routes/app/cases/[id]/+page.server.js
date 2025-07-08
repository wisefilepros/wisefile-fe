import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, params }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		const caseId = params.id;

		// Fetch populated case detail with dropdowns
		const { case: caseRecord, dropdowns } = await apiFetchServer(`/api/cases/${caseId}`, {
			cookie: cookieHeader
		});

		const caseStatuses = await apiFetchServer(`/api/utils/case-status-options`, {
			cookie: cookieHeader
		});

		const messages = await apiFetchServer(`/api/messages/by-case?case_id=${caseId}`, {
			cookie: cookieHeader
		});

		return {
			caseRecord,
			dropdowns,
			caseStatuses,
			messages
		};
	} catch (error) {
		console.error('Case Details load error:', error);
		return { error: error.message };
	}
}
