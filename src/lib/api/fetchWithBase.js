export async function apiFetch(path, options = {}) {
	const { method = 'GET', headers = {}, body, ...rest } = options;

	const res = await fetch(`https://wisefile-be.onrender.com${path}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			...headers
		},
		body,
		credentials: 'include',
		...rest
	});

	let data;
	try {
		data = await res.json();
	} catch {
		data = null;
	}

	if (!res.ok) {
		throw new Error(data?.message || `Request failed with status ${res.status}`);
	}

	return data;
}
