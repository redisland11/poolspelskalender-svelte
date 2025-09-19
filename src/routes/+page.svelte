<script>
	import { onMount } from 'svelte';
	import { fetchAllGames } from '$lib/api.js'; // `fetchGameDetails` behövs inte här längre

	// Importera dina UI-komponenter
	import Filters from '$lib/components/Filters.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import GamesList from '$lib/components/GamesList.svelte';
	import GameDetails from '$lib/components/GameDetails.svelte';

	let allGames = [];
	let filteredGames = [];
	let isLoading = true;

	let selectedGameDetails = null;
	let isDetailsLoading = false;

	// === NY KOD: State för globala notiser ===
	let scheduledNotifications = new Set();
	// ==========================================

	let selectedGameTypes = ['stryktipset', 'europatipset', 'topptipsetfamily', 'powerplay', 'bomben', 'matchen', 'challenge']; // Alla valda som default
	let onlyJackpot = false;
	let timeSpanHours = null;
	let turnoverRange = { min: 10000, max: 100000000 };

	onMount(async () => {
		// Ladda både spelen och status för notiser samtidigt
		const [gamesData, notificationStatus] = await Promise.all([
			fetchAllGames(Object.keys(spelInfoMap)),
			fetch('/api/notification-status').then((res) => res.json())
		]);

		allGames = gamesData;

		if (notificationStatus.success) {
			scheduledNotifications = new Set(notificationStatus.scheduledIds);
		}

		isLoading = false;
	});

	$: {
		if (!isLoading) {
			const now = new Date();
			filteredGames = allGames
				.filter((game) => selectedGameTypes.includes(game.spelURL))
				.filter((game) => (onlyJackpot ? game.isJackpot : true))
				.filter((game) => game.omsattningNum >= turnoverRange.min && game.omsattningNum <= turnoverRange.max)
				.filter((game) => {
					if (!timeSpanHours) return true;
					const gameTime = new Date(game.spelstopp);
					const hoursDiff = (gameTime - now) / (1000 * 60 * 60);
					return hoursDiff > 0 && hoursDiff <= timeSpanHours;
				});
		}
	}

	function handleFilterChange(event) {
		const newFilters = event.detail;
		selectedGameTypes = newFilters.selectedGameTypes;
		onlyJackpot = newFilters.onlyJackpot;
		timeSpanHours = newFilters.timeSpanHours;
		turnoverRange = newFilters.turnoverRange;
	}

	async function handleGameSelect(event) {
		selectedGameDetails = event.detail;
	}

	// === NY KOD: Funktion för att uppdatera notislistan ===
	function handleNotificationScheduled(event) {
		const drawNumber = event.detail;
		scheduledNotifications.add(drawNumber);
		scheduledNotifications = scheduledNotifications; // Tvinga Svelte att uppdatera
	}
	// ======================================================

    const spelInfoMap = {
        "bomben": {}, "challenge": {}, "europatipset": {}, "fulltraff": {}, "matchen": {},
        "maltipset": {}, "powerplay": {}, "stryktipset": {}, "topptipsetfamily": {},
        "big9": {}, "DD": {}, "V4": {}, "V5": {}, "V64": {}, "V65": {}, "V75": {}, "V86": {}
    };
</script>

<GamesList 
    data={filteredGames} 
    on:select={handleGameSelect}
    bind:scheduledNotifications={scheduledNotifications} on:notificationScheduled={handleNotificationScheduled} />

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