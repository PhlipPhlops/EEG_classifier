import React from 'react'
import ReactECharts from 'echarts-for-react'

import netface from '../common/network_interface';
import store from '../common/reducers';
import styled from 'styled-components';

class ElectrogramDisplay extends React.Component {

  constructor(props) {
    super(props)
    
    this.state = {
      isChunkDownloadLocked: false,
      sampleRate: null,
      eegData: {}
    }
  }
  
  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);

    store.subscribe(() => {
      if (store.getState().serverStatus === 'UPLOADED'
        && !this.state.isChunkDownloadLocked
        && Object.keys(this.state.eegData).length == 0)
      {
        this.setState({isChunkDownloadLocked: true})
        let echart = this.echartRef.getEchartsInstance()
        echart.showLoading({
          color: '#cccccc'
        })

        this.requestData(0, 100)
      }

      if (store.getState().fileSampleRate
        && !this.state.sampleRate)
      {
        this.setState({sampleRate: store.getState().fileSampleRate})
      }
    })
  }

  handleKeyDown = (event) => {
    if (!this.echartRef) return

    let keyCodes = {
      37: 'LEFT',
      38: 'UP',
      39: 'RIGHT',
      40: 'DOWN',
    }
    let key = keyCodes[event.keyCode]
    let sampleRate = store.getState().sampleRate
    
    if (key == 'LEFT' || key == 'RIGHT') {
      let echart = this.echartRef.getEchartsInstance()
      let xAxisZoom = echart.getOption().dataZoom[0]

      let changeRate = sampleRate
      if (event.ctrlKey) {
        changeRate = changeRate * 10
      }

      if (key == 'LEFT') {
        echart.dispatchAction({
          type: 'dataZoom',
          dataZoomIndex: 0,
          startValue: xAxisZoom.startValue - changeRate,
          endValue: xAxisZoom.endValue - changeRate,
        })
      }
      if (key == 'RIGHT') {
        echart.dispatchAction({
          type: 'dataZoom',
          dataZoomIndex: 0,
          startValue: xAxisZoom.startValue + changeRate,
          endValue: xAxisZoom.endValue + changeRate,
        })
      }
    }

    if (key == 'UP' || key == 'DOWN') {
      let echart = this.echartRef.getEchartsInstance()
      let yAxisZoom = echart.getOption().dataZoom[1]
      let zoomChange = 1
      if (key == 'UP') {
        if (yAxisZoom.end - yAxisZoom.start <= zoomChange*2) {
          // Handle datazoom collapsing to 0
          echart.dispatchAction({
            type: 'dataZoom',
            dataZoomIndex: 1,
            start: 49,
            end: 51,
          })
        } else {
          // Usual behavior
          echart.dispatchAction({
            type: 'dataZoom',
            dataZoomIndex: 1,
            start: yAxisZoom.start + zoomChange,
            end: yAxisZoom.end - zoomChange,
          })
        }
      }
      if (key == 'DOWN') {
        echart.dispatchAction({
          type: 'dataZoom',
          dataZoomIndex: 1,
          start: yAxisZoom.start - zoomChange,
          end: yAxisZoom.end + zoomChange,
        })
      }
    }
  }

  requestData = (n, N) => {
    // Download chunks (from index 0 -> arbitrary total)
    // If it's too heavy, raise total for smaller chunks

    // Use || n == <somenumber> to early stop for testing
    if (n >= N) {
      let sum = 0
      for (let key in this.state.eegData) {
        sum += this.state.eegData[key].length
      }
      console.log(`Data download complete! Sum: ${sum}`)
      // Data has been loaded into state.eegData,
      // SetState to redraw (calling too often makes it quite slow)
      this.setState({})
      console.log(store.getState())
      return
    }

    console.log(`Requesting ${n+1} of ${N}`)
    netface.requestChunk(n, N)
      .then((data) => data.json())
      .then((data) => {
        let chunk = JSON.parse(data.eeg_chunk)
        // Organize and load data
        let eegData = this.organizeEegData(chunk)
        this.pushDataToSeries(eegData)
          .then(() => {
            // Call for next chunk
            this.requestData(n+1, N)
          })

      })
  }

  pushDataToSeries = (data) => {
    return new Promise((resolve, reject) => {
      for (let key in data) {
        if (key == "time") {
          continue
        }
        if (!(key in this.state.eegData)) {
          this.state.eegData[key] = []
        }
        this.state.eegData[key].push(...data[key])
      }
      resolve()
    })
  }


  organizeEegData(chunk) {
    /*
      originally arranged
      0: {
        E1: val,
        E2: val,
        E3: val,
        ...
        time: 0
      },
      1: {E1: val, ..., time: 2}

      output arrangement
      E1: [val1, val2, val3, ...]
      E2: [val1, val2, val3, ...]
      ...

      also outputs time var
    */
    // Grab iterable and electrode labels (includes time label if present)
    let keysList = Object.keys(chunk)
    let electrodeList = Object.keys(chunk[keysList[0]])
    // Create empty lists
    let orgedData = {}
    electrodeList.forEach((elec) => {
      orgedData[elec] = []
    })
    
    // The big loop: populate lists
    keysList.forEach((key) => {
      electrodeList.forEach((elec) => {
        orgedData[elec].push(chunk[key][elec])
      })
    })

    return orgedData
  }


  /**
   * This method configures the apache eCharts options to display multiple
   * electrode signals plotted against time
   */
  getOptions() {
    let series = []
    let grids = []
    let xAxies = []
    let yAxies = []
    let sampleRate = store.getState().sampleRate

    let keysArray = Object.keys(this.state.eegData)
    let spacing = Math.ceil(200 / keysArray.length)
    console.log("spacing")
    console.log(spacing)

    // Values calculated in percent
    let height = Math.ceil(95 / keysArray.length)
    // Render each EEG to its own grid
    keysArray.forEach((key) => {
      let i = keysArray.indexOf(key)
      let oflow_pad = 5
      let grid_top = (i * height - oflow_pad) + "%"
      let grid_bottom = 100 - ((i + 1) * height + oflow_pad) + "%"

      grids.push({
        left: '10%',
        right: '2%',
        top: grid_top,
        bottom: grid_bottom,
        show: true,
        tooltip: {
          show: true,
          trigger: 'axis',
        },
        containLabel: false, // Help grids aligned by axis

        // For figuring through config, remove later
        borderColor: '#ccc',
        borderWidth: 1
      })

      xAxies.push({
        // Index of data as categories, for now
        data: [...Array(this.state.eegData[key].length).keys()],
        type: 'category',
        gridIndex: i,
        showGrid: false,
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: (i == keysArray.length - 1), // Only show on last grid
          interval: sampleRate - 1,
          formatter: (value, index) => {
            return value / sampleRate
          }
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          show: true,
          interval: sampleRate - 1,
        },
        name: key,
        nameLocation: 'start',
      })

      yAxies.push({
        type: 'value',
        gridIndex: i,
        axisLabel: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        showGrid: false,
        min: -1e-3,
        max: 1e-3,
      })

      // Add a line config to series object
      series.push({
        name: key,
        type: 'line',
        symbol: 'none',
        lineStyle: {
          width: 0.5,
          color: 'black',
        },
        gridIndex: i,
        yAxisIndex: i,
        xAxisIndex: i,
        smooth: false,
        sampling: 'lttb',

        data: this.state.eegData[key],

        markArea: {
          tooltip: {
            show: true,
            formatter: () => 'This is a description of the area'
          },
          itemStyle: {
            color: '#00FF0099',
          },
          data: [
            [{
              name: 'testMark',
              xAxis: 200,
            }, {
              xAxis: 400
            }]
          ]
        }
      })
    })

    // Configure Chart
    let options = {
      // Use the values configured above
      grid: grids,
      xAxis: xAxies,
      yAxis: yAxies,
      series: series,

      // Other Configuration options
      animation: false,

      tooltip: {
        show: true,
      },

      dataZoom: [
        {
          show: true,
          xAxisIndex: Object.keys(series),
          type: 'slider',
          bottom: '0%',
          startValue: 0,
          endValue: 10 * sampleRate,
          preventDefaultMouseMove: true,
        },
        {
          yAxisIndex: Object.keys(series),
          type: 'slider',
          top: '45%',
          filterMode: 'none',

          zoomOnMouseWheel: false,
          moveOnMouseWheel: false,
          moveOnMouseMove: false,
          preventDefaultMouseMove: false,

          id: 'eegGain',
          start: 45,
          end: 55,
        },{
          type: 'inside',
          yAxisIndex: Object.keys(series),
          moveOnMouseWheel: false,
          preventDefaultMouseMove: true,
        }
      ],
    }

    return options
  }

  render() {
    if (store.getState().serverStatus != 'UPLOADED') {
      return <div></div>
    } else {
      console.log(store.getState())
    }
    console.log(this.state)

    return (
      <EDParent>
        <ReactECharts
          ref={(ref) => { this.echartRef = ref }}
          option={this.getOptions()}
          style={{height: '100%'}}
          />
      </EDParent>
    )
  }
}

export default ElectrogramDisplay;

const EDParent = styled.div`
  background-color: white;
  height: 100%;
  padding: 5px;
`;