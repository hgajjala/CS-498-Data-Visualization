// (function (global) {
    // var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    // height = Math.max(document.documentElement.clientHeight, window.innerHeight ||0); 
var	margin = {top: 10, right: 10, bottom: 10, left: 50},
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

// svg.attr("viewBox", "0 0 " + width + " " + height )
//     .attr("preserveAspectRatio", "xMinYMin");
// var zoom = d3.zoom()
//     .on("zoom", function () {
//         var transform = d3.zoomTransform(this);
//         map.attr("transform", "transform(" +
//                 d3.event.scale + ")");
//     });
 
//svg.call(zoom);
 
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

var defaultstate= {State: "U.S.A", Latitude: 32.806671, Longitude: -86.79113, Prevalence: 1.9, Total:119100, AllAges:3.3, Females:1.5, Males:5.2, ThrityFivePlus:3.1, TwentyOneToThirtyFour:6.7, ZeroToTwenty:1.3};

function drawMap(us, data){
 
    var projection = d3.geoAlbersUsa()
        .scale(900)
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
            // return d.details && d.details.Total ? color(d.details.Total) : undefined;
            return "gray";
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
            updateBarChart(d);
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
        svg.append("g")
            .append("rect")
            .attr("x",400)
            .attr("y",410)
            .attr("width",200)
            .attr("height",100)
            .attr("fill","yellow")
            .attr("opacity",.5);


        svg.append("text")
            .text("Northern states like Mountana, Nebraska, North Dakota and Iowa reported highest prevalence along with other eastern states.")
            .attr("x",500)
            .attr("y",430)
            .attr("text-anchor","middle")
            .attr("font-size", "24px")
            .call(wrap, 180)
            
   //////////// add legend
   
var legendText = ["Fatalities:124-2293", "Fatalities:2294-4462", "Fatalities:4463-6631","Fatalities:6632-8800",
"Fatalities:8801-10969","Fatalities:10970-13138"];
var prevalance = [1.5,2.0,2.5,3.0,3.4];
var legend = d3.select("#legend").append("svg")
        .attr("class", "legend")
        .attr("width", 200)
        .attr("height", 300)
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
  

    dsBarChart(data)
}
/*
############# BAR CHART ###################
-------------------------------------------
*/

var 	formatAsPercentage = d3.format("%"),
		formatAsInteger = d3.format(",");


// var datasetBarChart = [
//     {state:"Texas",	latitude:  31.054487,	longitude: -97.563461,	prevalance: 2.1,	Total: 13138	},
//     {state:"California",	latitude:36.116203,	longitude:-119.681564,	prevalance:1.8,	Total:10327	},
//     {state:"Florida",	latitude:27.766279,	longitude:-81.686783,	prevalance:2.1,	Total:8476	},
//     {state:"Pennsylvania",	latitude:40.590752,	longitude:-77.209755,	prevalance:1.8,	Total:4663	},
//     {state:"North Carolina",	latitude:35.630066,	longitude:-79.806419,	prevalance:1.4,	Total:4102	},
//     {state:"South Carolina",	latitude:33.856892,	longitude:-80.945007,	prevalance:1.6,	Total:3870	},
//     {state:"Illinois",	latitude:40.349457,	longitude:-88.986137,	prevalance:2.2,	Total:3866	},
//     {state:"New York",	latitude:42.165726,	longitude:-74.948051,	prevalance:1.4,	Total:3752	},
//     {state:"Georgia",	latitude:33.040619,	longitude:-83.643074,	prevalance:1.4,	Total:3699	},
//     {state:"Ohio",	latitude:40.388783,	longitude:-82.764915,	prevalance:2.2,	Total:3637	}   				

// ];

var color = d3.scaleThreshold()
                .domain([2293, 4462, 6631, 8800, 10969, 13138])
                .range(["#034e7b", "#0570b0", "#74a9cf", "#fb6a4a", "#de2d26", "#b2182b"]);


    function datasetBarChosen(data) {
        var ds = [];
        for (x in datasetBarChart) {
             if(datasetBarChart[x].state==data.State){
                 ds.push(datasetLineChart[x]);
             } 
            }
        return ds;
    }
    
    
    function dsBarChartBasics() {
    
            var margin = {top: 10, right: 10, bottom: 200, left: 100},
            width = 650 - margin.left - margin.right,
           height = 600 - margin.top - margin.bottom,
            barPadding = 7
            ;
            
            return {
                margin : margin, 
                width : width, 
                height : height, 
                barPadding : barPadding
            }			
            ;
    }
    
    function dsBarChart(data) {
    
        data.forEach(function(d) {
            d.Total = +d.Total;
            d.Prevalence = +d.Prevalence
        });

        data.sort(function(a,b){
            return b.Prevalence - a.Prevalence;
        });


        var firstDatasetBarChart = data.slice(0,11);

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
            .transition().duration(3000)
            .delay( function(d,i) { return i * 100; })
            .attr("x", function(d,i) { return xScale(d.State) + xScale.bandwidth()/5;})
            .attr("width", width/firstDatasetBarChart.length - barPadding)
            .attr("y",function(d){ return yScale(d.Prevalence);})
            .attr("height",function(d){ return height-yScale(d.Prevalence);})
            .attr("fill","#FDCC08");
          
    
            plot.selectAll('text')
                .data(firstDatasetBarChart)
                .enter()
                .append('text')   
                .text(function(d){
                    return d.Prevalence;
                })
                .attr("x", function(d,i) { return xScale(d.State) + xScale.bandwidth()/1.5;})
                .attr("y",function(d){ return yScale(d.Prevalence)+20;})
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
        // plot.append("text")
        //     .attr("x", (width + margin.left + margin.right)/2)
        //     .attr("y", 15)
        //     .attr("class","title")				
        //     .attr("text-anchor", "middle")
        //     .text("Top States for Prevalance Rates")
        //     ;
    }
    
    
     /* ** UPDATE CHART ** */
     
  