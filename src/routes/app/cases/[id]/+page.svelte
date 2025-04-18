<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	export let data;
	let activeTab = 'details';
	let progressContainer;
	let isAtStart = true;
	let isAtEnd = false;
	let showFeeForm = false;

	let caseDetails = data?.caseRecord || null;
	let statuses = data?.caseStatuses || [];

	function scrollLeft() {
		progressContainer.scrollBy({ left: -200, behavior: 'smooth' });
		updateScrollState();
	}

	function scrollRight() {
		progressContainer.scrollBy({ left: 200, behavior: 'smooth' });
		updateScrollState();
	}

	function updateScrollState() {
		isAtStart = progressContainer.scrollLeft <= 0;
		isAtEnd =
			progressContainer.scrollLeft + progressContainer.clientWidth >= progressContainer.scrollWidth;
	}
</script>


<!-- Case Heading -->
<h1 class="mb-2 text-xl font-bold">Case #{caseDetails?.case_number}</h1>
{#if caseDetails}
  <div class="mb-6 w-full rounded-lg bg-gray-100 shadow-md">
    <div class="flex items-center">
      <!-- Left scroll button -->
      <button
        on:click={scrollLeft}
        class="shrink-0 rounded bg-gray-300 px-2 py-1 text-sm font-bold hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isAtStart}
      >
        &lt;
      </button>

      <!-- Tightly constrained scroll container -->
      <div class="mx-2 min-w-0 flex-1 overflow-hidden">
        <div
          bind:this={progressContainer}
          class="scrollbar-hide flex gap-2 overflow-x-auto scroll-smooth py-1"
        >
          {#each statuses as status}
            <div
              class="flex min-w-fit shrink-0 rounded-md px-4 py-2 text-xs font-semibold transition-all"
              class:bg-blue-600={status === caseDetails.status}
              class:text-white={status === caseDetails.status}
              class:bg-gray-300={status !== caseDetails.status}
            >
              {status}
            </div>
          {/each}
        </div>
      </div>

      <!-- Right scroll button -->
      <button
        on:click={scrollRight}
        class="shrink-0 rounded bg-gray-300 px-2 py-1 text-sm font-bold hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isAtEnd}
      >
        &gt;
      </button>
    </div>
  </div>
{/if}
<!-- Tabs -->
<div class="border-b border-gray-300">
	<nav class="-mb-px flex space-x-8">
		<button
			class={`rounded-t px-3 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-l border-r border-t bg-white' : 'text-gray-600 hover:text-black'}`}
			on:click={() => (activeTab = 'details')}>Case Details</button
		>
		<button
			class={`rounded-t px-3 py-2 text-sm font-medium ${activeTab === 'messages' ? 'border-l border-r border-t bg-white' : 'text-gray-600 hover:text-black'}`}
			on:click={() => (activeTab = 'messages')}>Messages</button
		>
		<button
			class={`rounded-t px-3 py-2 text-sm font-medium ${activeTab === 'fees' ? 'border-l border-r border-t bg-white' : 'text-gray-600 hover:text-black'}`}
			on:click={() => (activeTab = 'fees')}>Fees</button
		>
		<button
			class={`rounded-t px-3 py-2 text-sm font-medium ${activeTab === 'documents' ? 'border-l border-r border-t bg-white' : 'text-gray-600 hover:text-black'}`}
			on:click={() => (activeTab = 'documents')}>Documents</button
		>
	</nav>
</div>

{#if activeTab === 'details'}
	<div class="grid grid-cols-3 gap-2 border">
		<!-- Main Case Details -->
		<div class="col-span-2 space-y-4 rounded bg-white p-4 shadow">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-sm font-semibold">Case Type:</p>
					<p class="text-sm text-gray-800">{caseDetails?.type}</p>
				</div>
				<div>
					<p class="text-sm font-semibold">Property Address:</p>
					<p class="text-sm text-gray-800">{caseDetails?.property_id}</p>
				</div>

				<div>
					<p class="text-sm font-semibold">Start Date:</p>
					<p class="text-sm text-gray-800">{caseDetails?.start_date || '—'}</p>
				</div>
				<div>
					<p class="text-sm font-semibold">End Date:</p>
					<p class="text-sm text-gray-800">{caseDetails?.end_date || '—'}</p>
				</div>

				<div>
					<p class="text-sm font-semibold">Court Name:</p>
					<p class="text-sm text-gray-800">{caseDetails?.court_name}</p>
				</div>
				<div>
					<p class="text-sm font-semibold">Court Case #:</p>
					<p class="text-sm text-gray-800">{caseDetails?.court_case_number}</p>
				</div>

				<div>
					<p class="text-sm font-semibold">Court Decision:</p>
					<p class="text-sm text-gray-800">{caseDetails?.court_decision}</p>
				</div>
				<div>
					<p class="text-sm font-semibold">Plaintiff:</p>
					<p class="text-sm text-gray-800">{caseDetails?.client_id}</p>
				</div>

				<div>
					<p class="text-sm font-semibold">Defendant:</p>
					<p class="text-sm text-gray-800">{caseDetails?.tenant_id}</p>
				</div>
				<div>
					<p class="text-sm font-semibold">Assigned Attorney:</p>
					<p class="text-sm text-gray-800">{caseDetails?.attorney_id}</p>
				</div>

				<div>
					<p class="text-sm font-semibold">Assigned Operator:</p>
					<p class="text-sm text-gray-800">{caseDetails?.operator_id}</p>
				</div>
			</div>
		</div>

		<!-- Operations Toolbox -->
		<div class="rounded bg-gray-700 p-4 text-white shadow">
			<h3 class="mb-2 text-sm font-semibold">Operations Toolbox</h3>
			<div class="text-sm italic">[Status Update Selector Here]</div>
		</div>
	</div>

	<!-- Internal Notes -->
	<div class="mt-6 rounded bg-gray-700 p-4 text-white">
		<h3 class="mb-2 text-sm font-semibold">Internal Notes</h3>
		<table class="w-full text-left text-xs">
			<thead>
				<tr>
					<th class="pb-1">Note</th>
					<th class="pb-1">User</th>
					<th class="pb-1">Date</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="py-1 italic text-gray-300" colspan="3">No notes available.</td>
				</tr>
			</tbody>
		</table>
	</div>

	{:else if activeTab === 'messages'}
	<div class="rounded border border-gray-300 bg-white p-4">
		<h3 class="mb-2 text-lg font-semibold">Message Thread</h3>
		<p class="text-sm text-gray-500 italic">[Messages UI from the messaging page will go here]</p>
	</div>
	{:else if activeTab === 'fees'}
	<div class="rounded border border-gray-300 bg-white p-4 space-y-6">
		<!-- Client-Entered Fees (Rent/Fees/Claims) -->
		<div>
			<h3 class="text-lg font-semibold mb-2">Client-Entered Fees</h3>
			<p class="text-sm text-gray-500 italic">[Display Rent, Fees, Claims here]</p>
		</div>

		<!-- File Fees -->
		<div>
			<h3 class="text-lg font-semibold mb-2">File Fees</h3>
			<p class="text-sm text-gray-500 italic">[Display list of file fees here]</p>

			{#if showFeeForm}
				<div class="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
					<p class="text-sm font-medium mb-2">New Fee Form</p>
					<p class="text-sm text-gray-500 italic">[Admin/Ops-only POST fee form here]</p>
				</div>
			{/if}
		</div>
	</div>

	{:else if activeTab === 'documents'}
	<div class="rounded border border-gray-300 bg-white p-4">
		<h3 class="mb-2 text-lg font-semibold">Documents & Invoices</h3>
		<p class="text-sm text-gray-500 italic">[Use the document table layout here, scoped to this file]</p>
	</div>


{/if}


<style>
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
		height: 0;
		width: 0;
	}
</style>
