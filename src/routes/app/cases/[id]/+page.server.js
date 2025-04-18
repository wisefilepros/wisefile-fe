import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, params }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		const caseId = params.id;

		// Fetch case record
		const caseRecord = await apiFetchServer(`/api/cases/${caseId}`, {
			cookie: cookieHeader
		});

		const caseStatuses = await apiFetchServer(`/api/utils/case-status-options`, {
			cookie: cookieHeader
		});

		// // Fetch related activity log
		// const activityLog = await apiFetchServer(`/api/activity?case_id=${caseId}`, {
		// 	cookie: cookieHeader
		// });

		// // Fetch messages
		// const messages = await apiFetchServer(`/api/messages?case_id=${caseId}`, {
		// 	cookie: cookieHeader
		// });

		// // Fetch documents
		// const documents = await apiFetchServer(`/api/documents?case_id=${caseId}`, {
		// 	cookie: cookieHeader
		// });

		// // Fetch invoices
		// const invoices = await apiFetchServer(`/api/invoices?case_id=${caseId}`, {
		// 	cookie: cookieHeader
		// });

		// // Fetch all users for assigning roles (admin only logic in UI)
		// const users = await apiFetchServer(`/api/users`, {
		// 	cookie: cookieHeader
		// });

		// // Fetch all attorneys (filter client-attached users with role 'attorney')
		// const attorneys = users.filter((u) => u.role === 'attorney');
		// const operators = users.filter((u) => u.role === 'operations');

		return {
			caseRecord,
			caseStatuses
			// activityLog,
			// messages,
			// documents,
			// invoices,
			// attorneys,
			// operators
		};
	} catch (error) {
		console.error('Case Details load error:', error);
		return { error: error.message };
	}
}
