/*
 * Copyright 2016 Crown Copyright
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//TODO requires d3.layout.cloud

//TODO Needs adding into TestVis.js, including in TestData.js, integrating with the latest version of
//Common.js and GenericGrid.js

/*
 *  * Visualisation to display a datapoint and some text
 *   * Data is expected in the form of...
 *    * 
 *     */


if (!visualisations) {
    var visualisations = {};
}
visualisations.WordCloud = function() {
    var element = window.document.createElement("div");
    this.element = element;

    var d3 = window.d3;
    var svg = d3.select(element).append("svg:svg");
    var fill = d3.scale.category20();
    var sizes = d3.scale.pow().range([10,200]);
    
    var cloud;
    
    var stopWordsArr = [
{name: "a"},
{name: "about"},
{name: "after"},
{name: "against"},
{name: "all"},
{name: "also"},
{name: "although"},
{name: "among"},
{name: "an"},
{name: "and"},
{name: "are"},
{name: "as"},
{name: "at"},
{name: "be"},
{name: "became"},
{name: "because"},
{name: "been"},
{name: "between"},
{name: "but"},
{name: "by"},
{name: "can"},
{name: "come"},
{name: "did"},
{name: "do"},
{name: "does"},
{name: "during"},
{name: "each"},
{name: "early"},
{name: "for"},
{name: "form"},
{name: "found"},
{name: "from"},
{name: "had"},
{name: "has"},
{name: "have"},
{name: "he"},
{name: "her"},
{name: "his"},
{name: "however"},
{name: "i'll"},
{name: "i'm"},
{name: "in"},
{name: "include"},
{name: "including"},
{name: "into"},
{name: "is"},
{name: "it"},
{name: "it's"},
{name: "its"},
{name: "late"},
{name: "later"},
{name: "made"},
{name: "many"},
{name: "may"},
{name: "me"},
{name: "more"},
{name: "most"},
{name: "near"},
{name: "no"},
{name: "non"},
{name: "not"},
{name: "of"},
{name: "on"},
{name: "only"},
{name: "or"},
{name: "other"},
{name: "over"},
{name: "several"},
{name: "she"},
{name: "some"},
{name: "such"},
{name: "than"},
{name: "that"},
{name: "the"},
{name: "their"},
{name: "then"},
{name: "there"},
{name: "these"},
{name: "they"},
{name: "this"},
{name: "through"},
{name: "to"},
{name: "under"},
{name: "until"},
{name: "use"},
{name: "was"},
{name: "we"},
{name: "were"},
{name: "when"},
{name: "where"},
{name: "which"},
{name: "who"},
{name: "with"},
{name: "you"}
];
   var stopWords = new Map();
   
   stopWordsArr.map(function(d){stopWords.set(d.name);});

    var data;
    this.setData = function(context, settings, d) {
        data = word_count(d.values);
        update(100);
    };

    var update = function(duration) {
        if (data) {
            svg.attr("width", element.clientWidth).attr("height", element.clientHeight);
            
            cloud = d3.layout.cloud().size([element.clientWidth,element.clientHeight])
              .words(data.map(function(d) {return {text:d.key, size:d.value};}))
              .padding(5)
              .rotate(function() { return ~~(Math.random() * 5) * 0; })
              .font("Tahoma")
              .fontSize(function(d) { return sizes(d.size); })
              .on("end", draw)
              .start();

       //  cloud.stop();
        }
    };


       function draw(words) {
               d3.selectAll("g").remove();
               
               svg.attr("width", element.clientWidth)
                  .attr("height", element.clientHeight)
                  .append("g")
                  .attr("transform", "translate("+element.clientWidth/2+","+element.clientHeight/2+")")
                  .selectAll("text")
                  .data(words)
                  .enter().append("text")
                  .style("font-size", function(d) { return d.size + "px"; })
                  .style("font-family", "Tahoma")
                  .style("fill", function(d, i) { return fill(i); })
                  .attr("text-anchor", "middle")
                  .attr("transform", function(d) {
                   return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                   })
                 .text(function(d) { return d.text; });
         
       }
  
    
       function word_count(d) {
        var wordList =  d3.map([],function (d) {return d;});
        var maxCnt = 1;
        d.forEach(function (d) {
          if (d[0] !== null && d[0].length > 0)
          {
            words = d[0].replace(/[\.,\"\(\)\[\]<>\*=\?]/g,' ').split(' ');
            words.forEach(function (d) {
              cnt = 0;
              dStrip = d.toLowerCase();
              if (dStrip.length > 2 && dStrip.length < 15 &&!stopWords.has(dStrip))
              {
                if (wordList.has(dStrip))
                {
                  cnt = wordList.get(dStrip);
                }
                wordList.set(dStrip,++cnt);
                if (cnt > maxCnt) 
                {
                  maxCnt = cnt; 
                }
              }
            });
          }
        }) ;
        var wordArr = wordList.entries();
        sizes.domain([2,maxCnt]);
        return wordArr.filter(greaterThanX).sort(function(a,b) {return b.value - a.value;}).slice(0,1000);
      }
      
      function greaterThanX(d) {
        return d.value > 1;
      }

    this.resize = function() {
        update(100);   
    };
};

