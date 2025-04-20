<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/api/fetchWithBase';
	import AdminUserModal from '$lib/components/AdminUserModal.svelte';
	import AdminClientModal from '$lib/components/AdminClientModal.svelte';

	let activeTab = 'users';
	let users = [];
	let clients = [];

	let showUserModal = false;
	let showClientModal = false;
	let editingUser = null;
	let editingClient = null;

	export let data;
	users = data?.result.users || [];
	clients = data?.result.clients || [];

	function openCreate(tab) {
		if (tab === 'users') {
			editingUser = null;
			showUserModal = true;
		} else if (tab === 'clients') {
			editingClient = null;
			showClientModal = true;
		}
	}

	function openEdit(tab, item) {
		if (tab === 'users') {
			editingUser = item;
			showUserModal = true;
		} else if (tab === 'clients') {
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

	async function fetchUsers() {
		const res = await apiFetch('/users'); // uses credentials automatically
		users = res;
	}

	async function fetchClients() {
		const res = await apiFetch('/clients'); // uses credentials automatically
		clients = res;
	}
</script>

<div class="p-6">
	<div class="mb-4 border-b border-gray-200">
		<nav class="-mb-px flex space-x-8" aria-label="Tabs">
			<button
				on:click={() => (activeTab = 'users')}
				class="whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium"
				class:border-gray-900={activeTab === 'users'}
				class:text-gray-900={activeTab === 'users'}
				class:border-transparent={activeTab !== 'users'}
				class:text-gray-500={activeTab !== 'users'}
				class:hover\:border-gray-300={activeTab !== 'users'}
				class:hover\:text-gray-700={activeTab !== 'users'}
			>
				Users
			</button>
			<button
				on:click={() => (activeTab = 'clients')}
				class="whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium"
				class:border-gray-900={activeTab === 'clients'}
				class:text-gray-900={activeTab === 'clients'}
				class:border-transparent={activeTab !== 'clients'}
				class:text-gray-500={activeTab !== 'clients'}
				class:hover\:border-gray-300={activeTab !== 'clients'}
				class:hover\:text-gray-700={activeTab !== 'clients'}
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
								on:click={() => openEdit('users', user)}
							>
								Edit
							</button>
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
								on:click={() => openEdit('clients', client)}
							>
								Edit
							</button>
							<button class="text-red-600 hover:underline">Delete</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<AdminUserModal
		show={showUserModal}
		user={editingUser}
        clients={clients}
		on:close={closeModal}
		on:refresh={() => {
			fetchUsers();
			closeModal();
		}}
	/>

	<AdminClientModal
		show={showClientModal}
		client={editingClient}
        users={users}
		on:close={closeModal}
		on:refresh={() => {
			fetchClients();
			closeModal();
		}}
	/>
</div>
