<script>
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { apiFetch } from '$lib/api/fetchWithBase';
	import { auth } from '$lib/stores/auth';

	const dispatch = createEventDispatcher();

	let user;
	let clients = [];
	let properties = [];
	let tenants = [];
	let users = [];
	let managementCompanies = [];

	let currentStep = 1;
	const totalSteps = 6;

	let loadError = '';
	let originalTenantAddress = '';
	let newDebt = { description: '', amount: 0 };
	let newAdditionalDoc = { file: '', type: '', notes: '' };
	let newTenant = { firstName: '', lastName: '', email: '', phone: '', tenantCode: '' };

	let caseDetails = {
		caseType: 'filing',
		property_id: '',
		formattedAddress: '',
		tenants: [],
		management_company_id: '',
		primary_contact_id: '',
		newAddress: {
			streetNumber: '',
			streetName: '',
			unitNumber: '',
			city: '',
			state: '',
			postalCode: '',
			propertyCode: ''
		},
		rentFeesClaims: {
			filingPoNumber: '',
			baseRent: 0,
			holdover: false,
			monthsUnpaid: 0,
			currentMonthUnpaidDate: '',
			isSubsidized: false,
			rentalReliefApplication: false,
			lateFee: 0,
			lateMonths: 0,
			filingFee: 0,
			miscDebts: []
		},
		acknowledgment: {
			rentalReliefConfirmed: false,
			statementsConfirmed: false
		},
		missing_attachments_reason: {
			lease: { selectedOverride: '', reason: '' },
			ledger: { selectedOverride: '', reason: '' },
			demand: { selectedOverride: '', reason: '' },
			deed: { selectedOverride: '', reason: '' }
		},
		documents: {
			lease: {},
			ledger: {},
			demand: {},
			ownershipDeed: {},
			additionalDocs: []
		}
	};

	onMount(() => {
		auth.subscribe(async (value) => {
			user = value?.user;
			if (user?.client_id) {
				const clientId =
					typeof $auth.user.client_id === 'string'
						? $auth.user.client_id
						: $auth.user.client_id._id;
				await loadData(clientId);
			} else {
				loadError = 'No client ID found for this user.';
			}
		});
	});

	async function safeParse(res) {
		try {
			return await res.json();
		} catch {
			return '[Could not parse JSON]';
		}
	}

	async function loadData(clientId) {
		try {
			const [clientRes, propRes, userRes, tenantRes] = await Promise.all([
				apiFetch(`/clients/${clientId}`),
				apiFetch(`/properties?clientId=${clientId}`),
				apiFetch(`/users`),
				apiFetch(`/tenants?clientId=${clientId}`)
			]);

			// Debug failures
			if (!clientRes.ok) console.error('❌ /clients', clientRes.status, await safeParse(clientRes));
			if (!propRes.ok) console.error('❌ /properties', propRes.status, await safeParse(propRes));
			if (!userRes.ok) console.error('❌ /users', userRes.status, await safeParse(userRes));
			if (!tenantRes.ok) console.error('❌ /tenants', tenantRes.status, await safeParse(tenantRes));

			if (!clientRes.ok || !propRes.ok || !userRes.ok || !tenantRes.ok) {
				throw new Error('One or more fetches failed.');
			}

			clients = [await clientRes.json()];
			properties = await propRes.json();
			users = await userRes.json();
			tenants = await tenantRes.json();
			managementCompanies = clients[0]?.management_companies || [];
		} catch (err) {
			console.error('Error loading form data:', err);
			loadError =
				'Something went wrong while loading your form. Please refresh or contact support.';
		}
	}

	function nextStep() {
		if (currentStep < totalSteps) currentStep++;
	}

	function prevStep() {
		if (currentStep > 1) currentStep--;
	}

	function closeModal() {
		dispatch('close');
		currentStep = 1;
		resetForm();
	}

	function resetForm() {
		originalTenantAddress = '';
		newDebt = { description: '', amount: 0 };
		newAdditionalDoc = { file: '', type: '', notes: '' };
		newTenant = { firstName: '', lastName: '', email: '', phone: '', tenantCode: '' };
		currentStep = 1;
		caseDetails = {
			...caseDetails,
			property_id: '',
			formattedAddress: '',
			tenants: [],
			management_company_id: '',
			primary_contact_id: ''
		};
	}

	function handleAddressSelection(event) {
		const val = event.target.value;
		if (val === 'new') {
			caseDetails.property_id = 'new';
			caseDetails.formattedAddress = '';
			return;
		}
		const selected = properties.find((p) => p._id === val);
		caseDetails.property_id = selected?._id || '';
		caseDetails.formattedAddress = selected?.formatted_address || '';
	}

	async function saveNewAddress() {
		try {
			const newProperty = await createProperty(caseDetails.newAddress);
			if (!newProperty || !newProperty._id) throw new Error('Invalid property response');

			properties = [...properties, newProperty];
			caseDetails.property_id = newProperty._id;
			caseDetails.formattedAddress = newProperty.formatted_address;
			nextStep();
		} catch (err) {
			console.error('Failed to create property:', err);
			alert('There was a problem saving the new address. Please try again.');
		}
	}

	async function createProperty(addressObj) {
		try {
			const payload = {
				client_id: $auth.user.client_id._id,
				property_code: addressObj.propertyCode,
				address: `${addressObj.streetNumber} ${addressObj.streetName}`.trim(),
				city: addressObj.city,
				state: addressObj.state,
				zip: addressObj.postalCode,
				formatted_address: `${addressObj.streetNumber} ${addressObj.streetName}, ${addressObj.city}, ${addressObj.state} ${addressObj.postalCode}`,
				is_active: true
			};

			const res = await apiFetch('/properties', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			let result;
			try {
				result = await res.json();
			} catch (e) {
				console.error('❌ Failed to parse property response:', e);
				throw new Error('Property API returned invalid JSON');
			}

			if (!res.ok) {
				console.error('❌ Property creation failed:', res.status, result);
				throw new Error(result?.message || 'Property creation failed');
			}

			// Normalize _id from id
			result._id = result._id || result.id;

			if (!result._id) {
				throw new Error('Invalid property response: missing _id');
			}

			return result;
		} catch (err) {
			console.error('Failed to create property:', err);
			alert('Failed to create property. Please try again.');
			return null;
		}
	}

	function handlePrimaryContactSelection(event) {
		const selectedId = event.target.value;
		const selectedUser = users.find((u) => u._id === selectedId);
		caseDetails.primary_contact_id = selectedUser?._id;
		caseDetails.primary_contact_full_name = selectedUser?.full_name;
	}

	function handleDocumentStatus(type, value) {
		caseDetails.documents[type].status = value;
		caseDetails.missing_attachments_reason[type].selectedOverride = value;
		if (value === 'attached') {
			caseDetails.missing_attachments_reason[type].reason = '';
		}
	}

	function handleMissingReasonChange(type, value) {
		caseDetails.missing_attachments_reason[type].reason = value;
	}

	function handleFileUpload(event, type) {
		const file = event.target.files[0];
		if (!file) return;

		caseDetails.documents[type] = {
			file,
			status: 'pending',
			type,
			explanation: ''
		};
	}

	async function uploadDocumentsForCase(caseId) {
		const entries = Object.entries(caseDetails.documents);
		for (const [type, doc] of entries) {
			if (!doc?.file || doc.status === 'attached') continue;

			const formData = new FormData();
			formData.append('file', doc.file);
			formData.append('client_id', $auth.user.client_id._id || $auth.user.client_id);
			formData.append('type', type);
			formData.append('is_temporary', false);

			try {
				const res = await apiFetch('/documents', {
					method: 'POST',
					body: formData
				});

				if (!res || !res._id) throw new Error('Upload failed');

				await apiFetch('/documents/link-to-case', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: res.name,
						case_id: caseId,
						is_temporary: false
					})
				});
			} catch (err) {
				console.error(`Upload/link failed for ${type}:`, err);
			}
		}
	}

	function getFullName(t) {
		return [t.firstName, t.lastName].filter(Boolean).join(' ');
	}

	async function addTenant() {
		try {
			const payload = {
				first_name: newTenant.firstName,
				last_name: newTenant.lastName,
				full_name: `${newTenant.firstName} ${newTenant.lastName}`.trim(),
				email: newTenant.email,
				phone_number: newTenant.phone,
				tenant_code: newTenant.tenantCode
			};

			const res = await apiFetch('/tenants', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			let result;
			try {
				result = await res.json();
				console.log('🚀 Added Tenant:', result);
			} catch (e) {
				console.error('❌ Failed to parse addTenant response:', e);
				throw new Error('Tenant API returned invalid JSON');
			}

			if (!res.ok) {
				console.error('❌ Tenant add failed:', res.status, result);
				throw new Error(result?.message || 'Add tenant failed');
			}

			const tenantId = result._id || result.id;
			if (!tenantId) {
				throw new Error('Invalid addTenant response');
			}

			caseDetails.tenants = [...caseDetails.tenants, result];

			newTenant = {
				firstName: '',
				lastName: '',
				email: '',
				phone: '',
				tenantCode: ''
			};

			return result;
		} catch (err) {
			console.error('Failed to addTenant:', err);
			alert('There was a problem during addTenant. Please try again.');
			return null;
		}
	}

	function removeTenant(index) {
		caseDetails.tenants = caseDetails.tenants.filter((_, i) => i !== index);
	}

	function addDebt() {
		if (!newDebt.description.trim()) {
			alert('Please enter a description for the fee.');
			return;
		}
		if (!newDebt.amount || isNaN(newDebt.amount) || newDebt.amount <= 0) {
			alert('Please enter a valid amount greater than 0.');
			return;
		}
		caseDetails.rentFeesClaims.miscDebts = [
			...caseDetails.rentFeesClaims.miscDebts,
			{ ...newDebt }
		];
		newDebt = { description: '', amount: 0 };
	}

	function removeDebt(index) {
		caseDetails.rentFeesClaims.miscDebts = caseDetails.rentFeesClaims.miscDebts.filter(
			(_, i) => i !== index
		);
	}

	function buildCasePayload() {
		return {
			type: caseDetails.caseType,
			client_id: $auth.user.client_id._id,
			property_id: caseDetails.property_id,
			tenants: caseDetails.tenants.map((t) => t._id || t.id),
			management_company_id: caseDetails.management_company_id,
			primary_contact_id: caseDetails.primary_contact_id,
			status: 'Demand Posted',
			rentFeesClaims: { ...caseDetails.rentFeesClaims },
			acknowledgment: { ...caseDetails.acknowledgment },
			missing_attachments_reason: { ...caseDetails.missing_attachments_reason },
			documents: caseDetails.documents
		};
	}

	async function submitCase() {
		try {
			const payload = buildCasePayload();

			const res = await apiFetch('/cases', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload) // ✅ Now using the cleaned-up payload
			});

			let result;
			try {
				result = await res.json();
				console.log('🚀 Case created:', result);
			} catch (e) {
				console.error('❌ Failed to parse case response:', e);
				throw new Error('Case API returned invalid JSON');
			}

			const caseId = result._id || result.id;
			if (!res.ok || !caseId) {
				console.error('❌ Case creation failed:', res.status, result);
				throw new Error(result?.message || 'Case creation failed');
			}

			await uploadDocumentsForCase(result._id);
			alert('Case created successfully!');
			closeModal();
		} catch (err) {
			console.error('Failed to submit case:', err);
			alert('There was a problem creating the case. Please try again.');
		}
	}
