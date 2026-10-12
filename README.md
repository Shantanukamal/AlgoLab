# AlgoLab — Interactive DSA Visualizer

AlgoLab is a browser-based learning project for exploring classic pathfinding and sorting algorithms. It uses **vanilla HTML, CSS, and JavaScript**—no build step, framework, backend, or package installation required.

## Run locally

1. Keep `index.html`, `style.css`, `script.js`, and `sorting.js` in the same folder.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox, or Safari).
3. For local development, you may also serve the folder with any static file server. No server is required for normal use.

## Pathfinding Studio

- Choose BFS, DFS, Dijkstra, or A* and select an animation speed.
- Click or drag across grid cells to toggle walls. Keyboard users can focus a cell and press **Enter** or **Space**.
- **Visualize** animates the search and resulting path.
- **Generate Maze** creates random walls while preserving a clear corridor around the start/target row.
- **Clear Walls** removes obstacles and clears previous search paint.
- **Compare All** runs each algorithm against the same current grid and reports explored cells, path length, elapsed search time, and whether a path exists.

### Pathfinding notes

The grid is unweighted and uses four-directional movement. BFS finds a shortest path in this setting. Dijkstra uses a unit edge cost; A* uses Manhattan distance, which is admissible for four-directional movement with unit costs. DFS can find a route but does not guarantee the shortest route. “Nodes explored” is the number of nodes processed by the search. Path length is the number of moves from start to target; when start and target are the same, the length is zero. An unreachable target is shown as “No path exists” with no path length.

## Sorting Studio

- Choose Bubble, Selection, Insertion, or Merge Sort.
- Use **New Array** to reset the visualization with a new random array.
- **Sort Array** plays back recorded states and ends with the sorted array.
- Counters count key comparisons and array writes/swaps: swaps count as two writes; Merge Sort counts each assignment into the main array as one write. The exact number of displayed frames may be reduced at fast speed to keep playback responsive, but the final operation totals come from the complete algorithm run.

| Algorithm | Best time | Average time | Worst time | Auxiliary space | Stable | In-place |
|---|---:|---:|---:|---:|---|---|
| Bubble Sort (early exit) | O(n) | O(n²) | O(n²) | O(1) | Yes | Yes |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | No | Yes |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | Yes | Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes | No |

## Accessibility and compatibility

Controls use native buttons and selects, visible keyboard focus, live status announcements, and keyboard wall toggling. The layout adapts to smaller screens and respects reduced-motion preferences. A recent browser with support for modern JavaScript features is recommended.

## Files

- `index.html` — semantic page structure and controls
- `style.css` — dark theme, grid/bar visuals, responsive layout, focus and reduced-motion styling
- `script.js` — pathfinding algorithms, grid interaction, animation lifecycle, and comparison table
- `sorting.js` — sorting algorithms, operation counters, recorded playback, and complexity profiles

## Testing status

The source can be syntax-checked with `node --check script.js` and `node --check sorting.js`. Interactive behavior should additionally be checked in a browser, including unreachable mazes, start-equals-target logic (currently the start and target positions are fixed in the UI), repeated runs, keyboard wall toggling, and all sorting choices. Browser automation was not available during packaging, so this README does not claim a full end-to-end browser test.

## Cancelling playback

Press **Escape** during either pathfinding or sorting playback to stop the current animation and restore the controls. The underlying algorithm run may already have computed its result, but stale playback is prevented from continuing.
