import { requireAuth } from '$lib/utils/requireAuth';

export function load({ cookies }) {
	requireAuth(cookies);
}
