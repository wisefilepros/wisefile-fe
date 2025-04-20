import { redirect } from '@sveltejs/kit';

export function requireAuth(cookies) {
	const token = cookies.get('accessToken');
	console.log('🔐 accessToken on SSR:', token);
	if (!token) {
		throw redirect(302, '/');
	}
}
