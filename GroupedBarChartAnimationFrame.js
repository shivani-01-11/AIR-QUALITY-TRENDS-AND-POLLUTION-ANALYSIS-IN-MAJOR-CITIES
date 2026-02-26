const margin = { top: 60, right: 30, bottom: 70, left: 80 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const x0 = d3.scaleBand().range([0, width]).paddingInner(0.2);
const x1 = d3.scaleBand().padding(0.05);
const y = d3.scaleLinear().range([height, 0]);

const color = d3.scaleOrdinal(d3.schemeCategory10);

const xAxisGroup = chartGroup.append("g")
  .attr("transform", `translate(0, ${height})`);
const yAxisGroup = chartGroup.append("g");

// Axis Labels
chartGroup.append("text")
  .attr("class", "x-axis-label")
  .attr("x", width / 2)
  .attr("y", height + 50)
  .attr("text-anchor", "middle")
  .style("font-size", "14px")
  .text("City");

chartGroup.append("text")
  .attr("class", "y-axis-label")
  .attr("x", -height / 2)
  .attr("y", -60)
  .attr("transform", "rotate(-90)")
  .attr("text-anchor", "middle")
  .style("font-size", "14px")
  .text("Pollutant Level");

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "6px")
  .style("font-size", "13px")
  .style("pointer-events", "none");

let dataByMonth = {};
let months = [];
let monthIndex = 0;
let intervalId;
let isPlaying = false;

function updateChart(month) {
  const data = dataByMonth[month];

  x0.domain(data.map(d => d.city));
  x1.domain(data[0].pollutants.map(p => p.name)).range([0, x0.bandwidth()]);
  y.domain([0, d3.max(data, d => d3.max(d.pollutants, p => p.value)) * 1.1]);

  xAxisGroup.transition().duration(500).call(d3.axisBottom(x0));
  yAxisGroup.transition().duration(500).call(d3.axisLeft(y));

  const groups = chartGroup.selectAll(".group")
    .data(data, d => d.city);

  groups.enter()
    .append("g")
    .attr("class", "group")
    .merge(groups)
    .attr("transform", d => `translate(${x0(d.city)},0)`)
    .each(function(d) {
      const bars = d3.select(this).selectAll("rect")
        .data(d.pollutants, p => p.name);

      bars.enter()
        .append("rect")
        .attr("x", p => x1(p.name))
        .attr("width", x1.bandwidth())
        .attr("y", y(0))
        .attr("height", 0)
        .attr("fill", p => color(p.name))
        .on("mouseover", (event, p) => {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`Pollutant: ${p.name}<br>City: ${d.city}<br>Level: ${p.value.toFixed(2)}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0))
        .merge(bars)
        .transition().duration(600)
        .attr("x", p => x1(p.name))
        .attr("width", x1.bandwidth())
        .attr("y", p => y(p.value))
        .attr("height", p => height - y(p.value))
        .attr("fill", p => color(p.name));

      bars.exit().remove();
    });

  groups.exit().remove();
  d3.select("#monthLabel").text(`Month: ${month}`);
}

function toggleAnimation() {
  if (isPlaying) {
    clearInterval(intervalId);
    isPlaying = false;
    d3.select("#playPauseBtn").text("Play");
  } else {
    intervalId = setInterval(() => {
      updateChart(months[monthIndex]);
      monthIndex = (monthIndex + 1) % months.length;
    }, 1500);
    isPlaying = true;
    d3.select("#playPauseBtn").text("Pause");
  }
}

d3.csv("https://gist.githubusercontent.com/Shivani-198/f1f77ad7a8f621cb1c2efed4722eeb11/raw/9f771e7cc45be57850b6000da3f36fe9d486049d/gistfile1.txt")
  .then(data => {
    data.forEach(d => {
      d.date = new Date(d.date);
      d.Month = d.date.getMonth() + 1;
      Object.keys(d).forEach(k => {
        if (k !== "city" && k !== "date") d[k] = +d[k];
      });
    });

    const WHO_THRESHOLDS = {
      aqi: 100,
      "pm2.5_(µg/m³)": 5,
      "pm10_(µg/m³)": 15,
      "no2_(ppb)": 10,
      "co_(ppm)": 4,
      "o3_(ppb)": 100
    };

    const pollutants = Object.keys(WHO_THRESHOLDS);

    const grouped = d3.rollup(
      data,
      v => {
        const result = {};
        pollutants.forEach(p => {
          const avg = d3.mean(v, d => d[p]);
          if (avg > WHO_THRESHOLDS[p]) result[p] = avg;
        });
        return result;
      },
      d => d.city,
      d => d.Month
    );

    grouped.forEach((monthMap, city) => {
      monthMap.forEach((pollutantMap, month) => {
        if (!dataByMonth[month]) dataByMonth[month] = [];
        const pollutantsArray = Object.entries(pollutantMap).map(([name, value]) => ({ name, value }));
        dataByMonth[month].push({ city, pollutants: pollutantsArray });
      });
    });

    months = Object.keys(dataByMonth).map(Number).sort((a, b) => a - b);
    updateChart(months[0]);

    d3.select("#playPauseBtn").on("click", toggleAnimation);
  });
