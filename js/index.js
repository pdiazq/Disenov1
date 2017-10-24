const r = 12.5,
      f = 50;

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var div = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

var color = d3.scaleSequential(d3.interpolateCool)
              .domain([0, 10])

var simulation = d3.forceSimulation()
                   .force("link",
                          d3.forceLink()
                            .id(d => d.id)
                            .distance(d => f*(1/d.value))
                            .strength(1)
                   )
                   .force("collide", d3.forceCollide().radius(r + 0.5).iterations(1))
                   .force("charge", d3.forceManyBody())
                   .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("./data/data.json", function(error, graph) {
  if (error) throw error;

  var link = svg.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(graph.links)
                .enter().append("line")
                .classed("link", true)
                .attr("id", d => d.key)
                .attr("stroke-width", d => d.value*15);

  var node = svg.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(graph.nodes)
                .enter().append("circle")
                .classed("node", true)
                .attr("id", d => d.id)
                .attr("r", r)
                .attr("fill", d => color(d.group))
                .call(d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended));

  node.append("svg:title").text(d => d.id);

  link
    .on("mouseover", d => {
      node.classed("node-selected", n => {
        return (n == d.source  || n == d.target) ? true : false;
      });
      d3.select(`#${d.key}`).classed("link-selected", true);
    })
    .on("mouseout", d=> {
      node.classed("node-selected", false);
      d3.select(`#${d.key}`).classed("link-selected", false);
    });

  node
    .on("mouseover", d => {
      d3.select(`#${d.id}`).classed("node-selected", true);
      d.most_similar.forEach(
        s => {
          d3.select(`#${s}`).classed("node-selected", true);
          var key = s < d.id ? s + d.id : d.id + s;
          d3.select(`#${key}`).classed("link-selected", true);
        }
      );
    })
    .on("mouseout", d=> {
      d3.select(`#${d.id}`).classed("node-selected", false);
      d.most_similar.forEach(
        s => {
          d3.select(`#${s}`).classed("node-selected", false);
          var key = s < d.id ? s + d.id : d.id + s;
          d3.select(`#${key}`).classed("link-selected", false);
        }
      );
    });

  simulation
    .nodes(graph.nodes)
    .on("tick", ticked);

  simulation.force("link")
            .links(graph.links);

  function ticked() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }
});

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}
