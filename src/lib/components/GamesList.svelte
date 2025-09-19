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
		const tomorrowDateOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

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
			// Steg 1: Försök skapa Pushover-notisen
			const dateObject = new Date(game.spelstopp);
			const fiveMinutesBefore = new Date(dateObject.getTime() - 5 * 60000);	
			const unixTimestampInSeconds = Math.floor(fiveMinutesBefore.getTime() / 1000);		
			const pushoverResponse = await fetch('/api/send-notification', {
				method: 'POST',
				body: JSON.stringify({
					userKey: userKey,
					title: game.spel,
					message: `Startar om 5 minuter kl ${game.spelstopp.substring(11, 16)}`,
					timestamp: unixTimestampInSeconds
				}),
				headers: { 'Content-Type': 'application/json' }
			});

			if (!pushoverResponse.ok) {
				const errorData = await pushoverResponse.json();
				throw new Error(errorData.error || 'Okänt fel från Pushover-server');
			}

			// Steg 2: Om Pushover lyckades, uppdatera den centrala databasen
			await fetch('/api/notification-status', {
				method: 'POST',
				body: JSON.stringify({ drawNumber: game.drawNumber }),
				headers: { 'Content-Type': 'application/json' }
			});

			alert(`Påminnelse skapad för ${game.spel}!`);
			
			// Skicka ett event till föräldern (+page.svelte) för att uppdatera UI direkt
			dispatch('notificationScheduled', game.drawNumber);

		} catch (error) {
			alert(`Kunde inte skapa påminnelse: ${unixTimestampInSeconds} ${error.message}`);
			console.error('Fetch error:', error);
		}
	}
</script>

<div class="w-full">
	{#if data && data.length > 0}
		<div class="overflow-x-auto border border-gray-200 rounded-md">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Spel
						</th>
						<th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Sport
						</th>
						<th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Spelstopp
						</th>
						<th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Omsättning
						</th>
						<th scope="col" class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Jackpot
						</th>
						<th scope="col" class="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
							Påminnelse
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each data as game (game.drawNumber)}
						<tr
							class="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
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
							<td class="px-2 py-1 whitespace-nowrap text-sm text-gray-700">
								{#if game.isJackpot}
									<span
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
									>
										{game.extra}
									</span>
								{:else}
									<span>{game.extra}</span>
								{/if}
							</td>
							<td class="px-2 py-1 whitespace-nowrap text-center text-sm">
								{#if scheduledNotifications.has(String(game.drawNumber))}
									<button
										class="px-2 py-1 bg-green-500 text-white rounded-md cursor-not-allowed"
										title="Påminnelse är redan skapad"
										disabled
									>
										✔️
									</button>
								{:else}
									<button
										on:click|stopPropagation={() => schedulePushoverNotification(game)}
										class="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
		<div class="text-center py-10 px-4 bg-gray-50 rounded-lg">
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