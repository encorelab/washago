/*jshint browser: true, devel: true */
/*globals Sail, d3, jQuery, _, Washago */
Washago.Wall.Graph = (function() {
    var self = {};

    self.init = function () {
        var width = jQuery('#wall').innerWidth() - 200, // FIXME: why do we need these manual adjustments?
            height = jQuery('#wall').innerHeight() - 100,
            radius = 50,
            fill = d3.scale.category20();

        var force = d3.layout.force()
            .charge(-500)
            .linkDistance(30)
            .size([width, height]);

        var vis = d3.select("#wall");


        //d3.json("/mongo/roadshow/contributions/_find", function(json) {
          // var link = vis.selectAll("div.link")
          //     .data(json.links)
          //   .enter().append("div")
          //     .attr("class", "link");
            var nodes = jQuery(".balloon").toArray();
            var links = [];
            jQuery('.balloon').each(function () {
                //
            });

            var node = vis.selectAll("div.balloon")
                .data(nodes)
                .call(force.drag);

            force
                .nodes(nodes)
                //.links(json.links)
                .on("tick", tick)
                .start();

            function tick() {
                node.style("left", function(d) { return (d.x = Math.max(radius, Math.min(width - radius, d.x))) + "px"; })
                    .style("top", function(d) { return (d.y = Math.max(radius, Math.min(height - radius, d.y))) + "px"; });

            // link.style("left", function(d) { return d.source.x + "px"; })
            //     .style("top", function(d) { return d.source.y + "px"; })
            //     .style("width", length)
            //     .style("-webkit-transform", transform)
            //     .style("-moz-transform", transform)
            //     .style("-ms-transform", transform)
            //     .style("-o-transform", transform)
            //     .style("transform", transform);
          }

          function transform(d) {
            return "rotate(" + Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI + "deg)";
          }

          function length(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y;
            return Math.sqrt(dx * dx + dy * dy) + "px";
          }
        //});
    };

    return self;
})();