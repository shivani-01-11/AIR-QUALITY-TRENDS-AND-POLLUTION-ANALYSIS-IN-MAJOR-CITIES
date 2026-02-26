const margin = { top: 60, right: 30, bottom: 60, left: 70 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleBand().range([0, width]).padding(0.1);
const y = d3.scaleLinear().range([height, 0]);

const line = d3.line()
  .x(d => x(d.monthName) + x.bandwidth() / 2)
  .y(d => y(d.aqi));

const xAxisGroup = svg.append("g")
  .attr("transform", `translate(0, ${height})`)
  .attr("class", "x-axis");

const yAxisGroup = svg.append("g")
  .attr("class", "y-axis");

// Add X Axis label
svg.append("text")
  .attr("class", "x-label")
  .attr("text-anchor", "middle")
  .attr("x", width / 2)
  .attr("y", height + 40)
  .text("Month");

// Add Y Axis label
svg.append("text")
  .attr("class", "y-label")
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -50)
  .text("Average AQI");

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const color = "steelblue";

let cityData = {}, animationIndex = 0, animationInterval;

function updateChart(city) {
  const data = cityData[city];
  x.domain(data.map(d => d.monthName));
  y.domain([0, d3.max(data, d => d.aqi)]);

  xAxisGroup.call(d3.axisBottom(x));
  yAxisGroup.call(d3.axisLeft(y));

  svg.selectAll(".line-path").remove();
  svg.selectAll(".highlight-circle").remove();
  svg.selectAll(".text-label").remove();

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2.5)
    .attr("class", "line-path")
    .attr("d", line);

  svg.append("circle")
    .attr("class", "highlight-circle")
    .attr("fill", "red")
    .attr("r", 6)
    .style("opacity", 0);

  svg.append("text")
    .attr("class", "text-label")
    .attr("text-anchor", "start")
    .attr("dy", "-0.5em")
    .style("font-size", "14px")
    .style("fill", "black");
}

function animate(city) {
  clearInterval(animationInterval);
  const data = cityData[city];
  animationIndex = 0;

  const circle = svg.select(".highlight-circle");
  const label = svg.select(".text-label");

  animationInterval = setInterval(() => {
    if (animationIndex >= data.length) {
      clearInterval(animationInterval);
      return;
    }

    const d = data[animationIndex];
    circle
      .transition()
      .duration(500)
      .style("opacity", 1)
      .attr("cx", x(d.monthName) + x.bandwidth() / 2)
      .attr("cy", y(d.aqi));

    label
      .text(`${d.monthName}: ${d.aqi.toFixed(1)}`)
      .attr("x", x(d.monthName) + x.bandwidth() / 2 + 10)
      .attr("y", y(d.aqi));

    animationIndex++;
  }, 1000);
}

d3.csv("https://gist.githubusercontent.com/Shivani-198/f1f77ad7a8f621cb1c2efed4722eeb11/raw/9f771e7cc45be57850b6000da3f36fe9d486049d/gistfile1.txt")
  .then(raw => {
    raw.forEach(d => {
      d.date = new Date(d.date);
      d.Month = d.date.getMonth() + 1;
      d.MonthName = d3.timeFormat("%b")(d.date);
      d.aqi = +d.aqi;
    });

    const grouped = Array.from(
      d3.group(raw, d => `${d.city}-${d.Month}`),
      ([key, values]) => {
        const [city, month] = key.split("-");
        return {
          city,
          month: +month,
          monthName: months[+month - 1],
          aqi: d3.mean(values, d => d.aqi)
        };
      }
    );

    const cities = Array.from(new Set(grouped.map(d => d.city)));
    cities.forEach(city => {
      cityData[city] = grouped.filter(d => d.city === city).sort((a, b) => a.month - b.month);
    });

    const select = d3.select("#citySelect");
    select.selectAll("option")
      .data(cities)
      .enter()
      .append("option")
      .text(d => d)
      .attr("value", d => d);

    const initialCity = cities[0];
    updateChart(initialCity);

    select.on("change", function () {
      const selectedCity = this.value;
      updateChart(selectedCity);
    });

    d3.select("#playButton").on("click", () => {
      const currentCity = d3.select("#citySelect").property("value");
      animate(currentCity);
    });
  });
