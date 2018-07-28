// (function (global) {
    // var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    // height = Math.max(document.documentElement.clientHeight, window.innerHeight ||0); 
var	margin = {top: 50, right: 20, bottom: 5, left: 5},
	width = 700 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
    // Define the div for the tooltip
    var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

var svg = d3.select("#details")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.attr("viewBox", "0 0 " + width + " " + height )
    .attr("preserveAspectRatio", "xMinYMin");
var zoom = d3.zoom()
    .on("zoom", function () {
        var transform = d3.zoomTransform(this);
        map.attr("transform", "transform(" +
                d3.event.scale + ")");
    });
 
svg.call(zoom);
 
var map = svg.append("g")
    .attr("class", "map");
 
d3.queue()
    .defer(d3.json,"us-states.json")
    .defer(d3.csv,"Driving_under_influence.csv")
    .await(function (error, us, data){
        if (error){
            console.error('oh dear, something went wrong: '+ error);
         }
        else {
            drawMap(us, data);
        }
    });
var defaultstate= {State: "U.S", Latitude: 32.806671, Longitude: -86.79113, Prevalence: 1.9, Total:119100, AllAges:3.3, Females:1.5, Males:5.2, ThrityFivePlus:3.1, TwentyOneToThirtyFour:6.7, ZeroToTwenty:1.3};

