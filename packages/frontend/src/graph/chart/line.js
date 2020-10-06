import nv from 'nvd3';
import d3 from 'd3';
import { scatter as scatterModel } from './scatter';

/* eslint-disable prettier/prettier */
export const line = function() {
  
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var  scatter = scatterModel();

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
      , width = 960
      , height = 500
      , container = null
      , strokeWidth = 1.5
      , color = nv.utils.defaultColor() // a function that returns a color
      , getX = function(d) { return d.x } // accessor to get the x value from a data point
      , getY = function(d) { return d.y } // accessor to get the y value from a data point
      , defined = function(d,i) { return !isNaN(getY(d,i)) && getY(d,i) !== null } // allows a line to be not continuous when it is not defined
      , clipEdge = false // if true, masks lines within x and y scale
      , x //can be accessed via chart.xScale()
      , y //can be accessed via chart.yScale()
      , interpolate = "linear" // controls the line interpolation
      , duration = 250
      , dispatch = d3.dispatch('elementClick', 'elementMouseover', 'elementMouseout', 'renderEnd')
      , useLogScale = false
      ;

  scatter
      .pointSize(16) // default size
      .pointDomain([16,256]) //set to speed up calculation, needs to be unset if there is a custom size accessor
      .useLogScale(useLogScale) // Passes along configuration for whether log scale is being used for chart
  ;

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var x0, y0 //used to store previous scales
      ;

  //============================================================


  function chart(selection) {
      selection.each(function(data) {
          container = d3.select(this);
          var availableWidth = nv.utils.availableWidth(width, container, margin),
              availableHeight = nv.utils.availableHeight(height, container, margin);
          nv.utils.initSVG(container);

          // Setup Scales
          x = scatter.xScale();
          y = scatter.yScale();

          x0 = x0 || x;
          y0 = y0 || y;

          // Setup containers and skeleton of chart
          var wrap = container.selectAll('g.nv-wrap.nv-line').data([data]);
          var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-line');
          var defsEnter = wrapEnter.append('defs');
          var gEnter = wrapEnter.append('g');
          var g = wrap.select('g');

          gEnter.append('g').attr('class', 'nv-groups');
          gEnter.append('g').attr('class', 'nv-scatterWrap');

          wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          scatter
              .width(availableWidth)
              .height(availableHeight);

          var scatterWrap = wrap.select('.nv-scatterWrap');
          scatterWrap.call(scatter);

          defsEnter.append('clipPath')
              .attr('id', 'nv-edge-clip-' + scatter.id())
              .append('rect');

          wrap.select('#nv-edge-clip-' + scatter.id() + ' rect')
              .attr('width', availableWidth)
              .attr('height', (availableHeight > 0) ? availableHeight : 0);

          g   .attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + scatter.id() + ')' : '');
          scatterWrap
              .attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + scatter.id() + ')' : '');

          var groups = wrap.select('.nv-groups').selectAll('.nv-group')
              .data(function(d) { return d }, function(d) { return d.key });
          groups.enter().append('g')
              .style('stroke-opacity', 1e-6)
              .style('stroke-width', function(d) { return d.strokeWidth || strokeWidth })
              .style('fill-opacity', 1e-6);

          groups.exit().remove();

          groups
              .attr('class', function(d,i) {
                  return (d.classed || '') + ' nv-group nv-series-' + i;
              })
              .classed('hover', function(d) { return d.hover })
              .style('fill', function(d,i){ return color(d, i) })
              .style('stroke', function(d,i){ return color(d, i)});
          groups
              .style('stroke-opacity', 1)
              .style('fill-opacity', function(d) { return d.fillOpacity || .5});


          groups.exit().selectAll('path.nv-area')
              .remove();

          var linePaths = groups.selectAll('path.nv-line')
              .data(function(d) { return [d.values] });

          linePaths.enter().append('path')
              .attr('class', 'nv-line')
              .attr('d',
                  d3.svg.line()
                  .interpolate(interpolate)
                  .defined(defined)
                  .x(function(d,i) { return nv.utils.NaNtoZero(x0(getX(d,i))) })
                  .y(function(d,i) { return nv.utils.NaNtoZero(y0(getY(d,i))) })
          );

          linePaths
              .attr('d',
                  d3.svg.line()
                  .interpolate(interpolate)
                  .defined(defined)
                  .x(function(d,i) { return nv.utils.NaNtoZero(x(getX(d,i))) })
                  .y(function(d,i) { return nv.utils.NaNtoZero(y(getY(d,i))) })
          );

          //store old scales for use in transitions on update
          x0 = x.copy();
          y0 = y.copy();
      });
      return chart;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.scatter = scatter;
  // Pass through events
  scatter.dispatch.on('elementClick', function(){ dispatch.elementClick.apply(this, arguments); });
  scatter.dispatch.on('elementMouseover', function(){ dispatch.elementMouseover.apply(this, arguments); });
  scatter.dispatch.on('elementMouseout', function(){ dispatch.elementMouseout.apply(this, arguments); });

  chart.options = nv.utils.optionsFunc.bind(chart);

  chart._options = Object.create({}, {
      // simple options, just get/set the necessary values
      width:      {get: function(){return width;}, set: function(_){width=_;}},
      height:     {get: function(){return height;}, set: function(_){height=_;}},
      defined: {get: function(){return defined;}, set: function(_){defined=_;}},
      interpolate:      {get: function(){return interpolate;}, set: function(_){interpolate=_;}},
      clipEdge:    {get: function(){return clipEdge;}, set: function(_){clipEdge=_;}},

      // options that require extra logic in the setter
      margin: {get: function(){return margin;}, set: function(_){
          margin.top    = _.top    !== undefined ? _.top    : margin.top;
          margin.right  = _.right  !== undefined ? _.right  : margin.right;
          margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
          margin.left   = _.left   !== undefined ? _.left   : margin.left;
      }},
      duration: {get: function(){return duration;}, set: function(_){
          duration = _;
          scatter.duration(duration);
      }},
      x: {get: function(){return getX;}, set: function(_){
          getX = _;
          scatter.x(_);
      }},
      y: {get: function(){return getY;}, set: function(_){
          getY = _;
          scatter.y(_);
      }},
      color:  {get: function(){return color;}, set: function(_){
          color = nv.utils.getColor(_);
          scatter.color(color);
      }},
      useLogScale: {get: function(){return useLogScale;}, set: function(_){
          useLogScale = _;
          scatter.useLogScale(_);
      }}
  });

  nv.utils.inheritOptions(chart, scatter);
  nv.utils.initOptions(chart);

  return chart;
};
