window.onload = () => {

  const datasets = [
    'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json',
    'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json',
    'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json'
  ];
  const title = d3.select('#title');
  const description = d3.select('#description')
  const tooltip = d3.select('.tooltip');
  const dropdown = document.getElementById('dropdown')
  let svgWidth = 1500;
  let svgHeight = 1050;
  let treemapHeight = 800;
  let svg;
  let tile;
  let data = {};

  function receiveData(response) {
    [data.kickstarter, data.movies, data.games] = response;
    // The default data will be kickstarter data 
    renderData(data.kickstarter, svg)
  }

  function renderData(dataset) {
    const treemap = d3.treemap().size([svgWidth, treemapHeight]).paddingInner(1);
    const root = d3.hierarchy(dataset).sum(d => d.value);
    treemap(root);

    switch (dataset.name) {
      case 'Kickstarter':
        title.text('Kickstarter Pledges');
        description.text('Top 100 Most Pledged Kickstarter Campaigns Grouped By Category');
        break;
      case 'Movies':
        title.text('Movie Sales');
        description.text('Top 100 Highest Grossing Movies Grouped By Genre');
        break;
      case 'Video Game Sales Data Top 100':
        title.text('Video Game Sales');
        description.text('Top 100 Most Sold Video Games Grouped by Platform');
        break;
    }

    // We need to get as many colors as our data length
    const step = 1 / dataset.children.length;
    let colors = [];
    let count = 0;
    for (let i = 0; count < dataset.children.length; i += step) {
      colors.push(d3.interpolateSinebow(i));
      count++;
    }
    const colorScale = d3.scaleOrdinal(colors);

    // Adding main SVG element
    svg = d3.select('.container')
      .append('svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    // Rendering tiles
    const tiles = svg.selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x0}, ${d.y0})`)
      .on('mousemove', function(d) {
        tile = this.querySelector('.tile-text');
        tile.classList.add('tile-over');
        tooltip.attr('data-value', d.data.value)
        tooltip.style('left', d3.event.pageX - 50 + 'px');
        tooltip.style('top', d3.event.pageY - 140 + 'px');
        tooltip.html(
          `
          <p class="info"><span>Category:</span> ${d.data.category}</p>
          <p class="info"><span>Name:</span> ${d.data.name}</p>
          <p class="info"><span>Value:</span> ${d.data.value}</p>
          `
        );
        tooltip.classed('visible', true);
      })
      .on('mouseout', () => {
        tooltip.classed('visible', false);
        tile.classList.remove('tile-over');
      });

    tiles.append('rect')
      .attr('class', 'tile')
      .attr('data-name', d => d.data.name)
      .attr('data-category', d => d.data.category)
      .attr('data-value', d => d.data.value)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => colorScale(d.parent.data.name));

    tiles.append('foreignObject')
      .html(d => `<span class="tile-text">${d.data.name}</span>`)
      .attr('width', function() {
        return this.previousElementSibling.getAttribute('width')
      })
      .attr('height', function() {
        return this.previousElementSibling.getAttribute('height')
      });

    // Adding legend
    const legendBarSize = 20;
    const legendMarginTop = 20;
    const legendOffsetX = 480;
    const oneThird = Math.ceil(colors.length / 3);

    // Setting offsets for bars in legend 
    let xOffset = 0;
    let yOffset = -1;

    const legend = svg.append('g')
      .attr('id', 'legend')
      .attr('transform', `translate(${legendOffsetX}, ${treemapHeight + legendMarginTop})`);

    legend.selectAll('g')
      .data(colors)
      .enter()
      .append('g')
      .append('rect')
      .attr('class', 'legend-item')
      .attr('width', legendBarSize)
      .attr('height', legendBarSize)
      .attr('x', (d, i) => {
        if (i !== 0 && i % oneThird === 0) {
          xOffset += 250;
          return xOffset;
        } else {
          return xOffset;
        }
      })
      .attr('y', (d, i) => {
        if (i !== 0 && i % oneThird === 0) {
          yOffset = 0;
          return yOffset;
        } else {
          yOffset++;
          return yOffset * 30;
        }
      })
      .attr('fill', d => d);

    // Resetting offsets for texts in legend 
    xOffset = 25;
    yOffset = -13;

    legend.selectAll('g')
      .append('text')
      .text((d, i) => `- ${dataset.children[i].name}`)
      .attr('x', (d, i) => {
        if (i !== 0 && i % oneThird === 0) {
          xOffset += 250;
          return xOffset;
        } else {
          return xOffset;
        }
      })
      .attr('y', (d, i) => {
        if (i !== 0 && i % oneThird === 0) {
          yOffset = 17;
          return yOffset;
        } else {
          yOffset += 30;
          return yOffset;
        }
      })
  }

  dropdown.addEventListener('change', function() {
    svg.remove();
    renderData(data[this.value]);
  });

  Promise.all(datasets.map(dataset => fetch(dataset).then(response => response.json())))
    .then(data => receiveData(data))
    .catch(err => console.log(err));
};