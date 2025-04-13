<script>
	import { auth } from '$lib/stores/auth';
	import { navigating } from '$app/stores';
	import Loader from '$lib/components/Loader.svelte';

	let showLoader = false;
	let timeout;

	let showRouteLoader = false;
	let navDelay;

	// Route change loader with delay
	$: if (navigating) {
		clearTimeout(navDelay);
		navDelay = setTimeout(() => {
			showRouteLoader = true;
		}, 1000);
	} else {
		clearTimeout(navDelay);
		showRouteLoader = false;
	}
</script>

<!-- Auth session check loader -->
{#if $auth.loading}
	<Loader message="Checking session..." />

	<!-- Route transition loader -->
{:else if showRouteLoader}
	<Loader message="Loading page..." />

	<!-- Render normal content -->
{:else}
	<slot />
{/if}
