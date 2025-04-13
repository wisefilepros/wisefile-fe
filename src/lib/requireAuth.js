import { redirect } from '@sveltejs/kit';

export function requireAuth(cookies) {
	const token = cookies.get('accessToken');
	if (!token) {
		throw redirect(302, '/login');
	}
}
