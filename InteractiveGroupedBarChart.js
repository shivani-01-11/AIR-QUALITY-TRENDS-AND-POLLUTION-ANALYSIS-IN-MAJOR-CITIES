const margin = { top: 60, right: 100, bottom: 50, left: 70 },
  width = 800 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "6px")
  .style("font-size", "13px")
  .style("pointer-events", "none");

const color = d3.scaleOrdinal()
  .domain(["Weekday", "Weekend"])
  .range(["#1f77b4", "#ff7f0e"]);

let activeTypes = new Set(["Weekday", "Weekend"]);

d3.csv("https://gist.githubusercontent.com/Shivani-198/f1f77ad7a8f621cb1c2efed4722eeb11/raw/9f771e7cc45be57850b6000da3f36fe9d486049d/gistfile1.txt")
  .then(raw => {
    raw.forEach(d => {
      d.date = new Date(d.date);
      d.aqi = +d.aqi;
      d["Day Type"] = d.date.getDay() >= 5 ? "Weekend" : "Weekday";
    });

    const grouped = Array.from(
      d3.group(raw, d => `${d.city}-${d["Day Type"]}`),
      ([key, values]) => {
        const [city, type] = key.split("-");
        return {
          city,
          type,
          aqi: d3.mean(values, d => d.aqi)
        };
      }
    );

    const cities = [...new Set(grouped.map(d => d.city))];
    const types = ["Weekday", "Weekend"];

    const x0 = d3.scaleBand()
      .domain(cities)
      .range([0, width])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain(types)
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(grouped, d => d.aqi) * 1.1])
      .nice()
      .range([height, 0]);

    chart.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x0));

    chart.append("g").call(d3.axisLeft(y));

    // Axis labels
    chart.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .text("City");

    chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text("Average AQI");

    let barsGroup = chart.append("g").attr("class", "bars");

    function drawBars() {
      const filtered = grouped.filter(d => activeTypes.has(d.type));

      const bars = barsGroup.selectAll("rect")
        .data(filtered, d => d.city + "-" + d.type);

      bars.enter()
        .append("rect")
        .attr("x", d => x0(d.city) + x1(d.type))
        .attr("y", d => y(0))
        .attr("width", x1.bandwidth())
        .attr("height", 0)
        .attr("fill", d => color(d.type))
        .on("mouseover", (event, d) => {
          tooltip.style("opacity", 1)
            .html(`City: ${d.city}<br>Day: ${d.type}<br>AQI: ${d.aqi.toFixed(2)}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", () => tooltip.style("opacity", 0))
        .merge(bars)
        .transition()
        .duration(600)
        .attr("x", d => x0(d.city) + x1(d.type))
        .attr("y", d => y(d.aqi))
        .attr("height", d => height - y(d.aqi));

      bars.exit().transition().duration(600).attr("height", 0).attr("y", y(0)).remove();
    }

    drawBars();

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width + margin.left + 10}, ${margin.top})`);

    types.forEach((t, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 25)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", color(t))
        .attr("stroke", "black")
        .attr("class", "legend-rect")
        .style("cursor", "pointer")
        .on("click", () => toggleType(t));

      legend.append("text")
        .attr("x", 25)
        .attr("y", i * 25 + 14)
        .text(t)
        .style("font-size", "14px")
        .style("cursor", "pointer")
        .on("click", () => toggleType(t));
    });

    function toggleType(type) {
      if (activeTypes.has(type)) {
        activeTypes.delete(type);
      } else {
        activeTypes.add(type);
      }
      drawBars();
    }
  });
