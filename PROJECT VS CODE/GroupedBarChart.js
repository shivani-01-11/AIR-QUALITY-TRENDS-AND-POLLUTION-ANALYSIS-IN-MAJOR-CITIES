const margin = { top: 50, right: 150, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

d3.csv("https://gist.githubusercontent.com/Shivani-198/f1f77ad7a8f621cb1c2efed4722eeb11/raw/9f771e7cc45be57850b6000da3f36fe9d486049d/gistfile1.txt")
  .then(data => {
    data.forEach(d => {
      d["wind_speed_(m/s)"] = +d["wind_speed_(m/s)"];
      d["humidity_(%)"] = +d["humidity_(%)"];
      d.aqi = +d.aqi;
      d.windCategory = d["wind_speed_(m/s)"] <= 3 ? "Low" : "High";
      d.humidityCategory = d["humidity_(%)"] <= 60 ? "Low" : "High";
    });

    const grouped = d3.rollups(
      data,
      v => d3.mean(v, d => d.aqi),
      d => d.windCategory,
      d => d.humidityCategory
    );

    const plotData = [];
    grouped.forEach(([wind, inner]) => {
      inner.forEach(([humidity, avgAQI]) => {
        plotData.push({ wind, humidity, avgAQI });
      });
    });

    const x0 = d3.scaleBand().domain(["Low", "High"]).range([0, width]).paddingInner(0.2);
    const x1 = d3.scaleBand().domain(["Low", "High"]).range([0, x0.bandwidth()]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(plotData, d => d.avgAQI) + 20]).range([height, 0]);
    const color = d3.scaleOrdinal().domain(["Low", "High"]).range(["#4F83CC", "#F06543"]);

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x0));
    svg.append("g").call(d3.axisLeft(y));

    svg.append("text").attr("class", "axis-label").attr("x", width / 2).attr("y", height + 45).text("Wind Speed Category");
    svg.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("y", -50).attr("x", -height / 2).text("Average AQI");

    const barGroups = svg.append("g").selectAll("g")
      .data(plotData)
      .join("g")
      .attr("transform", d => `translate(${x0(d.wind)},0)`);

    const bars = barGroups.append("rect")
      .attr("x", d => x1(d.humidity))
      .attr("y", d => y(d.avgAQI))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.avgAQI))
      .attr("fill", d => color(d.humidity))
      .attr("class", d => `bar humidity-${d.humidity}`)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`Wind: ${d.wind}<br>Humidity: ${d.humidity}<br>AQI: ${d.avgAQI.toFixed(1)}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

    const legend = svg.append("g").attr("transform", `translate(${width + 10}, 10)`);
    ["Low", "High"].forEach((key, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${i * 25})`);
      g.append("rect").attr("width", 18).attr("height", 18).attr("fill", color(key));
      g.append("text").attr("x", 25).attr("y", 13).attr("class", "legend").text(`Humidity ${key}`)
        .on("click", () => {
          d3.selectAll(".bar").style("opacity", 0.2);
          d3.selectAll(`.humidity-${key}`).style("opacity", 1);
        });
    });
  });
