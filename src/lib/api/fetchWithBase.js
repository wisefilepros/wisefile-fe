const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch(path, options = {}) {
	const res = await fetch(`${BASE_URL}${path}`, {
		...options,
		credentials: 'include' // send cookies
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || 'Request failed');
	}

	return res.json();
}
