import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, params }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		const caseId = params.id;

		// Fetch populated case record (includes client, users, tenants, etc.)
		const caseRecord = await apiFetchServer(`/api/cases/${caseId}`, {
			cookie: cookieHeader
		});

		// Case status options for status dropdown
		const caseStatuses = await apiFetchServer(`/api/utils/case-status-options`, {
			cookie: cookieHeader
		});

		// Messages for this case only
		const messages = await apiFetchServer(`/api/messages/by-case?case_id=${caseId}`, {
			cookie: cookieHeader
		});

		console.log('Case Details load:', { caseRecord, caseStatuses, messages });

		return {
			caseRecord,
			caseStatuses,
			messages
		};
	} catch (error) {
		console.error('Case Details load error:', error);
		return { error: error.message };
	}
}
