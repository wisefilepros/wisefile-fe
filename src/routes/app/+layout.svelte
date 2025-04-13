<script>
	import { navigating } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import Loader from '$lib/components/Loader.svelte';

	export let data;

	let expanded = false;

	const toggleExpand = () => {
		expanded = true;
	};

	const collapse = () => {
		expanded = false;
	};

	$: if (data?.user) {
		auth.set({
			isAuthenticated: true,
			user: data.user,
			role: data.user.role,
			loading: false
		});
	}

	let showRouteLoader = false;
	let timeout;

	$: {
		if ($navigating) {
			showRouteLoader = true;
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				showRouteLoader = false;
			}, 1000);
		}
	}
</script>

{#if $auth.loading}
	<Loader message="Checking session..." />
{:else if showRouteLoader}
	<Loader message="Loading page..." />
{:else}
	<div class="flex min-h-screen bg-gray-100">
		<!-- Sidebar -->
		<div
			role="navigation"
			class={`flex flex-col bg-gray-900 text-white transition-all duration-300 ${
				expanded ? 'w-64' : 'w-16'
			}`}
			on:mouseenter={toggleExpand}
			on:mouseleave={collapse}
		>
			<div class="flex h-16 items-center justify-center bg-gray-800 text-xl font-bold">
				<span class={expanded ? 'block' : 'hidden'}>WiseFile</span>
				<span class={!expanded ? 'block' : 'hidden'}>WF</span>
			</div>

			<!-- Nav links -->
			<nav class="flex-1 px-2">
				<ul class="flex flex-col space-y-1">
					<li>
						<a href="/app/dashboard" class="flex items-center rounded p-2 hover:bg-gray-700">
							<i class="fa-sharp-duotone fa-regular fa-chart-line w-6 text-center"></i>
							<span class={`ml-2 ${!expanded ? 'hidden' : ''}`}>Dashboard</span>
						</a>
					</li>
					<li>
						<a href="/app/cases" class="flex items-center rounded p-2 hover:bg-gray-700">
							<i class="fa-sharp-duotone fa-regular fa-folder-open w-6 text-center"></i>
							<span class={`ml-2 ${!expanded ? 'hidden' : ''}`}>Cases</span>
						</a>
					</li>
					<li>
						<a href="/app/documents" class="flex items-center rounded p-2 hover:bg-gray-700">
							<i class="fa-sharp-duotone fa-regular fa-file w-6 text-center"></i>
							<span class={`ml-2 ${!expanded ? 'hidden' : ''}`}>Documents</span>
						</a>
					</li>
					<li>
						<a href="/app/invoices" class="flex items-center rounded p-2 hover:bg-gray-700">
							<i class="fa-sharp-duotone fa-regular fa-receipt w-6 text-center"></i>
							<span class={`ml-2 ${!expanded ? 'hidden' : ''}`}>Invoices</span>
						</a>
					</li>
					<li>
						<a href="/app/messaging" class="flex items-center rounded p-2 hover:bg-gray-700">
							<i class="fa-sharp-duotone fa-regular fa-comments w-6 text-center"></i>
							<span class={`ml-2 ${!expanded ? 'hidden' : ''}`}>Messaging</span>
						</a>
					</li>
				</ul>
			</nav>

			<!-- Logout -->
			<div class="border-t border-gray-700 p-2">
				<LogoutButton {expanded} />
			</div>
		</div>

		<!-- Main content -->
		<div class="flex-1 p-6">
			<slot />
		</div>
	</div>
{/if}