function drawMap(us, data){
 
    var projection = d3.geoAlbersUsa()
        .scale(700)
        .translate([width/2, height/3]);
 
    var path = d3.geoPath().projection(projection);
 
    var color = d3.scaleThreshold()
        .domain([124, 1000, 2000, 4000, 7000])
        .range(["#034e7b", "#0570b0", "#74a9cf", "#fb6a4a", "#de2d26", "#b2182b"]);
 
    var features = us.features;
    var totalById = {};
    i=0;

    data.forEach(function (d) {
        totalById[d.State] = {Total: d.Total, Prevalence: d.Prevalence }
        if(d.State == us.features[i].properties.name){
            d.geometry=us.features[i].geometry;
        }
        i+=1;
       
        }  
    );
 
    us.features.forEach(function(d){
        d.details = totalById[d.properties.name] ? totalById[d.properties.name] : {};
    });
 
  
 
    map.append("g")
        .selectAll("path")
        .data(us.features)
        .enter().append("path")
        .attr("stroke","white")
        .attr("name", function (d) {
            return d.properties.name;
        })
        .attr("id", function (d) {
            return d.id;
        })
        .attr("d", path)
        .style("fill", function (d) {
            return d.details && d.details.Total ? color(d.details.Total) : undefined;
            })                             
        .on('mouseover', function (d) {
            d3.select(this)
                .style("stroke", "white")
                .style("stroke-width", 1)
                .style("cursor", "pointer");
 
            d3.select(".State")
                .text(d.properties.name);
 
            d3.select(".Total")
                .text(d.details && d.details.Total && "Total Fatalities: " + d.details.Total || "¯\\_(ツ)_/¯");
           
            d3.select(".Prevalence")
                .text(d.details && d.details.Prevalence && "Prevalence%: " + d.details.Prevalence || "¯\\_(ツ)_/¯");
 
            d3.select('.details')
                .style('visibility', "visible");
            
            div.transition()
                .duration(100)		
                .style("opacity", 1);		
            div	.html("State: "+d.properties.name  +  "<br/>Total Deaths: " + d.details.Total + "<br/>Prevalance(%): " + d.details.Prevalence )	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");	
        })
        .on('mouseout', function (d) {
            d3.select(this)
                .style("stroke", null)
                .style("stroke-width", 0.25);
 
            d3.select(".details")
                .style('visibility', "hidden");

            div.transition()
                .duration(100)
                .style("opacity",0);
        })
        .on('click', function(d){
            d.State=d.properties.name;
            updateBarChartForPrevalnce(data,d);
            updateBarChartForYouth(data,d);
            updateBarChartForGender(data,d);
            updateBarChartForFatalities(data,d);
        })
        
        svg.append("g").selectAll("circle")
            .data(data) 
            .enter()
            .append("circle") 
            .attr("cx", function(d){
                 return projection([d.Longitude, d.Latitude])[0];
                })
            .attr("cy",  function(d){
                return projection([d.Longitude, d.Latitude])[1];
                })
            .attr("r", function(d){
                return Math.sqrt(d.Prevalence) * 5;
                } 
              )
            .style("fill", "#FDCC08")
            .style("opacity", 1)
            .on("mouseover", function(d) {		
            // div.transition()
            //     .duration(100)		
            //     .style("opacity", 1);		
            // div	.html(d.State  +  "<br/>Total Deaths:" + d.Total + "<br/>Prevalance:" + d.Prevalence )	
            //     .style("left", (d3.event.pageX) + "px")		
            //     .style("top", (d3.event.pageY - 28) + "px");	
            })					
        .on("mouseout", function(d) {		
            div.transition()		
                .duration(500)		
                .style("opacity", 0);	
        });


        svg.append("g")
        .append("rect")
        .attr("x",400)
        .attr("y",350)
        .attr("width",200)
        .attr("height",120)
        .attr("fill","#35978f")
        .attr("opacity",.5);

        function wrap(text, width) {
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    x = text.attr("x"),
                    y = text.attr("y"),
                    dy = 0, //parseFloat(text.attr("dy")),
                    tspan = text.text(null)
                                .append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan")
                                    .attr("x", x)
                                    .attr("y", y)
                                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                    .text(word);
                    }
                }
            });
        }
    svg.append("text")
        .text("Observe that ages between 21-35 reported most fatalities than other ages. Also, males had the most fatalities when compared to females.These are rates, fatalities per 100,000 population.")
        .attr("x",500)
        .attr("y",370)
        .attr("text-anchor","middle")
        .attr("font-size", "24px")
        .attr("font-weight","bold")
        .call(wrap, 180);
   //////////// add legend
   
    var legendText = ["Fatalities:124-2293", "Fatalities:2294-4462", "Fatalities:4463-6631","Fatalities:6632-8800",
                        "Fatalities:8801-10969","Fatalities:10970-13138"];
    var prevalance = [1.5,2.0,2.5,3.0,3.4];
    var legend = d3.select("#legend").append("svg")
        .attr("class", "legend")
        .attr("width", 200)
        .attr("height", 200)
        .selectAll("g")
        .data(color.domain().slice())
        .enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
 
        legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);
       
 
        legend.append("text")
        .data(legendText)
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".1em")
        .style("font-family", "verdana")
        .style("font-size", 12)
        .text(function(d) { return d; })

    var l2 = d3.select(".legend")
        .append("g")
        .selectAll("g")
        .data(prevalance)
        .enter()
        .append("g")
        .attr("transform", function(d,i){ return "translate(0," + i*24+")";});

        l2.append("circle")
        .attr("cx",10)
        .attr("cy", 120)
        .attr("r",function(d){return d*3;})
        .style("fill", "#FDCC08")
        .style("opacity", 1);

        l2.append("text")
            .data(prevalance)        
            .attr("x", 30)
            .attr("y", 125)
            .attr("dy", ".1em")
            .style("font-family", "verdana")
            .style("font-size", 12)
            .text(function(d) { return "Prevalance:" +d +"%"; })

   //////////
  

   updateBarChartForPrevalnce(data,defaultstate);
   updateBarChartForYouth(data,defaultstate);
   updateBarChartForGender(data,defaultstate);
   updateBarChartForFatalities(data,defaultstate);
}
/*
############# BAR CHART ###################
-------------------------------------------
*/

var 	formatAsPercentage = d3.format("%"),
		formatAsInteger = d3.format(",");

var color = d3.scaleThreshold()
                .domain([2293, 4462, 6631, 8800, 10969, 13138])
                .range(["#034e7b", "#0570b0", "#74a9cf", "#fb6a4a", "#de2d26", "#b2182b"]);


function stateChosen(data,chosen) {
    data.forEach(function(d) {
        d.Total = +d.Total;
        d.Prevalence = +d.Prevalence;
        d.ZeroToTwenty = +d.ZeroToTwenty;
        d.TwentyOneToThirtyFour=+d.TwentyOneToThirtyFour;
        d.ThrityFivePlus=+d.ThrityFivePlus;
        d.AllAges=+d.AllAges;
        d.Males=+d.Males;
        d.Females=+d.Females;
        d.Latitude=+d.Latitude;
        d.Longitude=+d.Longitude;

        if(d.State == chosen.State){
            chosen = d;
        }
    });
    if(chosen.State=="U.S.A"){
        return defaultstate;
    }
    return chosen;
}

