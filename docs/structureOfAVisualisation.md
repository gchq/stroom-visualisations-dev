# Structure of a Visualisation

Most visualisations extend `Chart` (`src/shared/chart.js`), which does what they share: the grid
of charts (one for each Grid Series value), the legend and Stroom's toolbar, the dashboard's
colours and the selection. A visualisation gives it a cell, which draws one chart of the grid, and
works out in `redraw()` what each cell shows.

```javascript
import "../../shared/shared.css";
import "./MyChart.css";
import { select } from "d3";
import { Chart } from "../../shared/chart.js";
import { keyOf } from "../../shared/data.js";

class MyChart extends Chart {

    constructor() {
        // How a cell is made, and the setting that names the series field
        super((body, chart) => new MyChartCell(body, chart), "series");
    }

    // Called when the data, the settings, the theme or the legend change: works out what each
    // cell shows and gives the cells to the grid, which makes, draws and removes them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const gridCells = this.data.values.filter(cell => Array.isArray(cell.values));
        this.grid.update(gridCells.map(cell => ({
            key: keyOf(cell),
            label: this.seriesLabel(cell.key) || "Chart",
            rows: cell.values,
            gridCellCount: gridCells.length
        })));
    }
}

// The chart in one cell of the grid
class MyChartCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-my-chart");
        // The chart's points: reachable from the keyboard, with tooltips on Stroom's page
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-my-chart__point",
                tooltip: element => ({ title: element.__data__[0], rows: [["Value", element.__data__[1]]] }),
                select: (element, event) => chart.selection.choose({ key: element.__data__[0] }, event),
                summary: () => this.summary
            })
            : null;
    }

    // Draws the cell (again whenever it changes, or is resized)
    draw(cell) {
        // ... draw cell.rows into this.svg, each point with the class vis-my-chart__point
        this.summary = "My chart of " + cell.rows.length + " values";
        if (this.points) {
            this.points.refresh();
        }
    }

    // Shows what is selected or highlighted
    showHighlight() {
    }

    destroy() {
        if (this.points) {
            this.points.destroy();
        }
        this.chart.cells.delete(this);
        this.svg.remove();
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.MyChart = MyChart;
```

Charts of the same kind share more: e.g. `heatMap.js` (the heat maps), `statusChart.js` (Gauge,
RAGStatus, TrafficLights), `timeline.js` (the sessions), `mapChart.js` (the maps),
`networkChart.js` (Force, Force 2D and Force 3D) and `canvasNetwork.js` (Force 2D and Force 3D).
BarChart is a good one to start from for a chart of series.
