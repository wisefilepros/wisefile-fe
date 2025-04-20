import { redirect } from '@sveltejs/kit';

export function requireAuth(cookies) {
	console.log('🔐 accessToken on SSR:', token);
	const token = cookies.get('accessToken');
	if (!token) {
		throw redirect(302, '/');
	}
}
