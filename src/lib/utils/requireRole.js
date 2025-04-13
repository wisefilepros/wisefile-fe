import { redirect } from '@sveltejs/kit';

export function requireRole(cookies, requiredRole) {
	const role = cookies.get('role'); // OR decode from accessToken
	if (role !== requiredRole) {
		throw redirect(302, '/dashboard');
	}
}
