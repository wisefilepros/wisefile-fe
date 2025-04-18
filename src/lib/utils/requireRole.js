import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

export function requireRole(cookies, requiredRole) {
	const token = cookies.get('accessToken');
	if (!token) throw redirect(302, '/app/dashboard');

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		const role = decoded.role;

		if (role !== requiredRole) {
			throw redirect(302, '/app/dashboard');
		}
	} catch (err) {
		console.error('JWT decoding failed', err);
		throw redirect(302, '/app/dashboard');
	}
}
