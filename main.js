// dataset defined in dataset.js
// list of keys in dataset
const experimentNames = [];
for (const experiment in dataset) {
  experimentNames.push(experiment);
}

// lists of inputs and outputs, same for every experiment
const inputNames = [];
const outputNames = [];
for (const input in dataset[experimentNames[0]].inputs) {
  inputNames.push(input);
}
for (const output in dataset[experimentNames[0]].outputs) {
  outputNames.push(output);
}

// min and max values for every input and output
const valueBounds = computeValueBounds(experimentNames, inputNames, outputNames);

// populate selects from dataset
const propertyOptions = getPropertyOptions();
const experimentOptions = getExperimentOptions();
const experimentSelectElem = document.getElementById("experiment-select");
document.getElementById("property1-select").innerHTML = propertyOptions;
document.getElementById("property2-select").innerHTML = propertyOptions;
experimentSelectElem.innerHTML = experimentOptions;

// display default empty plot, select first experiment
createDefaultPlot();
showExperiment(experimentSelectElem.value);

document.getElementById("plot-button").addEventListener("click", function() {
  const property1 = document.getElementById("property1-select").value;
  const property2 = document.getElementById("property2-select").value;
  createPlot(property1, property2);
});

experimentSelectElem.addEventListener("change", function() {
  showExperiment(this.value);
});

// show default search options (input, first input with min and max)
const searchTypeElem = document.getElementById("search-value-type");
const searchValueElem = document.getElementById("search-value-name");
resetSearch(searchTypeElem.value);

searchTypeElem.addEventListener("change", function() {
  resetSearch(this.value);
});

searchValueElem.addEventListener("change", function() {
  setDefaultBounds(valueBounds, this.value);
});

document.getElementById("search-button").addEventListener("click", function() {
  const type = document.getElementById("search-value-type").value;
  const property = document.getElementById("search-value-name").value;
  var minValue = document.getElementById("search-value-min").value;
  var maxValue = document.getElementById("search-value-max").value;
  if (isNaN(minValue)) {
    alert("Min value must be number");
    return;
  }
  if (isNaN(maxValue)) {
    alert("Max value must be a number");
    return;
  }

  minValue = parseFloat(minValue);
  maxValue = parseFloat(maxValue);
  
  const results = search(type, property, minValue, maxValue);
  var listedResults = "";
  for (const result of results) {
    // add a list element for each search result to the results-list node
    listedResults += `<li class="list-group-item">`;
    listedResults += `<a type="button" class="btn btn-link" `
    listedResults += `href="#experiment-select-section" `
    listedResults += `onclick="changeExperimentSelect('${result.name}')">`;
    listedResults += result.name;
    listedResults += `</a> ${result.property}: ${result.value}</li>`;
  }
  document.getElementById("results-list").innerHTML = listedResults;

  // reveal search results card, which is initially hidden
  document.getElementById("results").removeAttribute("hidden");
});

function changeExperimentSelect(name) {
  var index = 0;
  const experimentSelectElem = document.getElementById("experiment-select");
  while (experimentSelectElem.options[index].value != name) {
    index++;
  }
  experimentSelectElem.selectedIndex = index;
  showExperiment(name);
}

function createPlot(property1, property2) {
  // collect all values for each property
  const property1Values = [];
  const property2Values = [];
  for (const experiment in dataset) {
    property1Values.push(dataset[experiment].outputs[property1]);
    property2Values.push(dataset[experiment].outputs[property2]);
  }

  // update the plot
  var layout = getLayout(property1, property2);
  var data = [{
    x: property1Values,
    y: property2Values,
    text: experimentNames,
    mode: "markers",
    type: "scatter"
  }];
  Plotly.newPlot(document.getElementById("plot"), data, layout);
}

function getPropertyOptions() {
  // collect names of outputs for options for property select
  var options = "";
  for (const experiment in dataset) {
    for (const property in dataset[experiment].outputs) {
      options += `<option>${property}</option>`
    }

    return options;
  }

  return options;
}

function getExperimentOptions() {
  // collect names of experiments into options for experiment select
  var options = "";
  for (const experiment in dataset) {
    options += `<option>${experiment}</option>`;
  }

  return options;
}

