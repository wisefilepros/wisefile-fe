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
		let bodyText = '';
		try {
			bodyText = await res.text(); // ✅ read once
			const parsed = JSON.parse(bodyText);
			console.error(`❌ API ${path} error ${res.status}:`, parsed);
			throw new Error(parsed.message || `Request failed (${res.status})`);
		} catch {
			console.error(`❌ API ${path} error ${res.status}:`, bodyText);
			throw new Error(`Request failed (${res.status})`);
		}
	}

	return res.json(); // ✅ this only runs when res.ok is true
}
