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

	if (!res.ok) {
		// Try to parse error message
		let errorMessage = `Request failed (${res.status})`;
		try {
			const errorJson = await res.json();
			errorMessage = errorJson?.message || errorMessage;
			console.error(`❌ API ${path} responded with ${res.status}:`, errorJson);
		} catch {
			const text = await res.text();
			console.error(`❌ API ${path} responded with ${res.status}:`, text);
		}
		throw new Error(errorMessage);
	}

	return res.json();
}
