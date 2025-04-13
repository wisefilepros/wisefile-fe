import { writable } from 'svelte/store';

export const auth = writable({
	isAuthenticated: false,
	user: null,
	role: null,
	loading: true
});

auth.subscribe((value) => {
	console.log('[AUTH STATE]', value);
});
