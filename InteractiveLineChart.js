const margin = { top: 60, right: 140, bottom: 60, left: 70 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parseDate = d3.timeParse("%Y-%m-%d");
const color = d3.scaleOrdinal(d3.schemeTableau10);

d3.csv("https://gist.githubusercontent.com/Shivani-198/f1f77ad7a8f621cb1c2efed4722eeb11/raw/9f771e7cc45be57850b6000da3f36fe9d486049d/gistfile1.txt")
  .then(data => {
    data.forEach(d => {
      d.date = parseDate(d.date);
      d.Month = d.date.getMonth();
      d.MonthName = monthOrder[d.Month];
      d.aqi = +d.aqi;
    });

    const nested = d3.group(data, d => d.city, d => d.MonthName);
    const cities = Array.from(nested.keys());

    const cityData = cities.map(city => {
      const values = Array.from(nested.get(city)).map(([monthName, records]) => {
        return {
          month: monthName,
          aqi: d3.mean(records, d => d.aqi)
        };
      }).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
      return { city, values };
    });

    const x = d3.scalePoint()
      .domain(monthOrder)
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(cityData, c => d3.max(c.values, d => d.aqi))])
      .nice()
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Month");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Average AQI");

    const line = d3.line()
      .x(d => x(d.month))
      .y(d => y(d.aqi));

    const lineGroups = svg.selectAll(".line-group")
      .data(cityData)
      .enter()
      .append("g")
      .attr("class", "line-group")
      .attr("data-city", d => d.city);

    lineGroups.append("path")
      .attr("fill", "none")
      .attr("stroke", d => color(d.city))
      .attr("stroke-width", 2.5)
      .attr("d", d => line(d.values));

    lineGroups.selectAll("circle")
      .data(d => d.values.map(v => ({ ...v, city: d.city })))
      .enter()
      .append("circle")
      .attr("cx", d => x(d.month))
      .attr("cy", d => y(d.aqi))
      .attr("r", 5)
      .attr("fill", d => color(d.city))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip.html(`City: ${d.city}<br>Month: ${d.month}<br>AQI: ${d.aqi.toFixed(2)}`)
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 30 + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

    const legend = svg.selectAll(".legend")
      .data(cities)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(${width + 10},${i * 25})`)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        const group = svg.select(`.line-group[data-city='${d}']`);
        const visible = group.style("display") !== "none";
        group.transition().style("display", visible ? "none" : null);
      });

    legend.append("rect")
      .attr("x", 0)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", d => color(d));

    legend.append("text")
      .attr("x", 25)
      .attr("y", 13)
      .text(d => d)
      .style("font-size", "13px");
  });
