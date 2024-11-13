<script lang="ts">
	import { onMount } from 'svelte';
	import * as Plot from '@observablehq/plot';

	let plotDiv: HTMLDivElement;
	let targetValue = 0.5;
	let numPoints = 1000;
	let points: Array<{ x: number; y: number; max: number; selected: boolean }> = [];
	let approximatedSqrt = 0;
	let actualSqrt = Math.sqrt(targetValue);
	let histogramDiv: HTMLDivElement;

	let tempTargetValue = targetValue;
	let tempNumPoints = numPoints;

	// Convert between linear slider (0-1) and exponential points (100-10000)
	function sliderToPoints(val: number): number {
		return Math.round(Math.pow(10, 2 + val * 2)); // Maps 0-1 to 100-10000
	}

	function pointsToSlider(points: number): number {
		return (Math.log10(points) - 2) / 2; // Maps 100-10000 to 0-1
	}

	function handlePointsInput() {
		numPoints = Math.max(100, Math.min(10000, tempNumPoints));
		tempNumPoints = numPoints;
		generatePoints();
	}

	function handleTargetInput() {
		targetValue = Math.max(0, Math.min(1, tempTargetValue));
		tempTargetValue = targetValue;
		generatePoints();
	}

	function generatePoints() {
		// Generate points in chunks to prevent UI freezing
		const chunkSize = 1000;
		const newPoints = [];

		for (let i = 0; i < numPoints; i += chunkSize) {
			const chunk = Array.from({ length: Math.min(chunkSize, numPoints - i) }, () => {
				const x = Math.random();
				const y = Math.random();
				return {
					x,
					y,
					max: Math.max(x, y)
				};
			});
			newPoints.push(...chunk);
		}

		// Sort points by max value
		newPoints.sort((a, b) => a.max - b.max);

		// Determine selection in a single pass
		const cutoffIndex = Math.floor(newPoints.length * targetValue);
		points = newPoints.map((p, i) => ({
			...p,
			selected: i <= cutoffIndex
		}));

		approximatedSqrt = points[cutoffIndex]?.max || 0;
		actualSqrt = Math.sqrt(targetValue);

		updatePlot();
	}

	function updatePlot() {
		if (!plotDiv || !histogramDiv) return;

		const plotWidth = 600;

		// Create scatter plot
		const scatterPlot = Plot.plot({
			width: plotWidth,
			height: plotWidth,
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
				),
				Plot.line(
					[
						[0, approximatedSqrt],
						[approximatedSqrt, approximatedSqrt],
						[approximatedSqrt, 0]
					],
					{
						stroke: 'red',
						strokeDasharray: '4 4'
					}
				)
			]
		});

		// Create CDF data
		const cdfPoints = points
			.map((p) => p.max)
			.sort((a, b) => a - b)
			.map((max, index) => ({
				x: max,
				y: (index + 1) / points.length
			}));

		// Create CDF plot
		const histogramPlot = Plot.plot({
			width: plotWidth,
			height: plotWidth * 0.4,
			grid: true,
			x: { domain: [0, 1], label: 'x' },
			y: {
				domain: [0, 1],
				label: 'Proportion of points where max(x,y) ≤ x',
				grid: true
			},
			marks: [
				Plot.areaY(
					cdfPoints.filter((p) => p.x <= approximatedSqrt),
					{
						x: 'x',
						y: 'y',
						fill: 'rgba(255, 0, 0, 0.2)'
					}
				),
				Plot.line(cdfPoints, {
					x: 'x',
					y: 'y',
					stroke: 'steelblue',
					strokeWidth: 2
				}),
				Plot.ruleX([actualSqrt], {
					stroke: 'green',
					strokeDasharray: '4 4'
				}),
				Plot.ruleX([approximatedSqrt], {
					stroke: 'red',
					strokeDasharray: '4 4'
				}),
				Plot.ruleY([targetValue], {
					stroke: '#666',
					strokeDasharray: '2 2'
				})
			]
		});

		// Clear and append plots
		plotDiv.innerHTML = '';
		histogramDiv.innerHTML = '';
		plotDiv.appendChild(scatterPlot);
		histogramDiv.appendChild(histogramPlot);
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
		<div class="control-group">
			<label>
				Target value (R²):
				<div class="input-group">
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={targetValue}
						on:change={() => {
							tempTargetValue = targetValue;
							generatePoints();
						}}
					/>
					<input type="number" bind:value={tempTargetValue} min="0" max="1" step="0.01" />
				</div>
			</label>
		</div>

		<div class="control-group">
			<label>
				Number of points:
				<div class="input-group">
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={pointsToSlider(numPoints)}
						on:change={(e) => {
							numPoints = sliderToPoints(parseFloat(e.currentTarget.value));
							tempNumPoints = numPoints;
							generatePoints();
						}}
					/>
					<input type="number" bind:value={tempNumPoints} min="100" max="10000" step="100" />
				</div>
			</label>
		</div>

		<button on:click={generatePoints}>Generate New Points</button>
	</div>

	<div class="plots-container">
		<div class="plots">
			<div class="plot-group">
				<div class="visualization" bind:this={plotDiv}></div>
				<div class="legend">
					<h3>Scatter Plot Legend</h3>
					<div class="legend-item">
						<span class="color-dot" style="background: red; opacity: 0.6"></span>
						<span>Points where max(x,y) ≤ R</span>
					</div>
					<div class="legend-item">
						<span class="color-dot" style="background: blue; opacity: 0.6"></span>
						<span>Points where max(x,y) > R</span>
					</div>
					<div class="legend-item">
						<span class="color-line" style="background: green"></span>
						<span>Actual √(R²)</span>
					</div>
					<div class="legend-item">
						<span class="color-line" style="background: red"></span>
						<span>Approximated √(R²)</span>
					</div>
				</div>
			</div>
			<div class="plot-group">
				<div class="histogram" bind:this={histogramDiv}></div>
				<div class="legend">
					<h3>Distribution Legend</h3>
					<div class="legend-item">
						<span class="color-dot" style="background: steelblue"></span>
						<span>Cumulative proportion of points where max(x,y) ≤ x</span>
					</div>
					<div class="legend-item">
						<div class="color-area"></div>
						<span>Points where max(x,y) ≤ approximated √(R²)</span>
					</div>
					<div class="legend-item">
						<span class="color-line" style="background: green"></span>
						<span>Actual √(R²)</span>
					</div>
					<div class="legend-item">
						<span class="color-line" style="background: red"></span>
						<span>Approximated √(R²)</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="stats">
		<p>Approximated √(R²): {approximatedSqrt.toFixed(4)}</p>
		<p>Actual √(R²): {actualSqrt.toFixed(4)}</p>
		<p>Error: {Math.abs(approximatedSqrt - actualSqrt).toFixed(4)}</p>
	</div>
</main>

<style>
	.container {
		width: 100%;
		margin: 0 auto;
		padding: 20px;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.plots-container {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.plots {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.plot-group {
		display: flex;
		gap: 20px;
		align-items: flex-start;
	}

	.legend {
		background: #f8f9fa;
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #dee2e6;
		min-width: 200px;
	}

	.legend h3 {
		margin: 0 0 15px 0;
		color: #343a40;
		font-size: 0.9rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		font-size: 0.9rem;
	}

	.color-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.color-line {
		width: 20px;
		height: 2px;
		position: relative;
		flex-shrink: 0;
	}

	.color-line::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: inherit;
		border-top: 2px dashed currentColor;
	}

	.color-area {
		width: 20px;
		height: 12px;
		background: rgba(255, 0, 0, 0.2);
		flex-shrink: 0;
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
		gap: 1.5rem;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-group {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	input[type='range'] {
		width: 200px;
	}

	input[type='number'] {
		width: 100px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	button {
		align-self: flex-end;
	}

	.visualization,
	.histogram {
		width: 620px;
		border: 1px solid #ccc;
		padding: 10px;
		display: flex;
		justify-content: center;
	}

	.stats {
		font-family: monospace;
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 4px;
	}
</style>
