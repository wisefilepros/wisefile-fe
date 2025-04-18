<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/api/fetchWithBase';

	let activeTab = 'users';
	let users = [];
	let clients = [];

	let showUserModal = false;
	let showClientModal = false;
	let editingUser = null;
	let editingClient = null;

	export let data;
    console.log(data)
	users = data?.result.users || [];
	clients = data?.result.clients || [];

	function openCreate(type) {
		if (type === 'user') {
			editingUser = null;
			showUserModal = true;
		} else {
			editingClient = null;
			showClientModal = true;
		}
	}

	function openEdit(type, item) {
		if (type === 'user') {
			editingUser = item;
			showUserModal = true;
		} else {
			editingClient = item;
			showClientModal = true;
		}
	}

	function closeModal() {
		showUserModal = false;
		showClientModal = false;
		editingUser = null;
		editingClient = null;
	}
</script>

<div class="p-6">
	<div class="mb-4 border-b border-gray-200">
		<nav class="-mb-px flex space-x-8" aria-label="Tabs">
			<button
				on:click={() => (activeTab = 'users')}
				class="whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium {activeTab === 'users'
					? 'border-gray-900 text-gray-900'
					: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
			>
				Users
			</button>
			<button
				on:click={() => (activeTab = 'clients')}
				class="whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium {activeTab === 'clients'
					? 'border-gray-900 text-gray-900'
					: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
			>
				Clients
			</button>
		</nav>
	</div>

	<div class="mb-4 flex justify-end">
		<button
			class="rounded bg-gray-700 px-4 py-2 text-sm text-white shadow hover:bg-gray-800"
			on:click={() => openCreate(activeTab)}
		>
			Create {activeTab === 'users' ? 'User' : 'Client'}
		</button>
	</div>

	{#if activeTab === 'users'}
		<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
			<thead class="bg-gray-700 text-xs font-medium uppercase text-white">
				<tr>
					<th class="px-4 py-2">Name</th>
					<th class="px-4 py-2">Email</th>
					<th class="px-4 py-2">Role</th>
					<th class="px-4 py-2">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each users as user}
					<tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
						<td class="px-4 py-2">{user.full_name}</td>
						<td class="px-4 py-2">{user.email}</td>
						<td class="px-4 py-2 capitalize">{user.role}</td>
						<td class="px-4 py-2">
							<button
								class="mr-2 text-blue-600 hover:underline"
								on:click={() => openEdit('user', user)}>Edit</button
							>
							<button class="text-red-600 hover:underline">Delete</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
			<thead class="bg-gray-700 text-xs font-medium uppercase text-white">
				<tr>
					<th class="px-4 py-2">Display Name</th>
					<th class="px-4 py-2">Legal Name</th>
					<th class="px-4 py-2">Client Code</th>
					<th class="px-4 py-2">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each clients as client}
					<tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
						<td class="px-4 py-2">{client.display_name}</td>
						<td class="px-4 py-2">{client.legal_name}</td>
						<td class="px-4 py-2">{client.client_code}</td>
						<td class="px-4 py-2">
							<button
								class="mr-2 text-blue-600 hover:underline"
								on:click={() => openEdit('client', client)}>Edit</button
							>
							<button class="text-red-600 hover:underline">Delete</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	{#if showUserModal || showClientModal}
		<!-- Modal skeleton placeholder, will add full component later -->
		<div class="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
			<div class="w-full max-w-lg rounded bg-white p-6 shadow-xl">
				<h2 class="mb-4 text-lg font-semibold">
					{editingUser || editingClient ? 'Edit' : 'Create'}
					{showUserModal ? 'User' : 'Client'}
				</h2>
				<p class="text-sm text-gray-500">Modal content coming soon...</p>
				<div class="mt-4 text-right">
					<button
						on:click={closeModal}
						class="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300">Close</button
					>
				</div>
			</div>
		</div>
	{/if}
</div>
