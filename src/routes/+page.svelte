<script lang="ts">
	import { onMount } from 'svelte';
	import * as Plot from '@observablehq/plot';

	let plotDiv: HTMLDivElement;
	let targetValue = 0.5;
	let numPoints = 1000;
	let points: Array<{ x: number; y: number; max: number; selected: boolean }> = [];
	let approximatedSqrt = 0;
	let actualSqrt = Math.sqrt(targetValue);

	function generatePoints() {
		// Generate random points
		points = Array.from({ length: numPoints }, () => {
			const x = Math.random();
			const y = Math.random();
			return {
				x,
				y,
				max: Math.max(x, y),
				selected: false
			};
		});

		// Sort points by max value and determine selection
		points.sort((a, b) => a.max - b.max);
		const cutoffIndex = Math.floor(points.length * Math.sqrt(targetValue));
		points = points.map((p, i) => ({
			...p,
			selected: i <= cutoffIndex
		}));

		approximatedSqrt = points[cutoffIndex]?.max || 0;
		actualSqrt = Math.sqrt(targetValue);

		updatePlot();
	}

	function updatePlot() {
		if (!plotDiv) return;

		const plot = Plot.plot({
			width: 600,
			height: 600,
			grid: true,
			x: { domain: [0, 1] },
			y: { domain: [0, 1] },
			marks: [
				Plot.dot(points, {
					x: 'x',
					y: 'y',
					fill: (d) => (d.selected ? 'red' : 'blue'),
					opacity: 0.6,
					r: 3
				}),
				Plot.line(
					[
						[0, actualSqrt],
						[actualSqrt, actualSqrt],
						[actualSqrt, 0]
					],
					{
						stroke: 'green',
						strokeDasharray: '4 4'
					}
				)
			]
		});

		plotDiv.innerHTML = '';
		plotDiv.appendChild(plot);
	}

	$: {
		actualSqrt = Math.sqrt(targetValue);
		if (points.length > 0) {
			generatePoints();
		}
	}

	onMount(() => {
		generatePoints();
	});
</script>

<main class="container">
	<header class="intro">
		<h1>Random Number Square Root Approximation</h1>

		<div class="explanation">
			<p>
				This visualization demonstrates how we can approximate square roots using random numbers,
				based on an interesting probability relationship explained in
				<a href="https://youtu.be/Pny70rNPJLk" target="_blank" rel="noopener">3Blue1Brown's video</a
				>.
			</p>

			<p>
				The key insight is that P(max(x₁, x₂) ≤ R) = P(√(rand(0,1)) ≤ R) = P(rand(0,1) ≤ R²) = R².
				Therefore, if we generate many random point pairs and take the lower R² portion of them, the
				maximum values of these pairs will approximate √(R²).
			</p>
		</div>
	</header>

	<div class="controls">
		<label>
			Target value (R²):
			<input type="number" bind:value={targetValue} min="0" max="1" step="0.01" />
		</label>

		<label>
			Number of points:
			<input type="number" bind:value={numPoints} min="100" max="10000" step="100" />
		</label>

		<button on:click={generatePoints}> Generate New Points </button>
	</div>

	<div class="visualization" bind:this={plotDiv}></div>

	<div class="stats">
		<p>Approximated √(R²): {approximatedSqrt.toFixed(4)}</p>
		<p>Actual √(R²): {actualSqrt.toFixed(4)}</p>
		<p>Error: {Math.abs(approximatedSqrt - actualSqrt).toFixed(4)}</p>
	</div>
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.intro {
		text-align: center;
		margin-bottom: 2rem;
	}

	h1 {
		color: #2c3e50;
		margin-bottom: 1.5rem;
	}

	.explanation {
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.6;
		color: #34495e;
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.explanation p {
		margin: 0.8rem 0;
	}

	.explanation a {
		color: #3498db;
		text-decoration: none;
	}

	.explanation a:hover {
		text-decoration: underline;
	}

	.controls {
		margin: 20px 0;
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.visualization {
		border: 1px solid #ccc;
		margin: 20px 0;
		padding: 10px;
	}

	input {
		width: 100px;
		margin: 0 10px;
	}

	button {
		padding: 8px 16px;
		background: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	button:hover {
		background: #45a049;
	}

	.stats {
		font-family: monospace;
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 4px;
	}
</style>
