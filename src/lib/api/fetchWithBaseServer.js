const BASE_URL = import.meta.env.VITE_API_BASE_URL_SSR;

export async function apiFetchServer(path, { cookie = '', ...options } = {}) {
	const res = await fetch(`${BASE_URL}${path}`, {
		method: options.method || 'GET',
		headers: {
			'Content-Type': 'application/json',
			...(cookie ? { cookie } : {}),
			...options.headers
		}
	});

	return res;
}
