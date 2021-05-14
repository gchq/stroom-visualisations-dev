(function() {
var cssStr = "" +
"@CHARSET \"UTF-8\";" +
"" +
".metric-chart text {" +
"	fill: #565656;" +
"	font-size: 9px;" +
"	font-family: Helvetica, Arial, \"sans serif\";" +
"}" +
"" +
".metric-chart text.no-data {" +
"	font-size: 16px;" +
"	font-weight: 100;" +
"	fill:#d0d0d0;" +
"}" +
"" +
".metric-chart rect.no-data {" +
"	fill: #f5f5f5;" +
"}" +
"" +
"/* When there is data ...*/" +
"" +
"/* CB: padding to display better on bl.ocks.org */" +
"{" +
"	padding: 64px;" +
"}" +
"" +
".metric-chart rect.plot-background{" +
"	fill: white;" +
"}" +
"" +
".metric-chart path.line {" +
"	fill: none;" +
"	stroke: #00AA8D; /* default, changed in each theme */" +
"	stroke-width: 1.5px;" +
"	clip-path: url(#clip);" +
"}" +
"" +
".metric-chart path.area {" +
"	fill: #00AA8D; /* CB default, changed in each theme */" +
"	opacity: 0.6;" +
"	clip-path: url(#clip);" +
"}" +
"" +
".metric-chart .axis {" +
"	shape-rendering: crispEdges;" +
"}" +
"" +
".metric-chart .x.axis .domain{" +
"	display:none;" +
"}" +
"" +
".metric-chart .x.axis line {" +
"	stroke: white;" +
"	opacity: 0.4;" +
"}" +
"" +
".metric-chart .context .x.axis line {" +
"	display: none;" +
"}" +
"" +
".metric-chart .y.axis .domain{" +
"	display: none;" +
"}" +
"" +
".metric-chart .y.axis.title{" +
"	font-size: 13px;" +
"	font-weight: 100;" +
"}" +
"" +
".metric-chart .y.axis line {" +
"	stroke: #565656;" +
"	stroke-dasharray: 2,2;" +
"	stroke-opacity: 0.3;" +
"}" +
"" +
".metric-chart .brush .extent {" +
"  fill: #000;" +
"  fill-opacity: .07;" +
"  shape-rendering: crispEdges;" +
"  clip-path: url(#clip);" +
"}" +
"" +
".metric-chart rect.pane {" +
"	cursor: move;" +
"	fill: none;" +
"	pointer-events: all;" +
"}" +
"/* brush handles  */" +
".metric-chart .resize .handle {" +
"	fill: #555;" +
"}" +
"" +
".metric-chart .resize .handle-mini {" +
"	fill: white;" +
"    stroke-width: 1px;" +
"    stroke: #555;" +
"}" +
"" +
".metric-chart .scale_button {" +
"	cursor: pointer;" +
"}" +
"" +
".metric-chart .scale_button rect {" +
"	fill: #eaeaea;" +
"}" +
".metric-chart .scale_button:hover text {" +
"	fill: #417DD6;" +
"	transition: all 0.1s cubic-bezier(.25,.8,.25,1);" +
"}" +
"" +
".metric-chart text#displayDates  {" +
"	font-weight: bold;" +
"}" +
"" +
".metric-chart .label  {" +
"	font-size: 11px;" +
"}" +
"";
d3.select(document).select("head").insert("style").text(cssStr);
})();
