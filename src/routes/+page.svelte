<script>
	import { onMount } from 'svelte';
	import { fetchAllGames, fetchGameDetails } from '$lib/api.js';

	// Importera dina UI-komponenter
	import Filters from '$lib/components/Filters.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import GamesList from '$lib/components/GamesList.svelte';
	import GameDetails from '$lib/components/GameDetails.svelte';

	// --- STATE MANAGEMENT ---
	// Här lagrar vi all data som appen behöver.
	// När dessa variabler ändras, uppdateras gränssnittet automatiskt.

	let allGames = []; // Hela listan med spel från API:et
	let filteredGames = []; // Listan som visas efter filtrering
	let isLoading = true; // För att visa en laddningsindikator i början

	// State för detaljvyn
	let selectedGameDetails = null; // Håller information om det valda spelet
	let isDetailsLoading = false; // Laddningsindikator för detaljvyn

	// --- FILTER-VARIABLER ---
	// Dessa håller de aktuella värdena från filter-komponenten.
	let selectedGameTypes = ['stryktipset', 'europatipset', 'topptipsetfamily', 'powerplay', 'bomben', 'matchen', 'challenge']; // Startvärden
	let onlyJackpot = false;
	let timeSpanHours = null; // null = alla, annars 3 eller 24
	let turnoverRange = { min: 10000, max: 100000000 }; // Startvärden

	// --- DATA HÄMTNING ---
	// `onMount` körs en gång när komponenten först renderas i webbläsaren.
	onMount(async () => {
		allGames = await fetchAllGames(Object.keys(spelInfoMap)); // Hämta alla möjliga spel för bästa filtrering
		isLoading = false;
	});

	// --- REAKTIVITET (APPENS HJÄRNA) ---
	// `$:`-blocket körs om automatiskt VARJE gång en variabel inuti det ändras.
	// Detta ersätter helt behovet av `observeEvent` och `reactive()` från Shiny.
	$: {
		if (!isLoading) {
			const now = new Date();

			filteredGames = allGames
				.filter((game) => selectedGameTypes.includes(game.spelURL))
				.filter((game) => (onlyJackpot ? game.isJackpot : true))
				.filter((game) => game.omsattningNum >= turnoverRange.min && game.omsattningNum <= turnoverRange.max)
				.filter((game) => {
					if (!timeSpanHours) return true; // Om null, visa alla
					const gameTime = new Date(game.spelstopp);
					const hoursDiff = (gameTime - now) / (1000 * 60 * 60);
					return hoursDiff > 0 && hoursDiff <= timeSpanHours;
				});
		}
	}

	// --- EVENT HANDLERS ---
	// Dessa funktioner anropas när barn-komponenterna skickar "events".

	/**
	 * Tar emot nya filtervärden från Filters.svelte och uppdaterar state.
	 * Detta kommer automatiskt att trigga det reaktiva `$: `-blocket ovan.
	 */
	function handleFilterChange(event) {
		const newFilters = event.detail;
		selectedGameTypes = newFilters.selectedGameTypes;
		onlyJackpot = newFilters.onlyJackpot;
		timeSpanHours = newFilters.timeSpanHours;
		turnoverRange = newFilters.turnoverRange;
	}

	/**
	 * Tar emot ett valt spel från Timeline.svelte eller GamesList.svelte.
	 * Hämtar detaljerad information och skickar ner den till GameDetails.svelte.
	 */
	async function handleGameSelect(event) {
		const selectedGame = event.detail;

		if (!selectedGame) {
			selectedGameDetails = null;
			return;
		}

		isDetailsLoading = true;
		selectedGameDetails = await fetchGameDetails(selectedGame);
		isDetailsLoading = false;
	}

    // Dummy-data för spelInfoMap tills vi flyttar det till en central plats
    // Detta behövs för att onMount ska kunna hämta alla spel
    const spelInfoMap = {
        "bomben": {}, "challenge": {}, "europatipset": {}, "fulltraff": {}, "matchen": {},
        "maltipset": {}, "powerplay": {}, "stryktipset": {}, "topptipsetfamily": {},
        "big9": {}, "DD": {}, "V4": {}, "V5": {}, "V64": {}, "V65": {}, "V75": {}, "V86": {}
    };

</script>

<div class="min-h-screen bg-gray-600 bg-[url('/45-degree-fabric-dark.png')] text-gray-800">
	<header class="bg-[#a00813] bg-[url('/45-degree-fabric-dark.png')] text-white text-center py-4 shadow-lg">
		<h1 class="text-6xl font-['Permanent_Marker'] select-none">
			<button
				type="button"
				on:click={() => window.location.reload()}
				class="bg-transparent border-none p-0 m-0 text-white font-['Permanent_Marker'] cursor-pointer"
			>
				Poolspelskalender
			</button>
		</h1>
	</header>

	<main class="max-w-7xl mx-auto p-4">
		<Filters
			on:change={handleFilterChange}
			initialValues={{ selectedGameTypes, onlyJackpot, timeSpanHours, turnoverRange }}
		/>

		{#if isLoading}
			<div class="text-white text-center text-2xl p-10">Laddar spel...</div>
		{:else}
			<div class="mt-4">
				<Timeline data={filteredGames} on:select={handleGameSelect} />
			</div>

			<div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div class="bg-white/90 p-4 rounded-lg shadow-md">
					<h2 class="text-2xl font-bold mb-3">Lista över valda spel</h2>
					<GamesList data={filteredGames} on:select={handleGameSelect} />
				</div>

				<div class="bg-white/90 p-4 rounded-lg shadow-md">
					<h2 class="text-2xl font-bold mb-3">Info om vald omgång</h2>
					<GameDetails details={selectedGameDetails} isLoading={isDetailsLoading} />
				</div>
			</div>
		{/if}
	</main>
</div>