function ecChartPie(){
  //$.extend(this , ecChartPieConfig);
  var svg, pie, key, slice, arc, outerArc, radius, config, widget;

  this.settings = {};

  this.init = function(settings){
    var defaultConfig, width, height;
    //this.addPreloader();
    if(typeof settings !== 'undefined'){
      this.settings = settings;
    }
    // Default parameters for every chart.
    defaultConfig = {
      width: this.el.innerWidth(),
      height: this.el.innerHeight(),
      showPercentage: true,
      enlargeMaxUniqueValue: true,
      radiusFactor: {
        slices: {
          outer: 0.5,
          inner: 0
        },
        labelLines: {
          outer: 0.35,
          inner: 0.7
        },
        polyLines: {
          outer: 0.5,
          inner: 0.25
        },
        maxValueArc: {
          outer: 0.55,
          inner: 0
        }
      },
      stroke: {
        width: 4
      },
      transition: {
        duration: 1000
      }
    }
    // Extend config object with default or settings.
    config = $.extend(true, defaultConfig , settings);
    svg = d3.select('#' + this.id )
      .append("svg")
      .append("g");

    svg.append("g")
      .attr("class", "slices");
    svg.append("g")
      .attr("class", "labels");

    if(config.showPercentage){
      svg.append("g")
        .attr("class", "percentage");
    }

    svg.append("g")
      .attr("class", "lines");
    
    width = config.width;
    height = config.height;

    radius = Math.min(width, height) / 2;

    pie = d3.layout.pie()
      .sort(null)
      .value(function(d) {
        return d.value;
      });
    // Slices radius configurtaion.
    arc = d3.svg.arc()
      .outerRadius(radius * config.radiusFactor.slices.outer)
      .innerRadius(radius * config.radiusFactor.slices.inner);
    // Slices radius configurtaion.
    polylineArc = d3.svg.arc()
      .outerRadius(radius * config.radiusFactor.polyLines.outer)
      .innerRadius(radius * config.radiusFactor.polyLines.inner);
    // Labels line radius configuration.
    outerArc = d3.svg.arc()
      .innerRadius(radius * config.radiusFactor.labelLines.inner)
      .outerRadius(radius * config.radiusFactor.labelLines.outer);
    // Labels line radius configuration.
    if(config.enlargeMaxUniqueValue){
      maxValueArc = d3.svg.arc()
        .innerRadius(radius * config.radiusFactor.maxValueArc.inner)
        .outerRadius(radius * config.radiusFactor.maxValueArc.outer);
    }

    svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    key = function(d){ return d.data.label; };
    this.bindEvent();
    //this.removePreloader();
  };

  this.change = function(data){
    // Caching local data.
    if(typeof data === 'undefined'){
      // Use cahed data.
      if(typeof this.data === 'undefined') {
        console.log(this.id + '--> No data presents');
      } else {
        data = this.data;
      }
    } else {
      // Local cache data.
      this.data = data;      
    }
    /* ------- PIE SLICES -------*/
    slice = svg.select(".slices").selectAll("path.slice")
      .data(pie(data), key);

    slice.enter()
      .insert("path")
      .style("fill", function(d) { return d.data.color; })
      .style("stroke", "white")
      .style("stroke-width", config.stroke.width)
      .attr("class", "slice");

    if(config.enlargeMaxUniqueValue){
      // Reveal if there is a max unique value or return false if there
      var maxUniqueValue = true;
      var maxTempValue = 0;
      var maxValue = d3.max(data, function(d, i){
        if(maxTempValue<d.value){
          maxTempValue = d.value;
          maxUniqueValue = i;
        } else if(maxTempValue==d.value){
          maxUniqueValue = false;              
        } 
      });
    }

    slice   
      .transition().duration(config.transition.duration)
      .attrTween("d", function(d, i) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          if(config.enlargeMaxUniqueValue && (maxUniqueValue!==false) && (i == maxUniqueValue)){
            return maxValueArc(interpolate(t));
          } else {
            return arc(interpolate(t));
          }
        };
      });

    slice.exit()
      .remove();

    /* ------- TEXT LABELS -------*/

    var text = svg.select(".labels").selectAll("text")
      .data(pie(data), key);

    text.enter()
      .append("text")
      .attr("dy", ".35em")
      .text(function(d) {
        return d.data.label;
      });

    /* ------- PERCENTAGE -------*/
    if(config.showPercentage){
      var percentage = svg.select(".percentage").selectAll("text")
        .data(pie(data), key);
      var total= d3.sum(data, function(d){ return d.value; });
      var toPercent = d3.format("%");
      percentage.enter()
        .append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("fill", "white");

      percentage.text(function(d) { 
        return toPercent(d.value / total); 
      });
    }
    
    function midAngle(d){
      return d.startAngle + (d.endAngle - d.startAngle)/2;
    }

    /* Text transition */
    text.transition().duration(config.transition.duration)
      .attrTween("transform", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          // TODO Parametrize this factor.
          pos[0] = radius * 0.60 * (midAngle(d2) < Math.PI ? 1 : -1);
          return "translate("+ pos +")";
        };
      })
      .styleTween("text-anchor", function(d){
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          return midAngle(d2) < Math.PI ? "start":"end";
        };
      });

    text.exit()
      .remove();

    /* Percentage transition */
    percentage.transition().duration(config.transition.duration)
      .attrTween("transform", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          var pos = arc.centroid(d2);
          return "translate("+ pos +")";
        };
      })
      .styleTween("percentage-anchor", function(d){
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          return midAngle(d2) < Math.PI ? "start":"end";
        };
      });

    percentage.exit()
      .remove();

    /* ------- SLICE TO TEXT POLYLINES -------*/

    var polyline = svg.select(".lines").selectAll("polyline")
      .data(pie(data), key);
    
    polyline.enter()
      .append("polyline");

    polyline.transition().duration(1000)
      .attrTween("points", function(d){
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          // TODO Parametrize this factor.
          pos[0] = radius * 0.55 * (midAngle(d2) < Math.PI ? 1 : -1);
          return [polylineArc.centroid(d2), outerArc.centroid(d2), pos];
        };      
      });
    
    polyline.exit()
      .remove();
  }
}

ecChartPie.prototype = new Chart();