/*jshint browser: true, devel: true */
/*globals Sail, d3, jQuery, _ */
var Washago = window.Washago || {};
Washago.Wall = window.Washago.Wall || {};

Washago.Wall.Graph = (function() {
    var self = {};

    self.init = function () {
    var width = 960,
        height = 500,
        radius = 6,
        fill = d3.scale.category20();

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30)
        .size([width, height]);

    var vis = d3.select("body").append("div")
        .style("width", width + "px")
        .style("height", height + "px");

    d3.json("miserables.json", function(json) {
      var link = vis.selectAll("div.link")
          .data(json.links)
        .enter().append("div")
          .attr("class", "link");

      var node = vis.selectAll("div.node")
          .data(json.nodes)
        .enter().append("div")
          .attr("class", "node")
          .style("background", function(d) { return fill(d.group); })
          .style("border-color", function(d) { return d3.rgb(fill(d.group)).darker(); })
          .call(force.drag);

      force
          .nodes(json.nodes)
          .links(json.links)
          .on("tick", tick)
          .start();

      function tick() {
        node.style("left", function(d) { return (d.x = Math.max(radius, Math.min(width - radius, d.x))) + "px"; })
            .style("top", function(d) { return (d.y = Math.max(radius, Math.min(height - radius, d.y))) + "px"; });

        link.style("left", function(d) { return d.source.x + "px"; })
            .style("top", function(d) { return d.source.y + "px"; })
            .style("width", length)
            .style("-webkit-transform", transform)
            .style("-moz-transform", transform)
            .style("-ms-transform", transform)
            .style("-o-transform", transform)
            .style("transform", transform);
      }

      function transform(d) {
        return "rotate(" + Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI + "deg)";
      }

      function length(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y;
        return Math.sqrt(dx * dx + dy * dy) + "px";
      }
    });
    };

    return self;
})();