const width = 600,
      height = 450,
      radius = Math.min(width, height) / 2;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${width / 2}, ${height / 2})`);

const color = d3.scaleOrdinal(d3.schemeCategory10);
const pie = d3.pie().value(d => d.aqi);
const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius - 10);
const labelArc = d3.arc().innerRadius(radius * 0.7).outerRadius(radius * 0.7);

let monthIndex = 0;
let interval;
let months, cityAQIData;

const monthLabel = d3.select("#monthLabel");

function drawLegend(cities) {
  const legend = d3.select("#legend");
  legend.selectAll(".legend-item").remove();
  cities.forEach(city => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("div")
        .attr("class", "legend-color")
        .style("background-color", color(city));
    item.append("span").text(city);
  });
}

function updateChart(month) {
  const data = cityAQIData.filter(d => d.month === month);
  const totalAQI = d3.sum(data, d => d.aqi);
  const arcs = pie(data);

  const path = svg.selectAll("path").data(arcs);
  path.enter()
    .append("path")
    .attr("fill", d => color(d.data.city))
    .attr("d", arc)
    .each(function (d) { this._current = d; })
    .merge(path)
    .transition().duration(500)
    .attrTween("d", function (d) {
      const interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(1);
      return t => arc(interpolate(t));
    });

  path.exit().remove();

  const text = svg.selectAll("text.label").data(arcs);
  text.enter()
    .append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .merge(text)
    .transition().duration(500)
    .attr("transform", d => `translate(${labelArc.centroid(d)})`)
    .text(d => `${d.data.city}: ${d.data.aqi.toFixed(1)} (${((d.data.aqi / totalAQI) * 100).toFixed(1)}%)`);

  text.exit().remove();

  const monthName = data.length > 0 ? data[0].monthName : "";
  monthLabel.text(`Month: ${monthName}`);
}

function playAnimation() {
  clearInterval(interval);
  interval = setInterval(() => {
    updateChart(months[monthIndex]);
    monthIndex = (monthIndex + 1) % months.length;
  }, 2000);
}

d3.csv("https://gist.githubusercontent.com/Shivani-198/f1f77ad7a8f621cb1c2efed4722eeb11/raw/9f771e7cc45be57850b6000da3f36fe9d486049d/gistfile1.txt")
  .then(raw => {
    raw.forEach(d => {
      const date = new Date(d.date);
      d.month = date.getMonth() + 1;
      d.monthName = d3.timeFormat("%B")(date);
      d.aqi = +d.aqi;
    });

    const grouped = Array.from(
      d3.group(raw, d => `${d.month}-${d.city}`),
      ([key, values]) => {
        const [month, city] = key.split("-");
        return {
          month: +month,
          monthName: d3.timeFormat("%B")(new Date(2000, month - 1, 1)),
          city,
          aqi: d3.mean(values, d => d.aqi)
        };
      }
    );

    cityAQIData = grouped;
    months = [...new Set(grouped.map(d => d.month))];
    const cities = [...new Set(grouped.map(d => d.city))];

    drawLegend(cities);
    updateChart(months[monthIndex]);

    d3.select("#playButton").on("click", playAnimation);
  });
