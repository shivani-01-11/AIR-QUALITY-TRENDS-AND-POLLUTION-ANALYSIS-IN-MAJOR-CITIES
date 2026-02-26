const url = 'https://gist.githubusercontent.com/Shivani-198/f1f77ad7a8f621cb1c2efed4722eeb11/raw/9f771e7cc45be57850b6000da3f36fe9d486049d/gistfile1.txt';

const plots = [
    { id: 'tempPlot', valueKey: 'temperature_(°c)', label: 'AQI vs Temperature' },
    { id: 'humPlot', valueKey: 'humidity_(%)', label: 'AQI vs Humidity' },
    { id: 'windPlot', valueKey: 'wind_speed_(m/s)', label: 'AQI vs Wind Speed' }
  ];
  
  let fullData;
  d3.csv(url).then(data => {
    fullData = data.map(d => {
      d.aqi = +d.aqi;
      d['temperature_(°c)'] = +d['temperature_(°c)'];
      d['humidity_(%)'] = +d['humidity_(%)'];
      d['wind_speed_(m/s)'] = +d['wind_speed_(m/s)'];
      return d;
    });
  
    plots.forEach(p => initPlot(p.id, p.valueKey, p.label));
  });
  
  function initPlot(svgId, valueKey, label) {
    const margin = { top: 50, right: 20, bottom: 50, left: 60 },
          width = 900 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;
  
    const svg = d3.select(`#${svgId}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const container = d3.select(`#${svgId}`).node().parentNode;
    const dropdown = d3.select(container).insert("select", "svg")
      .attr("class", "season-selector")
      .on("change", function() {
        const selected = this.value;
        drawBoxPlot(svg, fullData.filter(d => d.Season === selected), valueKey, label, width, height, margin);
      });
  
    const allSeasons = Array.from(new Set(fullData.map(d => d.Season)));
    dropdown.selectAll("option")
      .data(allSeasons)
      .enter()
      .append("option")
      .text(d => d)
      .attr("value", d => d);
  
    drawBoxPlot(svg, fullData.filter(d => d.Season === allSeasons[0]), valueKey, label, width, height, margin);
  }
  
  function drawBoxPlot(svg, data, valueKey, label, width, height, margin) {
    svg.selectAll("*").remove();
    const season = data.length ? data[0].Season : 'Unknown';
  
    const x = d3.scaleBand().domain([season]).range([0, width]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.aqi)]).nice().range([height, 0]);
  
    svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));
  
    const sorted = data.map(d => d.aqi).sort(d3.ascending);
    const q1 = d3.quantile(sorted, 0.25);
    const median = d3.quantile(sorted, 0.5);
    const q3 = d3.quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const min = d3.max([d3.min(sorted), q1 - 1.5 * iqr]);
    const max = d3.min([d3.max(sorted), q3 + 1.5 * iqr]);
    const center = x(season) + x.bandwidth() / 2;
  
    svg.append("line")
      .attr("x1", center).attr("x2", center)
      .attr("y1", y(min)).attr("y2", y(max))
      .attr("stroke", "black");
  
    svg.append("rect")
      .attr("x", x(season)).attr("y", y(q3))
      .attr("width", x.bandwidth()).attr("height", y(q1) - y(q3))
      .attr("class", "box")
      .attr("fill", "#1f77b4");
  
    svg.append("line")
      .attr("x1", x(season)).attr("x2", x(season) + x.bandwidth())
      .attr("y1", y(median)).attr("y2", y(median))
      .attr("stroke", "black").attr("stroke-width", 2);
  
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("fill", "#003b49")
      .text(`${label} (${season})`);
  
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .text("Season");
  
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .text("Air Quality Index (AQI)");
  }
  