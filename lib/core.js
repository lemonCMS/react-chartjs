var React = require('react');
var ReactDOM = require('react-dom');

module.exports = {
  createClass: function (chartType, methodNames, dataKey) {
    var classData = {
      displayName: chartType + 'Chart',
      getInitialState: function () {
        return {};
      },
      render: function () {
        var _props = {
          ref: 'canvass'
        };
        for (var name in this.props) {
          if (this.props.hasOwnProperty(name)) {
            if (name !== 'data' && name !== 'options') {
              _props[name] = this.props[name];
            }
          }
        }
        return React.createElement('canvas', _props);
      }
    };

    var extras = ['clear', 'stop', 'resize', 'toBase64Image', 'generateLegend', 'update', 'addData', 'removeData'];

    function extra(type) {
      classData[type] = function () {
        return this.state.chart[type].apply(this.state.chart, arguments);
      };
    }

    classData.componentDidMount = function () {
      this.initializeChart(this.props);
    };

    classData.componentWillUnmount = function () {
      var chart = this.state.chart;
      chart.destroy();
    };

      classData.componentWillReceiveProps = function(nextProps) {
      var chart = this.state.chart;
      chart.data = nextProps.data;
      chart.update();
    };

    classData.initializeChart = function (nextProps) {
      var Chart = require('chart.js');
      var el = ReactDOM.findDOMNode(this);
      var ctx = el.getContext("2d");
      Chart.types.Doughnut.extend({
        name: "DoughnutTextInside",
        // showTooltip: function () {
        //   this.chart.ctx.save();
        //   Chart.types.Doughnut.prototype.showTooltip.apply(this, arguments);
        //   this.chart.ctx.restore();
        // },
        defaults: {
          labelScale: 100
        },
        draw: function () {
          Chart.types.Doughnut.prototype.draw.apply(this, chart, arguments);
          var width = this.chart.width,
            height = this.chart.height;

          var fontSize = (height / this.options.labelScale).toFixed(2);
          this.chart.ctx.fillStyle = '#000';
          this.chart.ctx.font = fontSize + "em 'Open Sans'";
          this.chart.ctx.textBaseline = "middle";

          var total = 0;
          var filled = 0;
          var clone = this.segments.slice();
          clone.map(function (val) {
            total = total + val.value;
          })
          clone.pop();
          clone.map(function (val) {
            filled = filled + val.value;
          })

          var text = Math.round(total > 0 ? (100 / total) * filled : 0) + "%";
          var textX = Math.round((width - this.chart.ctx.measureText(text).width) / 2),
            textY = height / 2;

          this.chart.ctx.fillText(text, textX, textY);
        }
      });


      var chart = new Chart(ctx)[chartType](nextProps.data, nextProps.options || {});
      this.state.chart = chart;
    };

    // return the chartjs instance
    classData.getChart = function () {
      return this.state.chart;
    };

    // return the canvass element that contains the chart
    classData.getCanvass = function () {
      return this.refs.canvass;
    };

    classData.getCanvas = classData.getCanvass;

    var i;
    for (i = 0; i < extras.length; i++) {
      extra(extras[i]);
    }
    for (i = 0; i < methodNames.length; i++) {
      extra(methodNames[i]);
    }

    return React.createClass(classData);
  }
};

var dataKeys = {
  'Line': 'points',
  'Radar': 'points',
  'Bar': 'bars'
};

var updatePoints = function (nextProps, chart, dataKey) {
  var name = chart.name;

  if (name === 'PolarArea' || name === 'Pie' || name === 'Doughnut') {
    nextProps.data.forEach(function (segment, segmentIndex) {
      if (!chart.segments[segmentIndex]) {
        chart.addData(segment);
      } else {
        Object.keys(segment).forEach(function (key) {
          chart.segments[segmentIndex][key] = segment[key];
        });
      }
    });
  } else {
    if (chart.scale) {
      while (chart.scale.xLabels.length > nextProps.data.labels.length) {
        chart.removeData();
      }
    }
    if (nextProps.data && nextProps.data.datasets) {
      nextProps.data.datasets.forEach(function (set, setIndex) {
        set.data.forEach(function (val, pointIndex) {
          if (typeof(chart.datasets[setIndex][dataKey][pointIndex]) == "undefined") {
            addData(nextProps, chart, setIndex, pointIndex);
          } else {
            chart.datasets[setIndex][dataKey][pointIndex].value = val;
          }
        });
      });
    }
  }
};

var addData = function (nextProps, chart, setIndex, pointIndex) {
  var values = [];
  nextProps.data.datasets.forEach(function (set) {
    values.push(set.data[pointIndex]);
  });
  chart.addData(values, nextProps.data.labels[setIndex]);
};
