// HeatMap.js
const margin = { top: 100, right: 40, bottom: 80, left: 60 },
      width = 900 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom,
      legendHeight = 60;

const svg = d3.select("#heatmap")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom + legendHeight)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const fileUrl = "https://gist.githubusercontent.com/Shivani-198/f1f77ad7a8f621cb1c2efed4722eeb11/raw/9f771e7cc45be57850b6000da3f36fe9d486049d/gistfile1.txt";

// Parse month name from number
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function drawHeatmap(data) {
  const parseDate = d3.timeParse("%Y-%m-%d");
  data.forEach(d => {
    d.date = parseDate(d.date);
    d.Month = d.date.getMonth();
    d.Year = d.date.getFullYear();
    d.aqi = +d.aqi;
  });

  const nested = Array.from(
    d3.rollup(
      data,
      v => d3.mean(v, d => d.aqi),
      d => d.Year,
      d => d.Month
    ),
    ([year, monthMap]) => (
      Array.from(monthMap, ([month, value]) => ({
        Year: year,
        Month: month,
        AQI: value
      }))
    )
  ).flat();

  const years = Array.from(new Set(nested.map(d => d.Year))).sort();
  const months = d3.range(0, 12);

  const x = d3.scaleBand().domain(months).range([0, width]).padding(0.01);
  const y = d3.scaleBand().domain(years).range([0, height]).padding(0.01);
  const color = d3.scaleSequential(d3.interpolateOrRd)
                  .domain([d3.min(nested, d => d.AQI), d3.max(nested, d => d.AQI)]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(i => monthNames[i]))
    .selectAll("text")
    .style("text-anchor", "middle");

  svg.append("g")
    .call(d3.axisLeft(y));

  svg.selectAll()
    .data(nested)
    .enter()
    .append("rect")
    .attr("x", d => x(d.Month))
    .attr("y", d => y(d.Year))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", d => color(d.AQI))
    .on("mouseover", function (event, d) {
      const [xCoord, yCoord] = d3.pointer(event);
      d3.select("#tooltip")
        .style("opacity", 1)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY}px`)
        .html(
          `<strong>Month:</strong> ${monthNames[d.Month]}<br>
           <strong>Year:</strong> ${d.Year}<br>
           <strong>Avg AQI:</strong> ${d.AQI.toFixed(2)}`
        );
    })
    .on("mouseout", function () {
      d3.select("#tooltip").style("opacity", 0);
    });

  // Color legend bar
  const legendWidth = 300;
  const legendSvg = svg.append("g")
    .attr("transform", `translate(${(width - legendWidth) / 2}, ${height + 40})`);

  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient");

  linearGradient.selectAll("stop")
    .data(
      color.ticks(10).map((t, i, n) => ({
        offset: `${100 * i / (n.length - 1)}%`,
        color: color(t)
      }))
    )
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  legendSvg.append("rect")
    .attr("width", legendWidth)
    .attr("height", 10)
    .style("fill", "url(#legend-gradient)");

  const legendScale = d3.scaleLinear()
    .domain(color.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format(".0f"));

  legendSvg.append("g")
    .attr("transform", "translate(0,10)")
    .call(legendAxis);
}

d3.csv(fileUrl).then(drawHeatmap);

// Tooltip div
const tooltip = d3.select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("padding", "6px 12px")
  .style("border", "1px solid #ccc")
  .style("border-radius", "5px")
  .style("pointer-events", "none")
  .style("opacity", 0);