function sortData(data,key){
    data.sort(function(a,b){
        return b.key - a.key;
    });
    
}
    
function dsBarChartBasics() {
    
            var margin = {top: 90, right: 10, bottom: 20, left: 50},
            width = 250 - margin.left - margin.right,
           height = 300 - margin.top - margin.bottom,
            barPadding = 5;
            
            return {
                margin : margin, 
                width : width, 
                height : height, 
                barPadding : barPadding
            }			
            ;
}

    
      /* ** UPDATE CHART ** */
     
    /* updates bar chart on request */

function updateBarChartForPrevalnce(data,chosen) {
    
    d3.select("#chart").select("svg").remove();
    
    sortData(data,"prevalence");
    chosen = stateChosen(data,chosen)
    

    var firstDatasetBarChart=[];
    firstDatasetBarChart.push(chosen);
    // var firstDatasetBarChart = data.slice(0,11);

    var basics = dsBarChartBasics();
    
    var margin = basics.margin,
        width = basics.width,
       height = basics.height,
        colorBar = basics.colorBar,
        barPadding = basics.barPadding;
                    
    
    var xScale = d3.scaleBand()                           
                        //.domain([0,firstDatasetBarChart.length])
                        .rangeRound([0, width]); 

    // Create linear y scale 
    // Purpose: No matter what the data is, the bar should fit into the svg area; bars should not
    // get higher than the svg height. Hence incoming data needs to be scaled to fit into the svg area.  
    var yScale = d3.scaleLinear()
            // use the max funtion to derive end point of the domain (max value of the dataset)
            // do not use the min value of the dataset as min of the domain as otherwise you will not see the first bar
           //.domain([0, d3.max(firstDatasetBarChart, function(d) { return d.Total; })])
           // As coordinates are always defined from the top left corner, the y position of the bar
           // is the svg height minus the data value. So you basically draw the bar starting from the top. 
           // To have the y position calculated by the range function
           .range([height, 0]);

    var xAxis = d3.axisBottom()
                    .scale(xScale);
                    
    
    var yAxis = d3.axisLeft()
                    .scale(yScale);
                    
    
    //Create SVG element
    
    var svg = d3.select("#chart")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);
    
    var plot = svg.append("g")
                    .attr("transform","translate(" + margin.left + "," + margin.right + ")");
    
    xScale.domain(firstDatasetBarChart.map(function(d){ return d.State}));
    yScale.domain([0,d3.max(firstDatasetBarChart,function(d) { return d.Prevalence;})]);

    plot.selectAll('rect')
        .data(firstDatasetBarChart)
        .enter()
        .append('rect')
        // .transition().duration(3000)
        // .delay( function(d,i) { return i * 100; })
        .attr("x", function(d,i) {
             return xScale(d.State) + xScale.bandwidth()/2.6;
        })
        .attr("width", function(d){
            return 50;
        })
        .attr("y",function(d){ 
            return yScale(d.Prevalence);
        })
        .attr("height",function(d){
             return height-yScale(d.Prevalence);
        })
        .attr("fill","#FDCC08");
      

        plot.selectAll('text')
            .data(firstDatasetBarChart)
            .enter()
            .append('text')   
            .text(function(d){
                return d.Prevalence;
            })
            .attr("x", function(d,i) { return 15+ xScale.bandwidth()/2.3;})
            .attr("y",function(d){ return yScale(d.Prevalence)+25;})
            .attr("text-anchor","middle")
            .attr("font-size", "11px")
            .attr("font-weight","bold");
            // .attr({
            //     "x": function(d){ return xScale(d.State) +  xScale.bandwithd()/2; },
            //     "y": function(d){ return yScale(d.Total)+ 12; },
            //     "font-family": 'sans-serif',
            //     "font-size": '13px',
            //     "font-weight": 'bold',
            //     "fill": 'white',
            //     "text-anchor": 'middle'
            // });

    // Draw xAxis and position the label
    plot.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("dx", "-.9em")
        .attr("dy", ".25em")
        .attr("transform", "rotate(-60)" )
        .style("text-anchor", "end")
        .attr("font-size", "10px");


   // Draw yAxis and postion the label
    plot.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("dy", "-5em")
        .style("text-anchor", "middle")
     
    // Title
    d3.select("#chart")
    .select("svg")
    .append("g")
    .append("text")
        .attr("x", (width + margin.left + margin.right)/2)
        .attr("y", 500)
        .attr("class","title")				
        .attr("text-anchor", "middle")
        .text(function(d){ return "Prevalence Rate in State:"+chosen.State;});
}