function showExperiment(experiment) {
  // populate tables at bottom of page with all info about experiment
  const experimentDate = getExperimentDate(experiment);
  const dateElem = document.getElementById("experiment-date");
  dateElem.innerHTML = `<h4>Date: ${experimentDate.toDateString()}</h4>`;

  var inputTable = "<thead><tr><th scope=\"col\">Input</th>";
  inputTable += "<th scope=\"col\">Value</th></tr></thead><tbody>";
  var outputTable = "<thead><tr><th scope=\"col\">Output</th>";
  outputTable += "<th scope=\"col\">Value</th></tr></thead><tbody>";
  for (const [input, value] of Object.entries(dataset[experiment].inputs)) {
    // each row of input table
    inputTable += `<tr><td>${input}</td><td>${value}</td></tr>`;
  }
  for (const [output, value] of Object.entries(dataset[experiment].outputs)) {
    // each row of output table
    outputTable += `<tr><td>${output}</td><td>${value}</td></tr>`;
  }
  inputTable += "</tbody>";
  outputTable += "</tbody";

  document.getElementById("input-table").innerHTML = inputTable;
  document.getElementById("output-table").innerHTML = outputTable;
}

function getExperimentDate(experiment) {
  const year = parseInt(experiment.substring(0, 4));
  // Date constructor takes month as zero-based index
  const month = parseInt(experiment.substring(4, 6)) - 1;
  const day = parseInt(experiment.substring(6, 8));

  return new Date(year, month, day);
}

function computeValueBounds(experiments, inputs, outputs) {
  // return an object with min/max value for each property
  const result = {};

  // initialize min and max to first element
  for (const input of inputs) {
    result[input] = {
      min: dataset[experiments[0]].inputs[input],
      max: dataset[experiments[0]].inputs[input]
    };
  }
  for (const output of outputs) {
    result[output] = {
      min: dataset[experiments[0]].outputs[output],
      max: dataset[experiments[0]].outputs[output]
    };
  }

  for (const experiment of experiments) {
    for (const input of inputs) {
      const val = dataset[experiment].inputs[input]
      result[input].min = Math.min(result[input].min, val);
      result[input].max = Math.max(result[input].max, val);
    }
    for (const output of outputs) {
      const val = dataset[experiment].outputs[output]
      result[output].min = Math.min(result[output].min, val);
      result[output].max = Math.max(result[output].max, val);
    }
  }

  return result;
}

function resetSearch(value) {
  // if type select (input/output) changes, the other search fields must change
  // (property name, min and max values)
  searchValueElem.innerHTML = getValueOptions(value);
  setDefaultBounds(valueBounds, 0);
}

function getValueOptions(type) {
  // populate property name select for search
  // depends on type, current state of property type dropdown
  // (0 = inputs, 1 = outputs)
  var options = "";
  var names;
  if (type == 0) {
    names = inputNames;
  } else {
    names = outputNames;
  }
  for (var i = 0; i < names.length; i++) {
    options += `<option value="${i}">${names[i]}</option>`;
  }

  return options;
}

function setDefaultBounds(bounds, value) {
  // upon selecting a property, default min and max are min and max for entire
  // dataset, can be customized by user
  const type = document.getElementById("search-value-type").value;
  var names;
  if (type == 0) {
    names = inputNames;
  } else {
    names = outputNames;
  }

  const valueName = names[value];
  document.getElementById("search-value-min").value = bounds[valueName].min;
  document.getElementById("search-value-max").value = bounds[valueName].max;
}

function search(type, property, minVal, maxVal) {
  // search for experiments with this input/output value between min and max
  // property is property name, type is 0 for input / 1 for output
  var names;
  var typeString;
  if (type == 0) {
    names = inputNames;
    typeString = "inputs";
  } else {
    names = outputNames;
    typeString = "outputs";
  }

  // collect search result as list of objects with name/property/value
  const results = [];
  for (const experiment in dataset) {
    const val = dataset[experiment][typeString][names[property]];
    if (val >= minVal && val <= maxVal) {
      results.push({
        name: experiment,
        property: names[property],
        value: val
      });
    }
  }

  // checkbox determines whether results shown ascending or descending by value
  const ascFlag = document.getElementById("ascending-flag").checked;
  if (ascFlag) {
    results.sort((result1, result2) => result1.value - result2.value);
  } else {
    results.sort((result1, result2) => result2.value - result1.value);
  }

  return results;
}

function createDefaultPlot() {
  Plotly.newPlot(document.getElementById("plot"), [], {
    xaxis: {
      range: [0, 4]
    },
    yaxis: {
      range: [0, 6]
    },
    title: {
      text: "Plot Output Properties",
      font: {
        size: 24
      }
    }
  });
}

function getLayout(property1, property2) {
  return {
    xaxis: {
      title: {
        text: property1,
        font: {
          size: 18
        }
      }
    },
    yaxis: {
      title: {
        text: property2,
        font: {
          size: 18
        }
      }
    },
    title: {
      text: `Correlation of ${property1} and ${property2}`,
      font: {
        size: 24
      }
    }
  };
}

