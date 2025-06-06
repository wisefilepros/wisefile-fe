const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch(path, options = {}) {
	const { method = 'GET', headers = {}, body, ...rest } = options;

	const res = await fetch(`${BASE_URL}${path}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			...headers
		},
		body,
		credentials: 'include',
		...rest
	});

	return res;
}
