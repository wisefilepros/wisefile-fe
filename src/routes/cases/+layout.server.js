import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ cookies }) {
	const token = cookies.get('accessToken');
	if (!token) {
		throw redirect(302, '/login');
	}
}