// 
// 
// Update Chart for Youth
// 
// 
function updateBarChartForYouth(data,chosen) {
        
    d3.select("#youth").select("svg").remove();

    var youthlegend=["Age:0-20","Age:21-34","Age:35+"];
    

    data.sort(function(a,b){
        return b.Total - a.Total;
    });
    chosen = stateChosen(data,chosen);

    var firstDatasetBarChart=[];
    firstDatasetBarChart.push({age:"Age: 0-20", value:chosen.ZeroToTwenty});
    firstDatasetBarChart.push({age:"Age: 21-35",value:chosen.TwentyOneToThirtyFour});
    firstDatasetBarChart.push({age:"Age: 35+", value:chosen.ThrityFivePlus});

    // var firstDatasetBarChart = data.slice(0,11);

    var basics = dsBarChartBasics();
    
    var margin = basics.margin,
        width = basics.width,
       height = basics.height,
        colorBar = basics.colorBar,
        barPadding = basics.barPadding;
                    
    
    var xScale = d3.scaleBand()                           
                   .rangeRound([0, width]); 

    var yScale = d3.scaleLinear()
                   .range([height, 0]);

    var xAxis = d3.axisBottom()
                  .scale(xScale);
                    
    
    var yAxis = d3.axisLeft()
                  .scale(yScale);
                    
    
    //Create SVG element
    
    var svg = d3.select("#youth")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);
    
    var plot = svg.append("g")
                    .attr("transform","translate(" + margin.left + "," + margin.right + ")");
    
    xScale.domain(firstDatasetBarChart.map(function(d){ return d.age}));
    yScale.domain([0,d3.max(firstDatasetBarChart,function(d) { return d.value;})]);

    plot.selectAll('rect')
        .data(firstDatasetBarChart)
        .enter()
        .append('rect')
        .attr("id",function(d,i){ return i;})
        // .transition().duration(3000)
        // .delay( function(d,i) { return i * 100; })
        .attr("x", function(d,i) {
             return xScale(d.age) + xScale.bandwidth()/4.5;
        })
        .attr("width", function(d){
            if(d != 0){
                return 40- barPadding;    
            } else {
                return 20;
            }
            
        })
        .attr("y",function(d){ 
            return yScale(d.value);
        })
        .attr("height",function(d){
             return height-yScale(d.value);
        })
        .attr("fill","#7fbf7b")
        .attr("stroke", function(d,i){
            if((chosen.State == "U.S") && i == 1 ){
                return "red";
            } else {
                return "";
            }
        })
        .attr("stroke-width",3);
      

        plot.selectAll('text')
            .data(firstDatasetBarChart)
            .enter()
            .append('text')   
            .text(function(d){
                return d.value;
            })
            .attr("x", function(d,i) { return xScale(d.age) + xScale.bandwidth()/2;})
            .attr("y",function(d){ return yScale(d.value)+20;})
            .attr("text-anchor","middle")
            .attr("font-size", "11px")
            .attr("font-weight","bold");
            // .attr({
            //     "x": function(d){ return xScale(d.State) +  xScale.bandwithd()/2; },
            //     "y": function(d){ return yScale(d.Total)+ 12; },
            //     "font-family": 'sans-serif',
            //     "font-size": '13px',
            //     "font-weight": 'bold',
            //     "fill": 'white',
            //     "text-anchor": 'middle'
            // });

    // Draw xAxis and position the label
    plot.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("dx", "-.8em")
        .attr("dy", ".25em")
        .attr("transform", "rotate(-60)" )
        .style("text-anchor", "end")
        .attr("font-size", "10px");


   // Draw yAxis and postion the label
    plot.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("dy", "-5em")
        .style("text-anchor", "middle")
    
        if( chosen.State == "U.S") {
           // plot.select("#1")
                
        }

      

}

