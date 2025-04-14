<script>
	import { auth } from '$lib/stores/auth';
	import { apiFetch } from '$lib/api/fetchWithBase.js';
	export let data;

	let messageContent = '';
	let isSending = false;
	let selectedRecipients = [];
	let selectedCC = [];
	let showSendToDropdown = false;
	let showCCDropdown = false;
	let dropdownDirection = 'down';
	let ccDropdownDirection = 'down';
	let currentUser = $auth.user?._id;

	const messages = data?.result ?? [];

	let selectedCaseId = messages[0]?.case_id ?? null;

	function getMessagesForCase(caseId) {
		return messages.filter((msg) => msg.case_id === caseId);
	}

	const formatTime = (timestamp) => new Date(timestamp).toLocaleString();

	const participantOptions = [
		{ id: 'primary_id', label: 'Primary Contact' },
		{ id: 'attorney_id', label: 'Attorney' },
		{ id: 'operator_id', label: 'Operator' }
	];

	const ccOptions = [
		{ id: 'user1', label: 'Support Agent A' },
		{ id: 'user2', label: 'Support Agent B' }
	];

	function toggleSelection(list, id) {
		const idx = list.indexOf(id);
		if (idx !== -1) {
			list.splice(idx, 1);
		} else {
			list.push(id);
		}

		// Force reactivity
		if (list === selectedRecipients) {
			selectedRecipients = [...list];
		} else if (list === selectedCC) {
			selectedCC = [...list];
		}
	}

	function clickOutside(node) {
		const handleClick = (event) => {
			if (!node.contains(event.target)) {
				node.dispatchEvent(new CustomEvent('outclick'));
			}
		};

		document.addEventListener('click', handleClick, true);
		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

	function smartDropDirection(node, setDirection) {
		const updatePosition = () => {
			const rect = node.getBoundingClientRect();
			const dropdownHeight = 240;
			const spaceBelow = window.innerHeight - rect.bottom;
			const dropUp = spaceBelow < dropdownHeight;
			const direction = dropUp ? 'up' : 'down';
			if (typeof setDirection === 'function') setDirection(direction);
		};

		const observer = new ResizeObserver(updatePosition);
		observer.observe(document.body);
		window.addEventListener('scroll', updatePosition, true);

		updatePosition();

		return {
			destroy() {
				observer.disconnect();
				window.removeEventListener('scroll', updatePosition, true);
			}
		};
	}

	async function sendMessage() {
		if (!messageContent.trim() || selectedRecipients.length === 0) return;

		isSending = true;

		const allRecipientIds = [...selectedRecipients, ...selectedCC];

		const payload = {
			case_id: selectedCaseId,
			sender_id: currentUser,
			recipient_ids: allRecipientIds,
			message_type: 'text',
			message: messageContent.trim()
		};

		try {
			await apiFetch('/api/messages', {
				method: 'POST',
				body: JSON.stringify(payload),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const newMessage = await res.json();

			messages.push(newMessage);
			messageContent = '';

			// Scroll to bottom of thread
			setTimeout(() => {
				const container = document.querySelector('[class*="overflow-y-auto"]');
				if (container) container.scrollTop = container.scrollHeight;
			}, 50);
		} catch (err) {
			console.error('Send error:', err);
			alert('Error sending message.');
		} finally {
			isSending = false;
		}
	}

	// Mark individual messages as read when a thread is opened
	async function markMessagesAsRead(caseId) {
		const unreadMessages = getMessagesForCase(caseId).filter(
			(msg) => !msg.read_by?.includes(currentUser)
		);

		for (const msg of unreadMessages) {
			try {
				await apiFetch(`/api/messages/${msg._id}/mark-read`, {
					method: 'PATCH'
				});
				msg.read_by = [...(msg.read_by ?? []), currentUser];
			} catch (err) {
				console.error(`Failed to mark message ${msg._id} as read`, err);
			}
		}
	}

	/*
// Batch mark messages as read
async function markMessagesAsRead(caseId) {
  const unreadMessages = getMessagesForCase(caseId).filter(
    (msg) => !msg.read_by?.includes(currentUser)
  );

  if (unreadMessages.length === 0) return;

  const message_ids = unreadMessages.map((msg) => msg._id);

  try {
    const res = await apiFetch('/api/messages/mark-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_ids })
    });

    if (!res.ok) throw new Error('Failed to mark messages as read');

    // Update read_by in local state
    unreadMessages.forEach((msg) => {
      msg.read_by = [...(msg.read_by ?? []), currentUser];
    });
  } catch (err) {
    console.error('Failed to mark messages as read:', err);
  }
}
*/
</script>

<div class="flex h-[calc(100vh-100px)] gap-4">
	<!-- Left column: case/message list -->
	<div class="w-1/3 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-sm">
		<div class="sticky top-0 z-10 border-b bg-gray-700 px-4 py-3 font-bold text-white">
			Messages
		</div>

		{#each [...new Set(messages.map((m) => m.case_id))] as caseId}
			<button
				on:click={() => (selectedCaseId = caseId)}
				class="flex w-full items-center justify-between border-b px-4 py-3 text-left transition hover:bg-gray-50
				  {selectedCaseId === caseId ? 'bg-gray-100 font-semibold' : ''}"
			>
				<div>
					<div class="text-sm text-gray-800">Case ID: {caseId.slice(0, 8)}...</div>
					<div class="text-xs text-gray-500">
						{messages.find((m) => m.case_id === caseId)?.message}
					</div>
				</div>

				{#if messages.some((m) => m.case_id === caseId && !m.is_read)}
					<span class="inline-block h-2 w-2 rounded-full bg-red-500"></span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Right column: message thread -->
	<div class="flex w-2/3 flex-col rounded-lg border border-gray-300 bg-white shadow-sm">
		<div class="border-b bg-gray-600 px-4 py-3 font-bold text-white">
			Thread: {selectedCaseId ? selectedCaseId.slice(0, 8) : 'Select a case'}
		</div>

		<div class="flex-1 space-y-4 overflow-y-auto px-6 py-4">
			{#each getMessagesForCase(selectedCaseId) as msg}
				<div
					class={`flex flex-col space-y-1 ${msg.sender_id === currentUser ? 'items-end' : 'items-start'}`}
				>
					<!-- Sender Name -->
					<div class="mb-1 text-xs font-semibold text-gray-500">
						{msg.sender_id === currentUser ? 'You' : `Sender: ${msg.sender_id.slice(0, 6)}`}
					</div>

					<!-- Message Bubble -->
					<div
						class={`max-w-[75%] rounded-xl border px-4 py-2 text-sm shadow ${
							msg.sender_id === currentUser
								? 'border-blue-200 bg-blue-100 text-gray-800'
								: 'border-gray-300 bg-gray-100 text-gray-800'
						}`}
					>
						{msg.message}
					</div>

					<!-- Timestamp -->
					<div class="mt-1 text-[11px] italic text-gray-400">
						{formatTime(msg.created_at)}
					</div>
				</div>
			{/each}
		</div>

		<div class="border-t border-gray-300 bg-gray-50 px-4 py-3">
			<div class="flex flex-wrap items-start gap-4">
				<!-- SEND TO -->
				<div
					class="relative w-64"
					use:clickOutside
					on:outclick={() => (showSendToDropdown = false)}
				>
					<label for="send-to-toggle" class="mb-1 block text-xs font-semibold text-gray-700">
						Send To:
					</label>

					<div
						id="send-to-toggle"
						role="button"
						tabindex="0"
						aria-haspopup="listbox"
						aria-expanded={showSendToDropdown}
						on:click={() => (showSendToDropdown = !showSendToDropdown)}
						on:keydown={(e) =>
							(e.key === 'Enter' || e.key === ' ') && (showSendToDropdown = !showSendToDropdown)}
						class="flex min-h-[42px] w-full cursor-pointer flex-wrap items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm"
					>
						<span class="text-gray-400">
							{selectedRecipients.length === 0
								? 'Select recipient(s)'
								: `${selectedRecipients.length} selected`}
						</span>
					</div>

					{#if showSendToDropdown}
						<div
							use:smartDropDirection={(dir) => (dropdownDirection = dir)}
							class={`absolute z-10 max-h-60 w-full overflow-y-auto rounded border border-gray-300 bg-white shadow ${
								dropdownDirection === 'up' ? 'bottom-full mb-1' : 'mt-1'
							}`}
						>
							{#each participantOptions as option, i}
								<label
									for={`send-option-${i}`}
									class="flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-gray-50"
								>
									<input
										id={`send-option-${i}`}
										type="checkbox"
										checked={selectedRecipients.includes(option.id)}
										on:change={() => toggleSelection(selectedRecipients, option.id)}
										class="mr-2"
									/>
									{option.label}
								</label>
							{/each}
						</div>
					{/if}
				</div>

				<!-- CC -->
				<div class="relative w-64" use:clickOutside on:outclick={() => (showCCDropdown = false)}>
					<label for="cc-toggle" class="mb-1 block text-xs font-semibold text-gray-700">
						CC:
					</label>

					<div
						id="cc-toggle"
						role="button"
						tabindex="0"
						aria-haspopup="listbox"
						aria-expanded={showCCDropdown}
						on:click={() => (showCCDropdown = !showCCDropdown)}
						on:keydown={(e) =>
							(e.key === 'Enter' || e.key === ' ') && (showCCDropdown = !showCCDropdown)}
						class="flex min-h-[42px] w-full cursor-pointer flex-wrap items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm"
					>
						<span class="text-gray-400">
							{selectedCC.length === 0 ? 'Select CC(s)' : `${selectedCC.length} selected`}
						</span>
					</div>

					{#if showCCDropdown}
						<div
							use:smartDropDirection={(dir) => (ccDropdownDirection = dir)}
							class={`absolute z-10 max-h-60 w-full overflow-y-auto rounded border border-gray-300 bg-white shadow ${
								ccDropdownDirection === 'up' ? 'bottom-full mb-1' : 'mt-1'
							}`}
						>
							{#each ccOptions as option, i}
								<label
									for={`cc-option-${i}`}
									class="flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-gray-50"
								>
									<input
										id={`cc-option-${i}`}
										type="checkbox"
										checked={selectedCC.includes(option.id)}
										on:change={() => toggleSelection(selectedCC, option.id)}
										class="mr-2"
									/>
									{option.label}
								</label>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Message input -->
		<div class="border-t bg-gray-50 px-4 py-3">
			<!-- Selected Recipients & CC Display -->
			<div class="mb-3 w-full">
				<div class="mb-1 text-xs font-semibold text-gray-700">Sending to:</div>
				<div class="flex flex-wrap gap-2">
					{#each selectedRecipients as id}
						<span
							class="flex items-center gap-1 rounded bg-gray-200 px-2 py-1 text-xs text-gray-700"
						>
							<span>{participantOptions.find((p) => p.id === id)?.label ?? id}</span>
							<button
								type="button"
								on:click={() => toggleSelection(selectedRecipients, id)}
								class="ml-1 text-gray-500 hover:text-red-600 focus:outline-none"
								aria-label="Remove"
							>
								×
							</button>
						</span>
					{/each}

					{#each selectedCC as id}
						<span
							class="flex items-center gap-1 rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-500"
						>
							<span>{ccOptions.find((p) => p.id === id)?.label ?? id} (cc)</span>
							<button
								type="button"
								on:click={() => toggleSelection(selectedCC, id)}
								class="ml-1 text-gray-400 hover:text-red-600 focus:outline-none"
								aria-label="Remove"
							>
								×
							</button>
						</span>
					{/each}
				</div>
			</div>
			<form on:submit|preventDefault={sendMessage}>
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={messageContent}
						placeholder="Type your message..."
						class="flex-1 rounded border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-300 focus:outline-none focus:ring"
					/>
					<button
						type="submit"
						class="rounded bg-gray-700 px-4 py-2 text-white shadow hover:bg-gray-800 disabled:opacity-50"
						disabled={!messageContent.trim() || selectedRecipients.length === 0 || isSending}
					>
						{isSending ? 'Sending...' : 'Send'}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
