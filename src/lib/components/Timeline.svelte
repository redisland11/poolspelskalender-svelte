<script>
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	import { Timeline } from 'vis-timeline/esnext';
	import { DataSet } from 'vis-data/esnext';
	import 'vis-timeline/styles/vis-timeline-graph2d.css';

	export let data = [];

	const dispatch = createEventDispatcher();

	let timelineContainer;
	let timeline;
	const timelineItems = new DataSet([]);

	onMount(() => {
		const options = {
			stack: true,
			stackSubgroups: true,
			zoomable: false,
			editable: false,
			margin: {
				item: 10,
				axis: 5
			},
			start: new Date(),
			end: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
			min: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
			max: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000),

			// === NYA INSTÄLLNINGAR FÖR TIDS-AXELN ===
			timeAxis: {
				scale: 'hour',
				step: 6
			},
			format: {
				minorLabels: {
					hour: 'HH:mm' // Visa "18:00"
				},
				majorLabels: {
					day: 'dddd D/M' // Visa "Torsdag 18/9"
				}
			}
			// ==========================================
		};

		timeline = new Timeline(timelineContainer, timelineItems, options);

		timeline.on('select', (properties) => {
			const selectedId = properties.items[0];
			if (selectedId) {
				const selectedGame = data.find((game) => game.drawNumber === selectedId);
				if (selectedGame) {
					dispatch('select', selectedGame);
				}
			} else {
				dispatch('select', null);
			}
		});

		return () => {
			if (timeline) {
				timeline.destroy();
			}
		};
	});

	$: {
		if (timeline) {
			const formattedItems = data.map((game) => {
				const jackpotHtml = game.isJackpot ? `<img src="/jackpot.png" alt="Jackpot" />` : '';
				const sportHtml = `<img src="/sports/${game.sport}.png" alt="${game.sport}" title="${game.sport}" />`;
				const time = game.spelstopp.substring(11, 16);

				return {
					id: game.drawNumber,
                    className: `${game.spel}`,
					content: `${sportHtml} ${game.spel} ${time} ${jackpotHtml}`,
					start: game.spelstopp,
					style: `background-color: ${game.color}; border-color: ${game.color}; color: white; box-shadow: 2px 2px 5px rgba(0,0,0,0.3); border-radius: 4px; display: flex; align-items: center; font-weight: bold;`
				};
			});

			timelineItems.clear();
			timelineItems.add(formattedItems);
		}
	}
</script>

<div bind:this={timelineContainer} class="timeline-container">
	{#if data.length === 0}
		<div class="no-data-message">
			<p>Inga spel att visa på tidslinjen med valda filter.</p>
		</div>
	{/if}
</div>

<style>
	.timeline-container {
		border: 1px solid #4a5568;
		border-radius: 8px;
		background: #1a202c;
		position: relative;
	}

	.no-data-message {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		text-align: center;
		padding: 1rem;
		background-color: rgba(45, 55, 72, 0.8);
		border-radius: 8px;
	}

	:global(.vis-item-content img) {
		height: 20px !important;
		width: auto !important;
		vertical-align: middle;
		margin: 0 8px;
	}
	
	:global(.vis-item-content) {
		display: flex;
		align-items: center;
	}



	:global(.vis-item.vis-selected) { border: 2px solid #63b3ed !important; box-shadow: 0 0 10px rgba(99, 179, 237, 0.7); }
    :global(.vis-time-axis .vis-grid.vis-odd) { background: #2d3748; }
	:global(.vis-time-axis .vis-text) { color: #e2e8f0; }
	:global(.vis-labelset .vis-label) { color: #e2e8f0; }
    :global(.Stryktipset) {border: 1px solid #00427a;}
    :global(.Europatipset) {border: 1px solid #008733;}
    :global(.Topptipset) {border: 1px solid #f29400;}
    :global(.Powerplay) {border: 1px solid #bb010c;}
    :global(.Bomben) {border: 1px solid #bb010c;}
    :global(.Matchen) {border: 1px solid #cb898d;}
    :global(.Challenge) {border: 1px solid #cb898d;}
	:global(.vis-panel.vis-center, .vis-panel.vis-left, .vis-panel.vis-right, .vis-panel.vis-top, .vis-panel.vis-bottom) { border: none !important; }
</style>