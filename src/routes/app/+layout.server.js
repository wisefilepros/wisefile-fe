import { redirect } from '@sveltejs/kit';
import { apiFetchServer } from '$lib/api/fetchWithBaseServer';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ cookies }) {
	try {
		const cookieHeader = cookies.get('accessToken')
			? `accessToken=${cookies.get('accessToken')}`
			: '';

		const user = await apiFetchServer('/api/auth/me', {
			cookie: cookieHeader
		});

		return { user };
		// eslint-disable-next-line no-unused-vars
	} catch (err) {
		throw redirect(302, '/');
	}
}
