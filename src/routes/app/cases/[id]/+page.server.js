import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, params }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		const caseId = params.id;
		
		// Fetch populated case record (includes client, users, tenants, etc.)
		let caseRecord;
		try {
			caseRecord = await apiFetchServer(`/api/cases/${caseId}`, {
				cookie: cookieHeader
			});
		} catch (err) {
			console.error('❌ Failed to load caseRecord:', err);
			return { error: 'Could not load case data.' };
		}

		// Case status options for status dropdown
		let caseStatuses = [];
		try {
			caseStatuses = await apiFetchServer(`/api/utils/case-status-options`, {
				cookie: cookieHeader
			});
		} catch (err) {
			console.error('❌ Failed to load case statuses:', err);
			return { error: 'Could not load case status options.' };
		}

		// Messages for this case only
		let messages = [];
		try {
			messages = await apiFetchServer(`/api/messages/by-case?case_id=${caseId}`, {
				cookie: cookieHeader
			});
		} catch (err) {
			console.error('❌ Failed to load messages:', err);
			return { error: 'Could not load messages.' };
		}

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
