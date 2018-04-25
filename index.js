
const initD3Charts = () => {

  const SAMPLE_RATE_HZ = 100;
  var dataLog = [];
  var dataDurationInSeconds = 0;
  const loadDataUrlInput = $('.load_data_url');

  const startInput = $('.start_input');
  //TODO: animate samples range selectors on chart
  const startRange = $('.start_range');

  const takeInput = $('.take_input');
  const takeRange = $('.take_range');

  const bindControls = () => {
    const updateButton = $('.update');
    const reloadDataButton = $('.reload_data');
    //TODO: add time based data animation
    const playButton = $('.play');
    const pauseButton = $('.pause');

    const updateIfNotEqual = (input, e) => {
      var newValue = $(e.target).val();
      if (input.val() !== newValue) {
          input.val(newValue);
      }
      updateButton.removeAttr('disabled');
    };

    const enablePlayButtonOnNewTakeValue = (e) => {
      var newValue = $(e.target).val();
      if (newValue < dataDurationInSeconds) {
        playButton.removeAttr('disabled');
      } else {
        playButton.attr('disabled','disabled');
      }
    };

    startInput.on('change', (e) => {
      updateIfNotEqual(startRange,e);
    });
    startRange.on('change', (e) => {
      updateIfNotEqual(startInput,e);
    });

    takeInput.on('change', (e) => {
      updateIfNotEqual(takeRange,e);
      enablePlayButtonOnNewTakeValue(e);
    });
    takeRange.on('change', (e) => {
      updateIfNotEqual(takeInput,e);
      enablePlayButtonOnNewTakeValue(e);
    });

    updateButton.on('click', (e) => {
      updateButton.attr('disabled','disabled');
      updateCharts();
    });

    reloadDataButton.on('click', (e) => {
      reloadDataLog();
      updateChartsControls();
      updateCharts();
    });

  };

  const updateChartsControls = () => {
    startRange.attr('max', dataDurationInSeconds - 1);
    startInput.attr('max', dataDurationInSeconds - 1);
    takeRange.attr('max', dataDurationInSeconds);
    takeInput.attr('max', dataDurationInSeconds);

    startInput.val(0);
    startRange.val(0);
    takeInput.val(dataDurationInSeconds);
    takeRange.val(dataDurationInSeconds);
  }

  const addAxesToChart = (svg, svgHeight, svgWidth, xScale, xMin, xMax, xLabel, yScale, yMin, yMax, yLabel) => {
    var x_axis = d3.axisBottom().scale(xScale);

    var xAxisHeight = svgHeight * (-yMin)/(yMax - yMin);
    if (xAxisHeight < 20 || xAxisHeight >= svgHeight ){
      xAxisHeight = svgHeight - 20;
    }
    svg.append("g")
    .attr("transform", "translate(0, " + xAxisHeight + ")")
    .call(x_axis)
    svg.append("text")
    .attr("transform", (d) => "translate(" + (svgWidth - 20) + ", " + (xAxisHeight - 5)  + ")")
    .attr("text-align", "right")
    .text(xLabel);

    var y_axis = d3.axisLeft().scale(yScale);

    var yAxisWidth = svgWidth * (-xMin)/(xMax - xMin);
    if (yAxisWidth < 20 || xAxisHeight >= svgWidth){
      yAxisWidth = 40;
    }
    svg.append("g")
    .attr("transform", "translate(" + yAxisWidth + ", 0)")
    .call(y_axis);
    svg.append("text")
    .attr("transform", (d) => "translate(" + (yAxisWidth + 5) + ", " + 20  + ")")
    .attr("text-align", "right")
    .text(yLabel);
  };

  const pointsChart = (svgSelector, svgWidth, svgHeight, data_points,
      xLabel, xSelector, yLabel, ySelector, zLabel, zSelector) => {

    var xMin = d3.min(data_points, xSelector);
    var xMax = d3.max(data_points, xSelector);
    var yMin = d3.min(data_points, ySelector);
    var yMax = d3.max(data_points, ySelector);
    var zMin = d3.min(data_points, zSelector);
    var zMax = d3.max(data_points, zSelector);

    var links = [];
    for (var i = 0; i < (data_points.length - 1); i++){
      links[i] = { source: data_points[i], target: data_points[i+1] };
    }

    d3.selectAll(svgSelector + " > *").remove();
    var svg = d3.select(svgSelector)
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    var svgScalePadding = 5;//px
    var xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([svgScalePadding, svgWidth - svgScalePadding]);

    var yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([svgScalePadding, svgHeight - svgScalePadding]);

    var zScale = d3.scaleLinear()
        .domain([zMin, zMax])
       .range([0, 1]);

    var lines = svg.selectAll(".line")
       .data(links);
    lines.enter()
       .append("line")
       .attr("x1", (l) => xScale(xSelector(l.source)))
       .attr("y1", (l) => yScale(ySelector(l.source)))
       .attr("x2", (l) => xScale(xSelector(l.target)))
       .attr("y2", (l) => yScale(ySelector(l.target)))
       .attr("opacity", "0.75")
       .attr("stroke", (l) => d3.interpolateSpectral(zScale(zSelector(l.target))));
    lines.exit().remove();

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([0, 0])
      .html((d) => "<div>time: " + (d.time.toFixed(3)) + "s<br>" +
          "x: " + d.x + " <br>y: " + d.y + " <br>z: " + d.z + "</div>");
    svg.call(tip)

    var circles = svg.selectAll("circle")
      .data(data_points);
    circles.enter()
      .append("circle")
      .attr("r", 2)
      .attr("cx", (d) => xScale(xSelector(d)))
      .attr("cy", (d) => yScale(ySelector(d)))
      .attr("fill", (d) => d3.interpolateSpectral(zScale(zSelector(d))))
      .attr("opacity", "0.75")
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      //TODO: investigate mouse events - better tooltip across charts
      // .on("mouseover", (d) => {debugger; d3.select(d).attr("fill", "blue");})
      // .on("mouseout", (d) => d3.selectAll(".data-id-"+this.id).attr("fill", "black"));
    circles.exit().remove();

    addAxesToChart(svg, svgHeight, svgWidth, xScale, xMin, xMax, xLabel, yScale, yMin, yMax, yLabel);

  };


  const histogramChart = (svgSelector, svgWidth, svgHeight, data_points,
      xLabel, xSelector, yLabel, ySelector) => {

    var xMin = d3.min(data_points, xSelector);
    var xMax = d3.max(data_points, xSelector);
    var yMin = d3.min(data_points, ySelector);
    var yMax = d3.max(data_points, ySelector);

    d3.selectAll(svgSelector + " > *").remove();
    var svg = d3.select(svgSelector)
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    var svgScalePadding = 5;//px
    var xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([svgScalePadding, svgWidth - svgScalePadding]);

    var yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([svgScalePadding, svgHeight - svgScalePadding]);

    var yColorScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([0.5, 1.2]);

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([0, 0])
      .html((d) => "<div>time: " + (d.time.toFixed(3)) + "s<br>" +
          "x: " + d.x + " <br>y: " + d.y + " <br>z: " + d.z + "</div>");
    svg.call(tip)

    var radius = Math.min(Math.max(svgWidth / data_points.length * 4,1),5);
    var circles = svg.selectAll("circle")
      .data(data_points);
    circles.enter()
      .append("circle")
      .attr("r", radius)
      .attr("cx", (d) => xScale(xSelector(d)))
      .attr("cy", (d) => yScale(ySelector(d)))
      .attr("fill", (d) => d3.interpolateBlues(yColorScale(ySelector(d))))
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
    circles.exit().remove();

    addAxesToChart(svg, svgHeight, svgWidth, xScale, xMin, xMax, xLabel, yScale, yMin, yMax, yLabel);
  };


  const reloadDataLog = () => {

    //TODO: it is not nice to do this on the main thread...
    const getJSON = (url) => {
        var request = new XMLHttpRequest();
        if(request != null)
        {
            request.open( "GET", url, false );
            request.send( null );
            return request.responseText;
        }

        return "" ;
    }

    var url = loadDataUrlInput.val();
    dataLog = JSON.parse(getJSON(url));
    dataDurationInSeconds = Math.ceil(dataLog.length * (1 / SAMPLE_RATE_HZ));
    //dataLog = JSON.parse(getJSON("data/test_data.json"));
    //dataLog = JSON.parse(getJSON("data/acceleration.json"));
    for (var i = 0; i < dataLog.length; i++){
      dataLog[i].time = i * ( 1 / SAMPLE_RATE_HZ );
    }
  };

  const updateCharts = () => {
    var startSample = startInput.val() * SAMPLE_RATE_HZ;
    var takeSample = takeInput.val() * SAMPLE_RATE_HZ;

    var chartData = dataLog.slice(startSample, startSample+takeSample);

    const module = (x,y,z) => Math.sqrt(x*x + y*y + z*z);
    histogramChart('.chart_histogram', 500, 200, chartData,
      'time (ms)', (point) => point.time, 'module', (point) => module(point.x, point.y, point.z), 'Z', (point) => 1);

    pointsChart('.chart_xy', 500, 500, chartData,
      'X', (point) => point.x, 'Y', (point) => point.y, 'Z', (point) => point.z);

    pointsChart('.chart_xz', 500, 500, chartData,
      'X', (point) => point.x, 'Z', (point) => point.z, 'Y', (point) => point.y);

    pointsChart('.chart_yz', 500, 500, chartData,
      'Y', (point) => point.y, 'Z', (point) => point.z, 'X', (point) => point.x);

  };

  bindControls();
  reloadDataLog();
  updateChartsControls();
  updateCharts();
};


document.addEventListener('DOMContentLoaded', initD3Charts, false);
