<script>
	import { createEventDispatcher, onMount } from 'svelte';

	/**
	 * Tar emot startvärden från förälder-komponenten.
	 */
	export let initialValues = {};

	// --- LOKAL STATE ---
	// Dessa variabler håller de aktuella värdena för varje filter-kontroll.
	let selectedGameTypes = ['stryktipset', 'europatipset', 'topptipsetfamily', 'powerplay', 'bomben', 'matchen', 'challenge']; // Alla valda som default
	let onlyJackpot = false;
	let timeSpanHours = null;
	let turnoverRange = { min: 10000, max: 100000000 };

	// När komponenten laddas, sätt state baserat på startvärdena från föräldern.
	onMount(() => {
		selectedGameTypes = initialValues.selectedGameTypes || [];
		onlyJackpot = initialValues.onlyJackpot || false;
		timeSpanHours = initialValues.timeSpanHours || null;
		turnoverRange = initialValues.turnoverRange || { min: 0, max: 100000000 };
	});


	const dispatch = createEventDispatcher();

	/**
	 * Skickar ett event till förälder-komponenten med alla nuvarande filtervärden.
	 */
	function notifyParent() {
		dispatch('change', {
			selectedGameTypes,
			onlyJackpot,
			timeSpanHours,
			turnoverRange
		});
	}

    // $: reaktivt block som automatiskt anropar notifyParent() när något filter ändras.
    $: if (selectedGameTypes || onlyJackpot || timeSpanHours || turnoverRange) {
        notifyParent();
    }


	// --- DATA FÖR FILTREN ---
	// Motsvarar din 'spelInfo' data.frame
	const svsGames = [
		{ id: 'stryktipset', name: 'Stryktipset' },
		{ id: 'europatipset', name: 'Europatipset' },
		{ id: 'topptipsetfamily', name: 'Topptipset' },
		{ id: 'powerplay', name: 'Powerplay' },
		{ id: 'challenge', name: 'Challenge' },
		{ id: 'bomben', name: 'Bomben' },
        { id: 'matchen', name: 'Matchen' },
		{ id: 'maltipset', name: 'Måltipset' }
	];

	const atgGames = [
		{ id: 'V75', name: 'V75' },
		{ id: 'V86', name: 'V86' },
		{ id: 'V64', name: 'V64' },
		{ id: 'big9', name: 'Big9' },
		{ id: 'V65', name: 'V65' },
		{ id: 'V5', name: 'V5' },
		{ id: 'V4', name: 'V4' },
		{ id: 'DD', name: 'DD' }
	];

	// Motsvarar dina val för 'visaOms'
	const turnoverOptions = [
		{ label: '0', value: 0 },
		{ label: '1K', value: 1000 },
		{ label: '10K', value: 10000 },
		{ label: '100K', value: 100000 },
		{ label: '1M', value: 1000000 },
		{ label: '10M', value: 10000000 },
		{ label: '100M', value: 100000000 }
	];
</script>

<details class="bg-gray-800/50 text-white rounded-lg shadow-md open:ring-2 open:ring-blue-400">
	<summary class="cursor-pointer p-4 text-xl font-bold list-none">
		Välj vilka spel som ska visas
	</summary>

	<div class="p-4 border-t border-gray-600 grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="space-y-4">
			<h3 class="font-bold text-lg border-b border-gray-500 pb-1">Välj spel</h3>
			
            <div>
                <h4 class="font-semibold mb-2">Svenska Spel</h4>
                <div class="grid grid-cols-2 gap-2">
                    {#each svsGames as game (game.id)}
                        <label class="flex items-center space-x-2 cursor-pointer hover:text-blue-300">
                            <input type="checkbox" bind:group={selectedGameTypes} value={game.id} class="form-checkbox bg-gray-700 border-gray-500 rounded text-blue-500 focus:ring-blue-500" />
                            <span>{game.name}</span>
                        </label>
                    {/each}
                </div>
            </div>

            <div>
                <h4 class="font-semibold mb-2">ATG</h4>
                <div class="grid grid-cols-2 gap-2">
                    {#each atgGames as game (game.id)}
                        <label class="flex items-center space-x-2 cursor-pointer hover:text-blue-300">
                            <input type="checkbox" bind:group={selectedGameTypes} value={game.id} class="form-checkbox bg-gray-700 border-gray-500 rounded text-blue-500 focus:ring-blue-500" />
                            <span>{game.name}</span>
                        </label>
                    {/each}
                </div>
            </div>
		</div>

		<div class="space-y-4">
			<h3 class="font-bold text-lg border-b border-gray-500 pb-1">Filter</h3>
			
            <div>
                <h4 class="font-semibold mb-2">Välj tidsspann</h4>
                <div class="flex flex-col space-y-1">
                    <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" bind:group={timeSpanHours} value={null} class="form-radio bg-gray-700 text-blue-500 border-gray-500 focus:ring-blue-500" /> <span>Alla spel</span></label>
                    <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" bind:group={timeSpanHours} value={24} class="form-radio bg-gray-700 text-blue-500 border-gray-500 focus:ring-blue-500" /> <span>Kommande 24 timmar</span></label>
                    <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" bind:group={timeSpanHours} value={3} class="form-radio bg-gray-700 text-blue-500 border-gray-500 focus:ring-blue-500" /> <span>Kommande 3 timmar</span></label>
                </div>
            </div>
            
            <div>
                <h4 class="font-semibold mb-2">Välj omsättning</h4>
                <div class="flex items-center space-x-2">
                    <select bind:value={turnoverRange.min} class="form-select bg-gray-700 border-gray-500 rounded-md w-full focus:ring-blue-500 focus:border-blue-500">
                        {#each turnoverOptions as opt}
                            <option value={opt.value}>{opt.label}</option>
                        {/each}
                    </select>
                    <span>till</span>
                    <select bind:value={turnoverRange.max} class="form-select bg-gray-700 border-gray-500 rounded-md w-full focus:ring-blue-500 focus:border-blue-500">
                        {#each turnoverOptions as opt}
                            <option value={opt.value}>{opt.label}</option>
                        {/each}
                    </select>
                </div>
            </div>

		</div>

		<div class="space-y-4">
            <h3 class="font-bold text-lg border-b border-gray-500 pb-1">Övrigt</h3>
            
            <div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" bind:checked={onlyJackpot} class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    <span class="ml-3 font-medium">Visa enbart Jackpot</span>
                </label>
            </div>
		</div>
	</div>
</details>