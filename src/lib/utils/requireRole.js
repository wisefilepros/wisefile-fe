import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

const JWT_SECRET = env.JWT_SECRET;

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
