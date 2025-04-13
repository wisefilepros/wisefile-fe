<script>
	import { navigating } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import Loader from '$lib/components/Loader.svelte';

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
	<slot />
{/if}
