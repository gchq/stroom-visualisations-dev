(function() {
var cssStr = "" +
"@CHARSET \"UTF-8\";" +
"" +
":root {" +
"  --metric-chart-text-color: #565656;" +
"  --metric-chart-no-data-color: #f5f5f5;" +
"  --metric-chart-plot-background-color: white;" +
"  --metric-chart-line-color: #00AA8D;" +
"  --metric-chart-area-color: #00AA8D;" +
"  --metric-chart-x-axis-line-color: white;" +
"  --metric-chart-y-axis-line-color: #565656;" +
"  --metric-chart-brush-handle-fill-color: #555;" +
"  --metric-chart-brush-handle-mini-fill-color: white;" +
"  --metric-chart-brush-handle-mini-stroke-color: #555;" +
"  --metric-chart-brush-extent-fill-color: #000;" +
"}" +
"" +
".stroom-theme-dark {" +
"  --metric-chart-text-color: #e6e1dc;" +
"  --metric-chart-no-data-color: #f5f5f5;" +
"  --metric-chart-plot-background-color: white;" +
"  --metric-chart-line-color: #00AA8D;" +
"  --metric-chart-area-color: #00AA8D;" +
"  --metric-chart-x-axis-line-color: white;" +
"  --metric-chart-y-axis-line-color: #565656;" +
"  --metric-chart-brush-handle-fill-color: #555;" +
"  --metric-chart-brush-handle-mini-fill-color: #e6e1dc;" +
"  --metric-chart-brush-handle-mini-stroke-color: #555;" +
"  --metric-chart-brush-extent-fill-color: #fff;" +
"}" +
"" +
".metric-chart text {" +
"  fill: var(--metric-chart-text-color);" +
"  font-size: 9px;" +
"  font-family: Helvetica, Arial, \"sans serif\";" +
"}" +
"  " +
".metric-chart text.no-data {" +
"  font-size: 16px;" +
"  font-weight: 100;" +
"  fill: #d0d0d0;" +
"}" +
"  " +
".metric-chart rect.no-data {" +
"  fill: var(--metric-chart-no-data-color);" +
"}" +
"" +
".metric-chart rect.plot-background{" +
"  fill: var(--metric-chart-plot-background-color);" +
"}" +
"  " +
".metric-chart path.line {" +
"  fill: none;" +
"  stroke: var(--metric-chart-line-color); /* default, changed in each theme */" +
"  stroke-width: 1.5px;" +
"  clip-path: url(#clip);" +
"}" +
"  " +
".metric-chart path.area {" +
"  fill: var(--metric-chart-area-color); /* CB default, changed in each theme */" +
"  opacity: 0.6;" +
"  clip-path: url(#clip);" +
"}" +
"  " +
".metric-chart .axis {" +
"  shape-rendering: crispEdges;" +
"}" +
"  " +
".metric-chart .x.axis .domain{" +
"  display:none;" +
"}" +
"  " +
".metric-chart .x.axis line {" +
"  stroke: var(--metric-chart-x-axis-line-color);" +
"  opacity: 0.4;" +
"}" +
"  " +
".metric-chart .context .x.axis line {" +
"  display: none;" +
"}" +
"  " +
".metric-chart .y.axis .domain{" +
"  display: none;" +
"}" +
"  " +
".metric-chart .y.axis.title{" +
"  font-size: 13px;" +
"  font-weight: 100;" +
"}" +
"  " +
".metric-chart .y.axis line {" +
"  stroke: var(--metric-chart-y-axis-line-color);" +
"  stroke-dasharray: 2,2;" +
"  stroke-opacity: 0.3;" +
"}" +
"  " +
".metric-chart .brush .extent {" +
"  fill: var(--metric-chart-brush-extent-fill-color);" +
"  fill-opacity: .07;" +
"  shape-rendering: crispEdges;" +
"  clip-path: url(#clip);" +
"}" +
"  " +
".metric-chart rect.pane {" +
"  cursor: move;" +
"  fill: none;" +
"  pointer-events: all;" +
"}" +
"" +
"/* brush handles  */" +
".metric-chart .resize .handle {" +
"  fill: var(--metric-chart-brush-handle-fill-color);" +
"}" +
"  " +
".metric-chart .resize .handle-mini {" +
"  fill: var(--metric-chart-brush-handle-mini-fill-color);" +
"  stroke-width: 1px;" +
"  stroke: var(--metric-chart-brush-handle-mini-stroke-color);" +
"}" +
"  " +
".metric-chart .scale_button {" +
"  cursor: pointer;" +
"}" +
"  " +
".metric-chart .scale_button rect {" +
"  fill: #eaeaea;" +
"}" +
".metric-chart .scale_button:hover text {" +
"  fill: #417DD6;" +
"  transition: all 0.1s cubic-bezier(.25,.8,.25,1);" +
"}" +
"  " +
".metric-chart text#displayDates  {" +
"  font-weight: bold;" +
"}" +
"  " +
".metric-chart .label  {" +
"  font-size: 11px;" +
"}" +
"";
d3.select(document).select("head").insert("style").text(cssStr);
})();
