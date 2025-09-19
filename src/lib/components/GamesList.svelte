<script>
	import { createEventDispatcher } from 'svelte';

	// Ta emot den centrala listan som en "prop"
	export let data = [];
	export let scheduledNotifications = new Set();

	const dispatch = createEventDispatcher();

	function handleRowClick(game) {
		// Skickar det valda spelet upp till föräldern (+page.svelte)
		dispatch('select', game);
	}

	function formatGameTime(dateString) {
		if (!dateString) return '';
		const gameDate = new Date(dateString);
		const today = new Date();
		const tomorrow = new Date();
		tomorrow.setDate(today.getDate() + 1);
		const time = dateString.substring(11, 16);
		let dayName = '';
		const gameDateOnly = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate());
		const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const tomorrowDateOnly = new Date(
			tomorrow.getFullYear(),
			tomorrow.getMonth(),
			tomorrow.getDate()
		);

		if (gameDateOnly.getTime() === todayDateOnly.getTime()) {
			dayName = 'Idag';
		} else if (gameDateOnly.getTime() === tomorrowDateOnly.getTime()) {
			dayName = 'Imorgon';
		} else {
			dayName = new Intl.DateTimeFormat('sv-SE', { weekday: 'long' }).format(gameDate);
			dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
		}

		return `${dayName} ${time}`;
	}

	async function schedulePushoverNotification(game) {
		const userKey = localStorage.getItem('pushoverUserKey');
		if (!userKey) {
			alert('Du måste ange din Pushover User Key i inställningarna först.');
			return;
		}

		try {
			// Anropa vår nya slutpunkt för att spara/schemalägga notisen
			const response = await fetch('/api/schedule-notification', {
				method: 'POST',
				body: JSON.stringify({
					userKey: userKey,
					title: game.spel,
					message: `Startar om 5 minuter kl ${game.spelstopp.substring(11, 16)}`,
					spelstopp: game.spelstopp
				}),
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Okänt serverfel');
			}

			alert(`Påminnelse skapad för ${game.spel}!`);

			// Uppdatera knappens färg direkt
			dispatch('notificationScheduled', game.drawNumber);
		} catch (error) {
			alert(`Kunde inte skapa påminnelse: ${error.message}`);
			console.error('Fetch error:', error);
		}
	}
</script>

<div class="w-full">
	{#if data && data.length > 0}
		<div class="overflow-x-auto rounded-md border border-gray-200">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							scope="col"
							class="px-2 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Spel
						</th>
						<th
							scope="col"
							class="px-2 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Sport
						</th>
						<th
							scope="col"
							class="px-2 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Spelstopp
						</th>
						<th
							scope="col"
							class="px-2 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Omsättning
						</th>
						<th
							scope="col"
							class="px-2 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Jackpot
						</th>
						<th
							scope="col"
							class="px-2 py-2 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Påminnelse
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each data as game (game.drawNumber)}
						<tr
							class="cursor-pointer transition-colors duration-150 hover:bg-blue-50"
							on:click={() => handleRowClick(game)}
							title="Klicka för att se detaljer"
						>
							<td class="px-2 py-1 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">{game.spel}</div>
							</td>
							<td class="px-2 py-1 whitespace-nowrap">
								<div class="text-sm text-gray-700">{game.sport}</div>
							</td>
							<td class="px-2 py-1 whitespace-nowrap">
								<div class="text-sm text-gray-700">{formatGameTime(game.spelstopp)}</div>
							</td>
							<td class="px-2 py-1 whitespace-nowrap">
								<div class="text-sm text-gray-700">{game.omsättning}</div>
							</td>
							<td class="px-2 py-1 text-sm whitespace-nowrap text-gray-700">
								{#if game.isJackpot}
									<span
										class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
									>
										{game.extra}
									</span>
								{:else}
									<span>{game.extra}</span>
								{/if}
							</td>
							<td class="px-2 py-1 text-center text-sm whitespace-nowrap">
								{#if scheduledNotifications.has(String(game.drawNumber))}
									<button
										class="cursor-not-allowed rounded-md bg-green-500 px-2 py-1 text-white"
										title="Påminnelse är redan skapad"
										disabled
									>
										✔️
									</button>
								{:else}
									<button
										on:click|stopPropagation={() => schedulePushoverNotification(game)}
										class="rounded-md bg-blue-500 px-2 py-1 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
										title="Skapa påminnelse 5 min innan spelstopp"
									>
										🔔
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="rounded-lg bg-gray-50 px-4 py-10 text-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="mx-auto h-10 w-10 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="1"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
			<p class="mt-4 text-lg font-medium text-gray-600">Inga spel med valda filter</p>
			<p class="mt-1 text-sm text-gray-500">Prova att ändra dina val i filtret ovan.</p>
		</div>
	{/if}
</div>
