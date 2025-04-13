import { requireAuth } from '$lib/utils/requireAuth';
import { requireRole } from '$lib/utils/requireRole';

export function load({ cookies }) {
	requireAuth(cookies);
	requireRole(cookies, 'admin');
}
