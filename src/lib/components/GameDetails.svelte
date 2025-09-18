<script>
	/**
	 * Props: Data som komponenten tar emot från sin förälder.
	 * 'details' kan vara null om inget spel är valt.
	 * 'isLoading' är true medan ny data hämtas.
	 */
	export let details = null;
	export let isLoading = false;

	/**
	 * En reaktiv variabel som skapar rätt URL till spelsidan
	 * baserat på informationen i 'details'.
	 * $: gör att den räknas om automatiskt när 'details' ändras.
	 */
	$: gameUrl = (() => {
		if (!details?.header?.spelURL || !details?.header?.drawNumber) {
			return '#';
		}

		const { spelURL, drawNumber, source } = details.header;

		// Logiken är anpassad från din R-app för att länka till de faktiska spelsidorna
		if (source === 'ATG') {
			if (spelURL === 'big9') {
				return `https://www.atg.se/sport/${drawNumber}`;
			}
			// För V-spel är drawNumber hela ID:t, t.ex. V75_2025-09-18_5_1
			const gameIdForUrl = drawNumber.replace(/_/g, '-');
			return `https://www.atg.se/spel/${gameIdForUrl}`;
		}

		if (source === 'SvS') {
			return `https://spela.svenskaspel.se/sportochcasino/${spelURL}/spela/${drawNumber}`;
		}

		return '#';
	})();
</script>

<div class="h-full flex flex-col">
	{#if isLoading}
		<div class="flex items-center justify-center h-full">
			<div class="text-center text-gray-500">
				<div
					class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"
				></div>
				<p class="mt-4">Hämtar omgångsinformation...</p>
			</div>
		</div>
	{:else if details && details.events && details.events.length > 0}
		<div class="flex-grow">
			<div class="space-y-2 text-gray-700">
				<p><strong>Spel:</strong> {details.header.spel}</p>
				<p><strong>Spelstopp:</strong> {details.header.spelstopp}</p>
				</div>

			<div class="my-6 text-center">
				<a
					href={gameUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-block bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-red-700 transition-transform transform hover:scale-105"
				>
					Gå till omgång
				</a>
			</div>

			<div class="overflow-x-auto">
				<table class="min-w-full bg-white border border-gray-200">
					<thead class="bg-gray-100">
						<tr>
							<th class="py-2 px-3 text-left font-semibold text-gray-600 border-b">Nr</th>
							<th class="py-2 px-3 text-left font-semibold text-gray-600 border-b">Match/Lopp</th>
							<th class="py-2 px-3 text-left font-semibold text-gray-600 border-b">Tid</th>
						</tr>
					</thead>
					<tbody>
						{#each details.events as event (event.nr)}
							<tr class="hover:bg-gray-50 border-t">
								<td class="py-2 px-3 text-center w-12">{event.nr}</td>
								<td class="py-2 px-3">{event.match}</td>
								<td class="py-2 px-3 whitespace-nowrap">{event.tid}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-center h-full">
			<div class="text-center text-gray-400 p-8 bg-gray-50 rounded-lg">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-12 w-12"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p class="mt-4 text-lg">Välj en omgång i tidslinjen eller listan för att se detaljer.</p>
			</div>
		</div>
	{/if}
</div>