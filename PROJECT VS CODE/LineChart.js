const margin = { top: 50, right: 100, bottom: 50, left: 70 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#lineChart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const parseDate = d3.timeParse("%Y-%m-%d");

// Load data from GitHub gist
const url = "https://gist.githubusercontent.com/Shivani-198/f1f77ad7a8f621cb1c2efed4722eeb11/raw/9f771e7cc45be57850b6000da3f36fe9d486049d/gistfile1.txt";
d3.csv(url).then(data => {
  data.forEach(d => {
    d.date = parseDate(d.date);
    d.Month = d.date.getMonth() + 1;
    d.Year = d.date.getFullYear();
    d.aqi = +d.aqi;
  });

  // Group and compute average AQI per Year-Month
  const grouped = d3.groups(data, d => d.Year, d => d.Month)
    .map(([year, months]) => {
      return months.map(([month, records]) => {
        return {
          Year: year,
          Month: month,
          AQI: d3.mean(records, r => r.aqi)
        };
      });
    }).flat();

  // Nest by Year for line drawing
  const nested = d3.groups(grouped, d => d.Year);

  const x = d3.scaleLinear()
    .domain([1, 12])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([d3.min(grouped, d => d.AQI) - 10, d3.max(grouped, d => d.AQI) + 10])
    .range([height, 0]);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(12).tickFormat(d3.format("d")))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "black")
    .text("Month (1 = Jan, 12 = Dec)");

  svg.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text("Average AQI");

  const line = d3.line()
    .x(d => x(d.Month))
    .y(d => y(d.AQI));

  svg.selectAll(".line")
    .data(nested)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", ([year]) => color(year))
    .attr("stroke-width", 2)
    .attr("d", ([_, values]) => line(values));

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "#eee")
    .style("padding", "6px")
    .style("border", "1px solid #999")
    .style("border-radius", "4px");

  nested.forEach(([year, values]) => {
    svg.selectAll(`.dot-${year}`)
      .data(values)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.Month))
      .attr("cy", d => y(d.AQI))
      .attr("r", 4)
      .attr("fill", color(year))
      .on("mouseover", function (event, d) {
        tooltip.style("visibility", "visible")
          .text(`Year: ${d.Year}, Month: ${d.Month}, AQI: ${d.AQI.toFixed(2)}`);
      })
      .on("mousemove", function (event) {
        tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });
  });

  // Legend
  const legend = svg.selectAll(".legend")
    .data(nested.map(([year]) => year))
    .enter().append("g")
    .attr("transform", (d, i) => `translate(${width + 10},${i * 20})`);

  legend.append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", d => color(d));

  legend.append("text")
    .attr("x", 18)
    .attr("y", 10)
    .text(d => d)
    .style("font-size", "12px");

});
