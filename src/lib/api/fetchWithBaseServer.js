export async function apiFetchServer(path, { cookie = '', ...options } = {}) {
	const res = await fetch(`https://wisefile-be.onrender.com${path}`, {
		method: options.method || 'GET',
		headers: {
			'Content-Type': 'application/json',
			...(cookie ? { cookie } : {}),
			...options.headers
		}
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Request failed');
	}

	return res.json();
}