// 
// 
// Update Chart for Gender
// 
// 
function updateBarChartForGender(data,chosen) {
        
    d3.select("#gender").select("svg").remove();

    var barcolor=["#80b1d3","#e78ac3"];
    data.sort(function(a,b){
        return b.Total - a.Total;
    });
    chosen = stateChosen(data,chosen);

    var firstDatasetBarChart=[];
    firstDatasetBarChart.push({gender:"Males", value:chosen.Males});
    firstDatasetBarChart.push({gender:"Females",value:chosen.Females});

    // var firstDatasetBarChart = data.slice(0,11);

    var basics = dsBarChartBasics();
    
    var margin = basics.margin,
        width = basics.width,
       height = basics.height,
        colorBar = basics.colorBar,
        barPadding = basics.barPadding;
                    
    
    var xScale = d3.scaleBand()                           
                   .rangeRound([0, width]); 

    var yScale = d3.scaleLinear()
                   .range([height, 0]);

    var xAxis = d3.axisBottom()
                  .scale(xScale);
                    
    
    var yAxis = d3.axisLeft()
                  .scale(yScale);
                    
    
    //Create SVG element
    
    var svg = d3.select("#gender")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);
    
    var plot = svg.append("g")
                    .attr("transform","translate(" + margin.left + "," + margin.right + ")");
    
    xScale.domain(firstDatasetBarChart.map(function(d){ return d.gender}));
    yScale.domain([0,d3.max(firstDatasetBarChart,function(d) { return d.value;})]);

    plot.selectAll('rect')
        .data(firstDatasetBarChart)
        .enter()
        .append('rect')
        // .transition().duration(3000)
        // .delay( function(d,i) { return i * 100; })
        .attr("x", function(d,i) {
             return xScale(d.gender) + xScale.bandwidth()/4;
        })
        .attr("width", function(d){
            if(d != 0){
                return 50- barPadding;    
            } else {
                return 20;
            }
            
        })
        .attr("y",function(d){ 
            return yScale(d.value);
        })
        .attr("height",function(d){
             return height-yScale(d.value);
        })
        .attr("fill",function(d,i){ return barcolor[i];})
        .attr("stroke", function(d,i){
            if((chosen.State == "U.S") && i == 0 ){
                return "red";
            } else {
                return "";
            }
        })
        .attr("stroke-width",3);
      

        plot.selectAll('text')
            .data(firstDatasetBarChart)
            .enter()
            .append('text')   
            .text(function(d){
                return d.value;
            })
            .attr("x", function(d,i) { return xScale(d.gender) + xScale.bandwidth()/2;})
            .attr("y",function(d){ return yScale(d.value)+20;})
            .attr("text-anchor","middle")
            .attr("font-size", "11px")
            .attr("font-weight","bold");
            // .attr({
            //     "x": function(d){ return xScale(d.State) +  xScale.bandwithd()/2; },
            //     "y": function(d){ return yScale(d.Total)+ 12; },
            //     "font-family": 'sans-serif',
            //     "font-size": '13px',
            //     "font-weight": 'bold',
            //     "fill": 'white',
            //     "text-anchor": 'middle'
            // });

    // Draw xAxis and position the label
    plot.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("dx", "-.8em")
        .attr("dy", ".25em")
        .attr("transform", "rotate(-60)" )
        .style("text-anchor", "end")
        .attr("font-size", "10px");


   // Draw yAxis and postion the label
    plot.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("dy", "-5em")
        .style("text-anchor", "middle")
         
        // Title
        d3.select("#gender")
        .select("svg")
        .append("g")
        .append("text")
            .attr("x", (width + margin.left + margin.right)/2)
            .attr("y", 500)
            .attr("class","title")				
            .attr("text-anchor", "middle")
            .text(function(d){ return "Men -beAWARE in State:"+chosen.State;});


    }

    // 
