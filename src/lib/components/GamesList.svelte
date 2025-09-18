<script>
	import { createEventDispatcher } from 'svelte';

	/**
	 * Prop: Tar emot den filtrerade listan med spelobjekt från föräldern.
	 */
	export let data = [];

	const dispatch = createEventDispatcher();

	/**
	 * Funktion som körs när en rad klickas.
	 * Skickar ett 'select'-event till föräldern med hela spelobjektet.
	 * @param {object} game - Spelobjektet för den klickade raden.
	 */
	function handleRowClick(game) {
		dispatch('select', game);
	}

	/**
	 * Formaterar ett datum till en användarvänlig sträng (t.ex. "Idag 15:59").
	 * Motsvarar din 'dagnamn'-funktion i R.
	 * @param {string} dateString - Datumsträngen (t.ex. "2025-09-18 16:20").
	 * @returns {string} Den formaterade strängen.
	 */
	function formatGameTime(dateString) {
		if (!dateString) return '';

		const gameDate = new Date(dateString);
		const today = new Date();
		const tomorrow = new Date();
		tomorrow.setDate(today.getDate() + 1);

		const time = dateString.substring(11, 16);
		let dayName = '';

		// Jämför bara datum-delen, ignorera tid
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
</script>

<div class="w-full">
	{#if data && data.length > 0}
		<div class="overflow-x-auto border border-gray-200 rounded-md">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							scope="col"
							class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Spel
						</th>
						<th
							scope="col"
							class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Sport
						</th>
						<th
							scope="col"
							class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Spelstopp
						</th>
						<th
							scope="col"
							class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Omsättning
						</th>
						<th
							scope="col"
							class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Jackpot
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
							<td class="px-4 py-3 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">{game.spel}</div>
							</td>
							<td class="px-4 py-3 whitespace-nowrap">
								<div class="text-sm text-gray-700">{game.sport}</div>
							</td>
							<td class="px-4 py-3 whitespace-nowrap">
								<div class="text-sm text-gray-700">{formatGameTime(game.spelstopp)}</div>
							</td>
							<td class="px-4 py-3 whitespace-nowrap">
								<div class="text-sm text-gray-700">{game.omsattning}</div>
							</td>
							<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
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