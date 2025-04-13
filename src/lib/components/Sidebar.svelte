<script>
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import LogoutButton from '$lib/components/LogoutButton.svelte';

	export let expanded = false;

	const navItems = [
		{
			href: '/app/dashboard',
			label: 'Dashboard',
			icon: 'fa-chart-line',
			roles: ['admin', 'client', 'operations', 'attorney']
		},
		{
			href: '/app/cases',
			label: 'Cases',
			icon: 'fa-folder-open',
			roles: ['admin', 'client', 'operations', 'attorney']
		},
		{
			href: '/app/messaging',
			label: 'Messaging',
			icon: 'fa-comments',
			roles: ['admin', 'client', 'operations', 'attorney']
		},
		{
			href: '/app/documents',
			label: 'Documents',
			icon: 'fa-file',
			roles: ['admin', 'client', 'operations', 'attorney']
		},
		{
			href: '/app/invoices',
			label: 'Invoices',
			icon: 'fa-receipt',
			roles: ['admin', 'client', 'operations']
		},
		{
			href: '/app/analytics',
			label: 'Analytics',
			icon: 'fa-chart-pie',
			roles: ['admin', 'client']
		},
		{ href: '/app/admin', label: 'Admin Panel', icon: 'fa-user-gear', roles: ['admin'] },
		{
			href: '/app/settings',
			label: 'Settings',
			icon: 'fa-gear',
			roles: ['admin', 'client', 'operations', 'attorney']
		}
	];

	$: currentPath = $page.url.pathname;
</script>

<!-- 🧱 Outer Sidebar Container (this wraps nav + logout like before) -->
<div
	role="navigation"
	class={`flex min-h-screen flex-col bg-gray-900 text-white transition-[width] duration-300 ease-in-out ${
		expanded ? 'w-40' : 'w-16'
	}`}
>
	<div class="text-md flex h-16 items-center justify-center bg-gray-800 font-bold">
		<span class={expanded ? 'block' : 'hidden'}>WiseFile</span>
		<span class={!expanded ? 'block' : 'hidden'}>WF</span>
	</div>

	<nav class="flex-1 px-2">
		<ul class="flex flex-col space-y-1">
			{#each navItems as item (item.href)}
				{#if item.roles.includes($auth.role)}
					<li>
						<a
							href={item.href}
							class={`flex items-center rounded p-2 text-sm hover:bg-gray-700 ${
								currentPath.startsWith(item.href) ? 'border-l-4 border-white bg-gray-800' : 'pl-3'
							}`}
						>
							<i class={`fa-sharp-duotone fa-regular ${item.icon} w-6 text-center`}></i>
							<span
								class={`ml-2 whitespace-nowrap transition-opacity duration-300 ${
									!expanded ? 'w-0 overflow-hidden opacity-0' : 'opacity-100'
								}`}
							>
								{item.label}
							</span>
						</a>
					</li>
				{/if}
			{/each}
		</ul>
	</nav>

	<div class="border-t border-gray-700 p-2">
		<LogoutButton {expanded} />
	</div>
</div>