// 
// Update Chart for Total Fatalities
// 
// 
function updateBarChartForFatalities(data,chosen) {
        
    d3.select("#fatalities").select("svg").remove();
    
    sortData(data,"Total");
    chosen = stateChosen(data,chosen)
    

    var firstDatasetBarChart=[];
    firstDatasetBarChart.push(chosen);
    // var firstDatasetBarChart = data.slice(0,11);

    var basics = dsBarChartBasics();
    
    var margin = basics.margin,
        width = basics.width+60,
       height = basics.height,
        colorBar = basics.colorBar,
        barPadding = basics.barPadding;
                    
    
    var xScale = d3.scaleBand()                           
                        //.domain([0,firstDatasetBarChart.length])
                        .rangeRound([0, width]); 

    // Create linear y scale 
    // Purpose: No matter what the data is, the bar should fit into the svg area; bars should not
    // get higher than the svg height. Hence incoming data needs to be scaled to fit into the svg area.  
    var yScale = d3.scaleLinear()
            // use the max funtion to derive end point of the domain (max value of the dataset)
            // do not use the min value of the dataset as min of the domain as otherwise you will not see the first bar
           //.domain([0, d3.max(firstDatasetBarChart, function(d) { return d.Total; })])
           // As coordinates are always defined from the top left corner, the y position of the bar
           // is the svg height minus the data value. So you basically draw the bar starting from the top. 
           // To have the y position calculated by the range function
           .range([height, 0]);

    var xAxis = d3.axisBottom()
                    .scale(xScale);
                    
    
    var yAxis = d3.axisLeft()
                    .scale(yScale)
                    .ticks(5)
                    .tickFormat(function(tickVal) {
                        return tickVal >= 1000 ? tickVal/1000 + "K" : tickVal;});
                    
    
    //Create SVG element
    
    var svg = d3.select("#fatalities")
            .append("svg")
                .attr("width", width )
                .attr("height", height + margin.top + margin.bottom);
    
    var plot = svg.append("g")
                    .attr("transform","translate(" + margin.left + "," + margin.right + ")");
    
    xScale.domain(firstDatasetBarChart.map(function(d){ return d.State}));
    yScale.domain([0,d3.max(firstDatasetBarChart,function(d) { return d.Total;})]);

    plot.selectAll('rect')
        .data(firstDatasetBarChart)
        .enter()
        .append('rect')
        // .transition().duration(3000)
        // .delay( function(d,i) { return i * 100; })
        .attr("x", function(d,i) {
             return xScale(d.State) + xScale.bandwidth()/2.5;
        })
        .attr("width", function(d){
            return 50;
        })
        .attr("y",function(d){ 
            return yScale(d.Total);
        })
        .attr("height",function(d){
             return height-yScale(d.Total);
        })
        .attr("fill","#fb8072")
        .attr("stroke", function(d,i){
            if((chosen.State == "U.S") && i == 0 ){
                return "red";
            } else {
                return "";
            }})
        .attr("stroke-width", 3);

        plot.selectAll('text')
            .data(firstDatasetBarChart)
            .enter()
            .append('text')   
            .text(function(d){
                return d.Total;
            })
            .attr("x", function(d,i) { return 15+ xScale.bandwidth()/2.27;})
            .attr("y",function(d){ return yScale(d.Total)+25;})
            .attr("text-anchor","middle")
            .attr("font-size", "11px")
            .attr("font-weight","bold");
            // .attr({
            //     "x": function(d){ return xScale(d.State) +  xScale.bandwithd()/2; },
            //     "y": function(d){ return yScale(d.Total)+ 12; },
            //     "font-family": 'sans-serif',
            //     "font-size": '13px',
            //     "font-weight": 'bold',
            //     "fill": 'white',
            //     "text-anchor": 'middle'
            // });

    // Draw xAxis and position the label
    plot.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("dx", "-.9em")
        .attr("dy", ".25em")
        .attr("transform", "rotate(-60)" )
        .style("text-anchor", "end")
        .attr("font-size", "10px");


   // Draw yAxis and postion the label
    plot.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("dy", "0em")
        .style("text-anchor", "middle")
     
    // // Title
    // d3.select("#chart")
    // .select("svg")
    // .append("g")
    // .append("text")
    //     .attr("x", (width + margin.left + margin.right)/2)
    //     .attr("y", 500)
    //     .attr("class","title")				
    //     .attr("text-anchor", "middle")
    //     .text(function(d){ return "Prevalence Rate in State:"+chosen.State;});

    }
