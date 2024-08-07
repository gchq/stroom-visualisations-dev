(function() {
var cssStr = "" +
"/**" +
" * Vars" +
" */" +
":root {" +
"    --text-color: #000;" +
"    --text-color-disabled: #666;" +
"    --app-background-color: #d50101;" +
"    --vis__background-color: var(--dashboard-panel__background-color);" +
"    --border-color: #c5cde2;" +
"    --input-background-color: #fff;" +
"    --input-border-color: #c5cde2;" +
"    --input-background-color-disabled: #eee;" +
"    --input-border-color-disabled: #ccc;" +
"" +
"    --header-border-color: #dddddd;" +
"    --even-row-background-color: #ebebeb;" +
"    --odd-row-background-color: #fff;" +
"    --hovered-row-background-color: #e6f4ff;" +
"    --selected-row-background-color: #bbdefb;" +
"    --selected-row-text-color: #000;" +
"" +
"    --menu-separator-color: #bfbfbf;" +
"" +
"    --dialog-titlebar-background-image: linear-gradient(rgb(96, 161, 240), rgb(74, 144, 228) 8px);" +
"    --dialog-titlebar-background-color: rgb(74, 144, 228);" +
"    --dialog-titlebar-border-color: rgb(60, 60, 60);" +
"    --dialog-titlebar-text-color: #fff;" +
"    --dialog-background-image: linear-gradient(rgb(248, 250, 253) 21px,	rgb(223, 234, 248) 60px);" +
"    --dialog-background-color: rgb(223, 234, 248);" +
"    --dialog-border-color: rgb(60, 60, 60);" +
"    --dialog-shadow: 0 0 8px rgba(0, 0, 0, .7);" +
"    --popup-shadow: 0 0 5px 0 rgba(0, 0, 0, .5);" +
"" +
"    --main-background-color: #fff;" +
"    --main-border-color: #404e60;" +
"" +
"    --tooltip-background-color: #ffd;" +
"    --tooltip-text-color: #000;" +
"" +
"    --button-background-image: none; /*linear-gradient(#ffffff 0px, #fbfbfa 10px, #f6f5f5 0px, #e9e7e6); */" +
"    --button-background-color: #f6f5f5;" +
"    --button-border-color: #918e8c;" +
"    --button-text-color: #000;" +
"    --button-background-image-active: linear-gradient(#c8c9cb 0px, #c8cacd 10px, #c2c6c8 0px, #b5b7ba);" +
"    --button-background-color-active: #c2c6c8;" +
"    --button-border-color-active: #5b7aa1;" +
"    --button-background-image-hover: linear-gradient(#ffffff 0px, #ffffff 10px, #fafafa 0px, #edeceb);" +
"    --button-background-color-hover: #fafafa;" +
"    --button-border-color-hover: #918e8c;" +
"    --button-text-color-disabled: #888;" +
"    --button-border-color-disabled-hover: #aaa;" +
"" +
"    --expression-item-box-background-color-selected: #bbdefb;" +
"    --expression-item-box-background-color-hover: #f7fbff;" +
"    --expression-item-box-background-color-disabled: #ccc;" +
"    --expression-item-box-background-color-hotspot: rgba(255,0,0,.3);" +
"" +
"    --pipeline-element-box-background-color: #f5f9fd;" +
"    --pipeline-element-box-background-color-hover: #f7fbff;" +
"    --pipeline-element-box-background-color-selected: #bbdefb;" +
"    --pipeline-element-box-background-color-selected-hover: #bbdefb;" +
"    --pipeline-element-box-background-color-hotspot: rgba(255,0,0,.3);" +
"    --pipeline-element-box-text-color: #000;" +
"    --pipeline-element-box-border-color: #918e8c;" +
"" +
"    --link-text-color: #0000AA;" +
"" +
"    --code-editor-right-bar-background-color: #efefef;" +
"    --code-editor-border-color: #a1a1a1;" +
"    --code-editor-info-border-color: #3676c6;" +
"    --code-editor-info-background-color: #378cff;" +
"    --code-editor-warning-border-color: #dd9942;" +
"    --code-editor-warning-background-color: #ffde81;" +
"    --code-editor-error-border-color: #660000;" +
"    --code-editor-error-background-color: #ff3a37;" +
"    --code-editor-fatal-border-color: #444444;" +
"    --code-editor-fatal-background-color: #000000;" +
"    --code-editor-highlight-background-color: yellow;" +
"" +
"    --xsdbrowser-title-background-color: #888;" +
"    --xsdbrowser-title-background-color-selected: rgb(74, 144, 228);" +
"    --xsdbrowser-box-background-color: white;" +
"" +
"    --vis-axis-color: rgba(0,0,0,0.54);" +
"    --vis-text-color: rgba(0,0,0,0.87);" +
"    --vis-text-color-faint: rgba(0,0,0,0.12);" +
"    --vis-icon-color: rgba(0,0,0,0.38);" +
"    --vis-icon-color-hover: rgba(0,0,0,0.87);" +
"    --vis-barchart-element-stroke: #fff;" +
"    --vis-marker-stroke: #000;" +
"    --vis-series-label-background-color: rgba(255,255,255,0.87);" +
"    --vis-tip-background-color: rgba(30, 30, 30, 0.8);" +
"    --vis-tip-text-color: #bbb;" +
"" +
"    --scrollbar-background-color: #fff;" +
"    --scrollbar-corner-background-color: #fff;" +
"    --scrollbar-thumb-border-color: rgba(255,255,255,0);" +
"    --scrollbar-thumb-background-color: rgba(0,0,0,0.3);" +
"    --scrollbar-thumb-background-color-hover: rgba(0,0,0,.5);" +
"    --scrollbar-thumb-background-color-active: rgba(0,0,0,.8);" +
"}" +
"" +
".stroom-theme-dark {" +
"    --text-color: #e6e1dc;" +
"    --text-color-disabled: #666;" +
"    --app-background-color: #000;/*#19171d;*/" +
"    --vis__background-color: var(--dashboard-panel__background-color);" +
"    --border-color: #555;" +
"    --input-background-color: #333;" +
"    --input-border-color: #555;" +
"    --input-background-color-disabled: #222427;" +
"    --input-border-color-disabled: #3c3c3c;" +
"" +
"    --header-border-color: #333;" +
"    --even-row-background-color: #282c31;" +
"    --odd-row-background-color: #1a1d21;" +
"    --hovered-row-background-color: rgb(255 255 255 / 15%);" +
"    --selected-row-background-color: #1164a3;" +
"    --selected-row-text-color: #fff;" +
"" +
"    --menu-separator-color: rgb(255 255 255 / 20%);" +
"" +
"    --dialog-titlebar-background-image: none;" +
"    --dialog-titlebar-background-color: #19171d;" +
"    --dialog-titlebar-border-color: #19171d;" +
"    --dialog-titlebar-text-color: #fff;" +
"    --dialog-background-image: none;" +
"    --dialog-background-color: #1a1d21;" +
"    --dialog-border-color: rgb(132 132 132 / 60%);" +
"    --dialog-shadow: 0 0 5px 2px rgb(0 0 0 / 100%);" +
"    --popup-shadow: 0 0 5px 2px rgb(0 0 0 / 100%);" +
"" +
"    --main-background-color: #19171d;" +
"    --main-border-color: #555;" +
"" +
"    --tooltip-background-color: #3c3f41;" +
"    --tooltip-text-color: #fff;" +
"" +
"    --button-background-image: none;" +
"    --button-background-color: #454545;" +
"    --button-border-color: #555;" +
"    --button-text-color: #fff;" +
"    --button-background-image-active: none;" +
"    --button-background-color-active: #555555;" +
"    --button-border-color-active: #444;" +
"    --button-background-image-hover: none;" +
"    --button-background-color-hover: #505050;" +
"    --button-border-color-hover: #666;" +
"    --button-text-color-disabled: #888;" +
"    --button-border-color-disabled-hover: #000;" +
"" +
"    --expression-item-box-background-color-selected: #454545;" +
"    --expression-item-box-background-color-hover: #555;" +
"    --expression-item-box-background-color-disabled: #333;" +
"    --expression-item-box-background-color-hotspot: rgba(255,0,0,.3);" +
"" +
"    --pipeline-element-box-background-color: #454545;" +
"    --pipeline-element-box-background-color-hover: #505050;" +
"    --pipeline-element-box-background-color-selected: #1164a3;" +
"    --pipeline-element-box-background-color-selected-hover: #1164a3;" +
"    --pipeline-element-box-background-color-hotspot: rgba(255,0,0,.5);" +
"    --pipeline-element-box-text-color: #fff;" +
"    --pipeline-element-box-border-color: #a1a1a1;" +
"" +
"    --link-text-color: #3aaaff;" +
"" +
"    --code-editor-right-bar-background-color: #19171d;" +
"    --code-editor-border-color: #000;" +
"    --code-editor-info-border-color: #3676c6;" +
"    --code-editor-info-background-color: #378cff;" +
"    --code-editor-warning-border-color: #dd9942;" +
"    --code-editor-warning-background-color: #ffde81;" +
"    --code-editor-error-border-color: #660000;" +
"    --code-editor-error-background-color: #ff3a37;" +
"    --code-editor-fatal-border-color: #c5cde2;" +
"    --code-editor-fatal-background-color: #000000;" +
"    --code-editor-highlight-background-color: #1164a3;" +
"" +
"    --xsdbrowser-title-background-color: #555;" +
"    --xsdbrowser-title-background-color-selected: #1164a3;" +
"    --xsdbrowser-box-background-color: #19171d;" +
"" +
"    --vis-axis-color: rgba(255,255,255,0.54);" +
"    --vis-text-color: rgba(255,255,255,0.87);" +
"    --vis-text-color-faint: rgba(255,255,255,0.12);" +
"    --vis-icon-color: rgba(255,255,255,0.38);" +
"    --vis-icon-color-hover: rgba(255,255,255,0.87);" +
"    --vis-barchart-element-stroke: #000;" +
"    --vis-marker-stroke: #fff;" +
"    --vis-series-label-background-color: rgba(0,0,0,0.87);" +
"    --vis-tip-background-color: rgba(30, 30, 30, 0.8);" +
"    --vis-tip-text-color: #bbb;" +
"" +
"    --scrollbar-background-color: #141414;" +
"    --scrollbar-corner-background-color: #141414;" +
"    --scrollbar-thumb-border-color: #141414;" +
"    --scrollbar-thumb-background-color: #5c5c5c;" +
"    --scrollbar-thumb-background-color-hover: #8d8d8d;" +
"    --scrollbar-thumb-background-color-active: #979797;" +
"}" +
"" +
".stroom-theme-dark2 {" +
"    --text-color: #abb0b6;" +
"    --text-color-disabled: #666;" +
"    --app-background-color: #000;" +
"    --vis__background-color: var(--dashboard-panel__background-color);" +
"    --border-color: #14161b;" +
"    --input-background-color: #262a32;" +
"    --input-border-color: #191c21;" +
"    --input-background-color-disabled: #1f2229;" +
"    --input-border-color-disabled: #191c21;" +
"" +
"    --header-border-color: #14161b;" +
"    --even-row-background-color: #15161b;" +
"    --odd-row-background-color: #22252c;" +
"    --hovered-row-background-color: #2d2f35;" +
"    --selected-row-background-color: #3498db;" +
"    --selected-row-text-color: #fff;" +
"" +
"    --menu-separator-color: rgb(255 255 255 / 20%);" +
"" +
"    --dialog-titlebar-background-image: none;" +
"    --dialog-titlebar-background-color: #14161b;" +
"    --dialog-titlebar-border-color: #14161b;" +
"    --dialog-titlebar-text-color: #fff;" +
"    --dialog-background-image: none;" +
"    --dialog-background-color: #1b1d24;" +
"    --dialog-border-color: #15161b;" +
"    --dialog-shadow: 0 0 5px 2px rgb(0 0 0 / 100%);" +
"    --popup-shadow: 0 0 5px 2px rgb(0 0 0 / 100%);" +
"" +
"    --main-background-color: #1b1d24;" +
"    --main-border-color: #15161b;" +
"" +
"    --tooltip-background-color: #1b1d24;" +
"    --tooltip-text-color: #fff;" +
"" +
"    --button-background-image: none;" +
"    --button-background-color: #262a32;" +
"    --button-border-color: #14161b;" +
"    --button-text-color: #f1f8f8;" +
"    --button-background-image-active: none;" +
"    --button-background-color-active: #262a32;" +
"    --button-border-color-active: #444;" +
"    --button-background-image-hover: none;" +
"    --button-background-color-hover: #383d49;" +
"    --button-border-color-hover: #14161b;" +
"    --button-text-color-disabled: #888;" +
"    --button-border-color-disabled-hover: #000;" +
"" +
"    --expression-item-box-background-color-selected: #454545;" +
"    --expression-item-box-background-color-hover: #555;" +
"    --expression-item-box-background-color-disabled: #333;" +
"    --expression-item-box-background-color-hotspot: rgba(255,0,0,.3);" +
"" +
"    --pipeline-element-box-background-color: #454545;" +
"    --pipeline-element-box-background-color-hover: #505050;" +
"    --pipeline-element-box-background-color-selected: #1164a3;" +
"    --pipeline-element-box-background-color-selected-hover: #1164a3;" +
"    --pipeline-element-box-background-color-hotspot: rgba(255,0,0,.5);" +
"    --pipeline-element-box-text-color: #fff;" +
"" +
"    --link-text-color: #3aaaff;" +
"" +
"    --code-editor-right-bar-background-color: #19171d;" +
"    --code-editor-border-color: #000;" +
"    --code-editor-info-border-color: #3676c6;" +
"    --code-editor-info-background-color: #378cff;" +
"    --code-editor-warning-border-color: #dd9942;" +
"    --code-editor-warning-background-color: #ffde81;" +
"    --code-editor-error-border-color: #660000;" +
"    --code-editor-error-background-color: #ff3a37;" +
"    --code-editor-fatal-border-color: #c5cde2;" +
"    --code-editor-fatal-background-color: #000000;" +
"    --code-editor-highlight-background-color: #1164a3;" +
"" +
"    --xsdbrowser-title-background-color: #555;" +
"    --xsdbrowser-title-background-color-selected: #1164a3;" +
"    --xsdbrowser-box-background-color: #19171d;" +
"" +
"    --vis-axis-color: rgba(255,255,255,0.54);" +
"    --vis-text-color: rgba(255,255,255,0.87);" +
"    --vis-text-color-faint: rgba(255,255,255,0.12);" +
"    --vis-icon-color: rgba(255,255,255,0.38);" +
"    --vis-icon-color-hover: rgba(255,255,255,0.87);" +
"    --vis-barchart-element-stroke: #000;" +
"    --vis-marker-stroke: #fff;" +
"    --vis-series-label-background-color: rgba(0,0,0,0.87);" +
"    --vis-tip-background-color: rgba(30, 30, 30, 0.8);" +
"    --vis-tip-text-color: #bbb;" +
"" +
"    --scrollbar-background-color: #22252c;" +
"    --scrollbar-corner-background-color: #22252c;" +
"    --scrollbar-thumb-border-color: #22252c;" +
"    --scrollbar-thumb-background-color: #5c5c5c;" +
"    --scrollbar-thumb-background-color-hover: #8d8d8d;" +
"    --scrollbar-thumb-background-color-active: #979797;" +
"}" +
"" +
".stroom-theme-dark .stroom-body {" +
"	background-color: var(--app-background-color) !important;" +
"}" +
"" +
"/**" +
" * Transitions for theme colours." +
" */" +
".stroom-theme-transitions body {" +
"    transition: color 3s linear;" +
"	-webkit-transition: color 3s linear;" +
"	-moz-transition: color 3s linear;" +
"	-o-transition: color 3s linear;" +
"}" +
"" +
".stroom-theme-transitions .stroom-content, .stroom-theme-transitions input {" +
"    transition: background-color 3s linear;" +
"	-webkit-transition: background-color 3s linear;" +
"	-moz-transition: background-color 3s linear;" +
"	-o-transition: background-color 3s linear;" +
"}" +
"" +
".stroom-theme-transitions .gwt-TabLayoutPanel .gwt-TabLayoutPanelContent {" +
"    transition: background-color 3s linear;" +
"	-webkit-transition: background-color 3s linear;" +
"	-moz-transition: background-color 3s linear;" +
"	-o-transition: background-color 3s linear;" +
"}" +
"" +
".stroom-theme-transitions .stroom-border {" +
"	transition: border-color 3s linear;" +
"	-webkit-transition: border-color 3s linear;" +
"	-moz-transition: border-color 3s linear;" +
"	-o-transition: border-color 3s linear;" +
"}" +"";
d3.select(document).select("head").insert("style").text(cssStr);
})();
