<script>
	import { navigating } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
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
		<div role="region" on:mouseenter={toggleExpand} on:mouseleave={collapse}>
			<Sidebar {expanded} />
		</div>
		<div class="flex-1 p-6">
			<slot />
		</div>
	</div>
{/if}
