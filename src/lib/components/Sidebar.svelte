<script>
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import LogoutButton from '$lib/components/LogoutButton.svelte';

	export let expanded = false;

	// Define navigation structure with role access
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
		{
			href: '/app/admin',
			label: 'Admin Panel',
			icon: 'fa-user-gear',
			roles: ['admin']
		},
		{
			href: '/app/settings',
			label: 'Settings',
			icon: 'fa-gear',
			roles: ['admin', 'client', 'operations', 'attorney']
		}
	];

	// Highlight active path
	$: currentPath = $page.url.pathname;
</script>

<nav class="flex-1 px-2">
	<ul class="flex flex-col space-y-1">
		{#each navItems as item (item.href)}
			{#if item.roles.includes($auth.role)}
				<li>
					<a
						href={item.href}
						class={`flex items-center rounded p-2 hover:bg-gray-700 ${
							currentPath.startsWith(item.href) ? 'bg-gray-800' : ''
						}`}
					>
						<i class={`fa-sharp-duotone fa-regular ${item.icon} w-6 text-center`}></i>
						<span class={`ml-2 ${!expanded ? 'hidden' : ''}`}>{item.label}</span>
					</a>
				</li>
			{/if}
		{/each}
	</ul>
</nav>

<!-- Logout (always visible) -->
<div class="border-t border-gray-700 p-2">
	<LogoutButton {expanded} />
</div>
