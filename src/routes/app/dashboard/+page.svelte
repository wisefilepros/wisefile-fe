<script>
	import { auth } from '$lib/stores/auth';
</script>

<h1 class="mb-4 text-3xl font-bold">Welcome, {$auth.user?.full_name || 'User'}!</h1>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
	<div class="rounded bg-white p-6 shadow">
		<h2 class="text-lg font-semibold text-gray-700">Open Cases</h2>
		<p class="text-2xl font-bold text-gray-900">--</p>
	</div>
	<div class="rounded bg-white p-6 shadow">
		<h2 class="text-lg font-semibold text-gray-700">Unpaid Invoices</h2>
		<p class="text-2xl font-bold text-gray-900">--</p>
	</div>
	<div class="rounded bg-white p-6 shadow">
		<h2 class="text-lg font-semibold text-gray-700">Unread Messages</h2>
		<p class="text-2xl font-bold text-gray-900">--</p>
	</div>
</div>