</script>

<div class="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
	<div class="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
		<!-- Progress Bar -->
		<div class="sticky top-0 z-10 mb-6">
			<div class="h-4 rounded-full bg-gray-200">
				<div
					class="flex h-4 items-center justify-center rounded-full bg-gray-700 text-xs text-white"
					style="width: {(currentStep / totalSteps) * 100}%"
				>
					Step {currentStep} of {totalSteps}
				</div>
			</div>
		</div>

		<!-- STEP 1 -->
		{#if currentStep === 1}
			<h2 class="mb-4 text-2xl font-semibold">Start New Case</h2>

			<input type="hidden" bind:value={caseDetails.caseType} />

			<!-- Property Selection -->
			<div class="mb-4">
				<label for="propertyAddress" class="mb-1 block font-medium">Property Address</label>
				<select
					bind:value={caseDetails.property_id}
					on:change={handleAddressSelection}
					class="form-select w-full bg-gray-100"
					id="propertyAddress"
				>
					<option value="" disabled>Select an option</option>
					<option value="new">➕ Add New Address</option>
					{#each properties as property}
						<option value={property._id}>{property.formatted_address}</option>
					{/each}
				</select>
			</div>

			<!-- New Address Form -->
			{#if caseDetails.property_id === 'new'}
				<div class="mb-4 rounded-lg bg-gray-50 p-4">
					<h3 class="mb-2 text-lg font-semibold">Add New Address</h3>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="streetNumber" class="block font-medium">Street Number</label>
							<input
								type="text"
								class="form-input w-full bg-gray-100"
								bind:value={caseDetails.newAddress.streetNumber}
								id="streetNumber"
							/>
							<label for="streetName" class="mt-2 block font-medium">Street Name</label>
							<input
								type="text"
								class="form-input w-full bg-gray-100"
								bind:value={caseDetails.newAddress.streetName}
								id="streetName"
							/>
							<label for="city" class="mt-2 block font-medium">City</label>
							<input
								type="text"
								class="form-input w-full bg-gray-100"
								bind:value={caseDetails.newAddress.city}
								id="city"
							/>
						</div>
						<div>
							<label for="state" class="block font-medium">State</label>
							<input
								type="text"
								class="form-input w-full bg-gray-100"
								bind:value={caseDetails.newAddress.state}
								id="state"
							/>
							<label for="postalCode" class="mt-2 block font-medium">Postal Code</label>
							<input
								type="text"
								class="form-input w-full bg-gray-100"
								bind:value={caseDetails.newAddress.postalCode}
								id="postalCode"
							/>
							<label for="propertyCode" class="mt-2 block font-medium">Property Code</label>
							<input
								type="text"
								class="form-input w-full bg-gray-100"
								bind:value={caseDetails.newAddress.propertyCode}
							/>
						</div>
					</div>

					<div class="mt-4 flex justify-end gap-2">
						<button
							class="rounded bg-gray-500 px-4 py-2 text-white"
							on:click={() => (caseDetails.property_id = '')}
						>
							Discard
						</button>
						<button class="rounded bg-gray-800 px-4 py-2 text-white" on:click={saveNewAddress}>
							Save & Continue
						</button>
					</div>
				</div>
			{/if}

			<div class="mt-6 flex justify-between">
				<button class="rounded bg-gray-500 px-4 py-2 text-white" on:click={closeModal}
					>Cancel</button
				>
				<button
					class="rounded bg-gray-800 px-4 py-2 text-white"
					on:click={() => {
						if (caseDetails.property_id && caseDetails.property_id !== 'new') {
							nextStep();
						} else {
							alert('Please select or add a property address.');
						}
					}}>Next</button
				>
			</div>
		{/if}

		<!-- STEP 2 -->
		{#if currentStep === 2}
			<h2 class="mb-4 text-2xl font-semibold">Plaintiff Details</h2>

			<div class="mb-4">
				<label for="propertyAddress" class="mb-1 block font-medium">Property Address</label>
				<input
					type="text"
					class="form-input w-full bg-gray-100"
					value={caseDetails.formattedAddress}
					disabled
					id="propertyAddress"
				/>
			</div>

			<div class="mb-4">
				<label for="plaintiffName" class="mb-1 block font-medium">Plaintiff Name</label>
				<input
					type="text"
					class="form-input w-full bg-gray-100"
					value={clients[0]?.legal_name || '—'}
					disabled
					id="plaintiffName"
				/>
			</div>

			<div class="mb-4">
				<label for="managementCompany" class="mb-1 block font-medium">Management Company</label>
				<select
					bind:value={caseDetails.management_company_id}
					class="form-select w-full bg-gray-100"
					id="managementCompany"
				>
					<option value="" disabled>Select...</option>
					{#each managementCompanies as mc}
						<option value={mc._id}>{mc.name}</option>
					{/each}
				</select>
			</div>

			<div class="mb-4">
				<label for="primaryContact" class="mb-1 block font-medium">Primary Contact</label>
				<select
					on:change={handlePrimaryContactSelection}
					class="form-select w-full bg-gray-100"
					id="primaryContact"
				>
					<option value="">Select contact</option>
					{#each users.filter((u) => u.is_active && u.role === 'client') as u}
						<option value={u._id}>{u.full_name}</option>
					{/each}
				</select>
			</div>

			<div class="mt-6 flex justify-between">
				<button class="rounded bg-gray-500 px-4 py-2 text-white" on:click={prevStep}>Back</button>
				<button class="rounded bg-gray-800 px-4 py-2 text-white" on:click={nextStep}>Next</button>
			</div>
		{/if}

		<!-- STEP 3 -->
		{#if currentStep === 3}
			<h2 class="mb-4 text-2xl font-semibold">Tenant Details</h2>

			<div class="mb-4">
				<label for="tenantCode" class="mb-1 block font-medium">Tenant Code (optional)</label>
				<input
					type="text"
					class="form-input w-full bg-gray-100"
					bind:value={newTenant.tenantCode}
					id="tenantCode"
				/>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label for="firstName" class="mb-1 block font-medium">First Name</label>
					<input
						type="text"
						class="form-input w-full bg-gray-100"
						bind:value={newTenant.firstName}
						id="firstName"
					/>
				</div>
				<div>
					<label for="lastName" class="mb-1 block font-medium">Last Name</label>
					<input
						type="text"
						class="form-input w-full bg-gray-100"
						bind:value={newTenant.lastName}
						id="lastName"
					/>
				</div>
				<div>
					<label for="email" class="mb-1 block font-medium">Email</label>
					<input
						type="email"
						class="form-input w-full bg-gray-100"
						bind:value={newTenant.email}
						id="email"
					/>
				</div>
				<div>
					<label for="phone" class="mb-1 block font-medium">Phone</label>
					<input
						type="text"
						class="form-input w-full bg-gray-100"
						bind:value={newTenant.phone}
						id="phone"
					/>
				</div>
			</div>

			<div class="mt-4 flex justify-end">
				<button class="rounded bg-gray-800 px-4 py-2 text-white" on:click={addTenant}
					>Add Tenant</button
				>
			</div>

			{#if caseDetails.tenants.length > 0}
				<div class="mt-6">
					<h3 class="mb-2 text-lg font-semibold">Tenants Added</h3>
					<table class="w-full border bg-white text-sm">
						<thead class="bg-gray-100">
							<tr>
								<th class="text-center">Name</th>
								<th class="text-center">Email</th>
								<th class="text-center">Phone</th>
								<th class="text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each caseDetails.tenants as tenant, i (tenant._id)}
								<tr class="border-t">
									<td class="text-center">{tenant.full_name}</td>
									<td class="text-center">{tenant.email}</td>
									<td class="text-center">{tenant.phone_number}</td>
									<td class="text-center">
										<button class="text-red-600 hover:underline" on:click={() => removeTenant(i)}
											>Remove</button
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<div class="mt-6 flex justify-between">
				<button class="rounded bg-gray-500 px-4 py-2 text-white" on:click={prevStep}>Back</button>
				<button class="rounded bg-gray-800 px-4 py-2 text-white" on:click={nextStep}>Next</button>
			</div>
		{/if}

		<!-- STEP 4 -->
		{#if currentStep === 4}
			<h2 class="mb-4 text-2xl font-semibold">Rent / Fees / Claims</h2>

			<!-- Filing PO Number -->
			<div class="mb-4">
				<label for="filingPoNumber" class="block font-medium">Filing PO Number</label>
				<input
					type="text"
					class="form-input w-full bg-gray-100"
					bind:value={caseDetails.rentFeesClaims.filingPoNumber}
					id="filingPoNumber"
				/>
			</div>

			<!-- Rent Section -->
			<h3 class="mt-6 text-lg font-semibold">Rent</h3>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label for="baseRent" class="block font-medium">Base Rent / Month ($)</label>
					<input
						type="number"
						class="form-input w-full bg-gray-100"
						bind:value={caseDetails.rentFeesClaims.baseRent}
						id="baseRent"
					/>

					<label for="monthsUnpaid" class="mt-4 block font-medium">Months Unpaid</label>
					<input
						type="number"
						class="form-input w-full bg-gray-100"
						bind:value={caseDetails.rentFeesClaims.monthsUnpaid}
						id="monthsUnpaid"
					/>

					<label for="currentMonthUnpaidDate" class="mt-4 block font-medium"
						>Date of Current Month Unpaid</label
					>
					<small class="mb-1 block text-gray-500">Defaults to 1st of selected month</small>
					<input
						type="date"
						class="form-input w-full bg-gray-100"
						value={caseDetails.rentFeesClaims.currentMonthUnpaidDate}
						on:change={(e) => {
							const date = new Date(e.target.value);
							if (!isNaN(date)) {
								const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
								caseDetails.rentFeesClaims.currentMonthUnpaidDate = normalized
									.toISOString()
									.split('T')[0];
							}
						}}
					/>
				</div>

				<div>
					<label for="holdover" class="block font-medium">Holdover?</label>
					<div class="mb-4 flex gap-4">
						<label class="inline-flex items-center">
							<input
								type="radio"
								bind:group={caseDetails.rentFeesClaims.holdover}
								value={true}
								id="holdoverYes"
							/>
							<span class="ml-2">Yes</span>
						</label>
						<label class="inline-flex items-center">
							<input
								type="radio"
								bind:group={caseDetails.rentFeesClaims.holdover}
								value={false}
								id="holdoverNo"
							/>
							<span class="ml-2">No</span>
						</label>
					</div>

					<label for="isSubsidized" class="block font-medium">Is Rent Subsidized?</label>
					<div class="mb-4 flex gap-4">
						<label class="inline-flex items-center">
							<input
								type="radio"
								bind:group={caseDetails.rentFeesClaims.isSubsidized}
								value={true}
								id="isSubsidizedYes"
							/>
							<span class="ml-2">Yes</span>
						</label>
						<label class="inline-flex items-center">
							<input
								type="radio"
								bind:group={caseDetails.rentFeesClaims.isSubsidized}
								value={false}
								id="isSubsidizedNo"
							/>
							<span class="ml-2">No</span>
						</label>
					</div>
				</div>
			</div>

			<!-- Rental Relief -->
			<h3 class="mt-6 text-lg font-semibold">Rental Relief</h3>
			<p class="mb-2 text-sm text-gray-600">
				Is there currently a pending or rejected rental relief application?
			</p>
			<div class="mb-4 flex gap-4">
				<label class="inline-flex items-center">
					<input
						type="radio"
						bind:group={caseDetails.rentFeesClaims.rentalReliefApplication}
						value={true}
					/>
					<span class="ml-2">Yes</span>
				</label>
				<label class="inline-flex items-center">
					<input
						type="radio"
						bind:group={caseDetails.rentFeesClaims.rentalReliefApplication}
						value={false}
					/>
					<span class="ml-2">No</span>
				</label>
			</div>

			<!-- Property Fees -->
			<h3 class="mt-6 text-lg font-semibold">Property Fees</h3>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label for="lateFee" class="block font-medium">Monthly Late Fee ($)</label>
					<input
						type="number"
						class="form-input w-full bg-gray-100"
						bind:value={caseDetails.rentFeesClaims.lateFee}
						id="lateFee"
					/>

					<label for="monthsLate" class="mt-4 block font-medium">Months Late</label>
					<input
						type="number"
						class="form-input w-full bg-gray-100"
						bind:value={caseDetails.rentFeesClaims.lateMonths}
						id="monthsLate"
					/>
				</div>
				<div>
					<label for="totalLateFees" class="block font-medium">Total Late Fees</label>
					<input
						type="number"
						disabled
						class="form-input w-full bg-gray-200 text-gray-800"
						value={caseDetails.rentFeesClaims.lateFee * caseDetails.rentFeesClaims.lateMonths}
						id="totalLateFees"
					/>

					<label for="filingFee" class="mt-4 block font-medium">Filing Fee ($)</label>
					<input
						type="number"
						class="form-input w-full bg-gray-100"
						bind:value={caseDetails.rentFeesClaims.filingFee}
					/>
				</div>
			</div>

			<!-- Miscellaneous Debts -->
			<h3 class="mt-6 text-lg font-semibold">Miscellaneous Debts</h3>
			<div class="mb-2 flex flex-col gap-2 md:flex-row">
				<input
					type="text"
					placeholder="Description"
					class="form-input w-full bg-gray-100 md:w-1/2"
					bind:value={newDebt.description}
				/>
				<input
					type="number"
					placeholder="Amount ($)"
					class="form-input w-full bg-gray-100 md:w-1/4"
					bind:value={newDebt.amount}
				/>
				<button
					class="w-full rounded bg-gray-700 px-4 py-2 text-white hover:bg-opacity-90 md:w-1/4"
					on:click={addDebt}
				>
					Add Debt
				</button>
			</div>

			{#if caseDetails.rentFeesClaims.miscDebts.length > 0}
				<div class="mt-2 max-h-[20vh] overflow-y-auto rounded border bg-white">
					<table class="w-full text-sm">
						<thead class="bg-gray-200 text-left">
							<tr>
								<th class="p-3">Type</th>
								<th class="p-3">Amount</th>
								<th class="p-3">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each caseDetails.rentFeesClaims.miscDebts as debt, i}
								<tr class="border-t">
									<td class="p-3">{debt.description}</td>
									<td class="p-3">${debt.amount}</td>
									<td class="p-3">
										<button class="text-red-600 hover:underline" on:click={() => removeDebt(i)}>
											Remove
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<!-- Total Due -->
			<h3 class="mt-6 text-lg font-semibold">Total Due from Tenant</h3>
			<input
				type="text"
				disabled
				class="form-input w-full bg-gray-200 text-lg font-bold text-red-600"
				value={`$${(
					caseDetails.rentFeesClaims.baseRent * caseDetails.rentFeesClaims.monthsUnpaid +
					caseDetails.rentFeesClaims.lateFee * caseDetails.rentFeesClaims.lateMonths +
					caseDetails.rentFeesClaims.filingFee +
					caseDetails.rentFeesClaims.miscDebts.reduce((sum, d) => sum + d.amount, 0)
				).toFixed(2)}`}
			/>

			<!-- Navigation -->
			<div class="mt-6 flex justify-between">
				<button on:click={prevStep} class="rounded bg-gray-500 px-4 py-2 text-white">Back</button>
				<button on:click={nextStep} class="rounded bg-gray-800 px-4 py-2 text-white">Next</button>
			</div>
		{/if}

		<!-- STEP 5 -->
		{#if currentStep === 5}
			<h2 class="mb-4 text-2xl font-semibold">Upload Documents</h2>

			{#each ['lease', 'ledger', 'demand', 'ownershipDeed'] as docType}
				<!-- Ensure safe initialization for both doc and reason objects -->
				{#if !caseDetails.documents[docType]}
					{@html ''}
					{(caseDetails.documents[docType] = { status: '', file: null })}
				{/if}
				{#if !caseDetails.missing_attachments_reason[docType]}
					{@html ''}
					{(caseDetails.missing_attachments_reason[docType] = { selectedOverride: '', reason: '' })}
				{/if}

				<div class="mb-6">
					<label for={docType} class="mb-1 block font-medium capitalize">{docType}</label>
					<input
						type="file"
						on:change={(e) => handleFileUpload(e, docType)}
						class="w-full bg-gray-700 text-white"
					/>

					<select
						bind:value={caseDetails.documents[docType].status}
						on:change={(e) => handleDocumentStatus(docType, e.target.value)}
						class="form-select mt-2 w-full bg-gray-100"
					>
						<option value="">Select status</option>
						<option value="attached">Attached</option>
						<option value="cannotAttachSquatter">Cannot Attach - Squatter</option>
						<option value="cannotAttachOther">Cannot Attach - Other</option>
					</select>

					{#if caseDetails.documents[docType].status !== 'attached' && caseDetails.documents[docType].status}
						<textarea
							class="form-input mt-2 w-full bg-gray-100"
							bind:value={caseDetails.missing_attachments_reason[docType].reason}
							placeholder="Explain why document is missing"
						></textarea>
					{/if}
				</div>
			{/each}

			<div class="mt-6 flex justify-between">
				<button class="rounded bg-gray-500 px-4 py-2 text-white" on:click={prevStep}>Back</button>
				<button class="rounded bg-gray-800 px-4 py-2 text-white" on:click={nextStep}>Next</button>
			</div>
		{/if}

		<!-- STEP 6 -->
		{#if currentStep === 6}
			<h2 class="mb-4 text-2xl font-semibold">Acknowledgment</h2>
			<p class="mb-4 border-l-4 border-gray-400 pl-4 text-sm leading-relaxed text-gray-700">
				To assure you can file the contemplated eviction case please acknowledge that you have
				reviewed whether the above resident(s) are pending or participating in a Rental Relief
				Program, which may limit your ability to file this case. Please acknowledge that you have:
				<br />1. A detailed understanding of any current or pending rental relief programs related
				to the above listed resident(s).
				<br />2. Are aware of no limitations placed upon the ability of the property owner,
				management company or any other party to file the eviction case.
				<br />3. You understand that if you have any questions, concerns or require additional
				guidance you should not file this case until you have consulted with your attorney or
				company resources with knowledge to clarify such matters.
				<br /><br />
				You also hereby affirm and attest that the statements set forth in this filing are true and correct.
				<br /><br />
				By clicking the boxes below, you are acknowledging and certifying that the resident(s) is/are
				eligible to have an eviction case filed against them and are not subject to limitation for any
				reason.
			</p>
			<div class="space-y-3">
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={caseDetails.acknowledgment.rentalReliefConfirmed} />
					<span>I confirm Rental Relief has been reviewed</span>
				</label>
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={caseDetails.acknowledgment.statementsConfirmed} />
					<span>I confirm the information is accurate</span>
				</label>
			</div>

			<div class="mt-6 flex justify-between">
				<button class="rounded bg-gray-500 px-4 py-2 text-white" on:click={prevStep}>Back</button>
				<button
					class="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
					on:click={submitCase}
					disabled={!caseDetails.acknowledgment.rentalReliefConfirmed ||
						!caseDetails.acknowledgment.statementsConfirmed}
				>
					Submit Case
				</button>
			</div>
		{/if}
	</div>
</div>
