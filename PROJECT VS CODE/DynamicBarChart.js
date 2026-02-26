const margin = { top: 60, right: 30, bottom: 70, left: 70 },
      width = 800 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const color = d3.scaleOrdinal(d3.schemeSet2);
const x = d3.scaleBand().range([0, width]).padding(0.3);
const y = d3.scaleLinear().range([height, 0]);

const xAxis = svg.append("g").attr("transform", `translate(0,${height})`);
const yAxis = svg.append("g");

svg.append("text")
  .attr("x", width / 2)
  .attr("y", height + 50)
  .attr("text-anchor", "middle")
  .attr("class", "axis-label")
  .text("City");

svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -50)
  .attr("dy", "1em")
  .attr("text-anchor", "middle")
  .attr("class", "axis-label")
  .text("Average AQI");

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

d3.csv("https://gist.githubusercontent.com/Shivani-198/f1f77ad7a8f621cb1c2efed4722eeb11/raw/9f771e7cc45be57850b6000da3f36fe9d486049d/gistfile1.txt")
  .then(data => {
    data.forEach(d => {
      d.aqi = +d.aqi;
      d.Month = new Date(d.date).getMonth() + 1;
    });

    const grouped = Array.from(d3.group(data, d => [d.Month, d.city]), ([key, values]) => {
      const [month, city] = key;
      return {
        month: +month,
        city,
        aqi: d3.mean(values, d => d.aqi)
      };
    });

    const months = [...new Set(grouped.map(d => d.month))].sort((a, b) => a - b);
    const cities = [...new Set(grouped.map(d => d.city))];

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Populate city dropdown
    const citySelect = d3.select("#citySelect");
    cities.forEach(city => {
      citySelect.append("option").text(city).attr("value", city);
    });

    let currentMonth = 1;
    let isPlaying = false;
    let interval;

    function update(month, selectedCity = null) {
      d3.select("#monthLabel").text(monthNames[month - 1]);

      const dataFiltered = grouped.filter(d => d.month === month && (!selectedCity || d.city === selectedCity));

      x.domain(dataFiltered.map(d => d.city));
      y.domain([0, d3.max(grouped, d => d.aqi)]);

      xAxis.call(d3.axisBottom(x));
      yAxis.call(d3.axisLeft(y));

      const bars = svg.selectAll("rect").data(dataFiltered, d => d.city);

      bars.enter()
        .append("rect")
        .attr("x", d => x(d.city))
        .attr("y", y(0))
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", d => color(d.city))
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`Month: ${monthNames[d.month - 1]}<br>City: ${d.city}<br>AQI: ${d.aqi.toFixed(2)}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0))
        .merge(bars)
        .transition()
        .duration(500)
        .attr("x", d => x(d.city))
        .attr("y", d => y(d.aqi))
        .attr("height", d => height - y(d.aqi));

      bars.exit().remove();
    }

    // Play/Pause button functionality
    const playPauseBtn = document.getElementById("playPauseBtn");
    playPauseBtn.addEventListener("click", () => {
      isPlaying = !isPlaying;
      playPauseBtn.innerText = isPlaying ? "Pause" : "Play";

      if (isPlaying) {
        interval = setInterval(() => {
          currentMonth = currentMonth % 12 + 1;
          document.getElementById("monthSlider").value = currentMonth;
          update(currentMonth, citySelect.node().value);
        }, 1500);
      } else {
        clearInterval(interval);
      }
    });

    // Month slider control
    const monthSlider = document.getElementById("monthSlider");
    monthSlider.addEventListener("input", e => {
      currentMonth = +e.target.value;
      update(currentMonth, citySelect.node().value);
    });

    // City dropdown change
    citySelect.on("change", () => {
      update(currentMonth, citySelect.node().value);
    });

    // Initial render
    update(currentMonth);
  });

