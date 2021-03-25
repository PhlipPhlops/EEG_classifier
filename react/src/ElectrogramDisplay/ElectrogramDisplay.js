import React from 'react'
import ReactECharts from 'echarts-for-react'

import netface from '../common/network_interface';
import { connect } from 'react-redux';
import store from '../common/reducers';

class ElectrogramDisplay extends React.Component {

  constructor(props) {
    super(props)
    
    this.state = {
      requestData: false,
      eegData: {}
    }
  }
  
  componentDidMount() {
    store.subscribe(() => {
      if (store.getState().serverStatus === 'UPLOADED') {
        this.setState({
          requestData: true,
        })
      }
    })
  }

  componentDidUpdate() {
    if (this.state.requestData
      && Object.keys(this.state.eegData).length === 0) {
      // If data is flagged to be requested and no data has been filled,
      // begin fetching data
      this.requestData(0, 50)
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

    let keysArray = Object.keys(this.state.eegData)

    // Values calculated in percent
    let height = Math.ceil(95 / keysArray.length)
    // Render each EEG to its own grid
    keysArray.forEach((key) => {
      let i = keysArray.indexOf(key)
      let oflow_pad = 10
      let grid_top = (i * height - oflow_pad) + "%"
      let grid_bottom = 100 - ((i + 1) * height + oflow_pad) + "%"

      grids.push({
        left: "4%",
        right: "2%",
        bottom: grid_bottom,
        top: grid_top,
        show: false,
        tooltip: {
          show: true,
          trigger: 'axis',
        },
      })

      xAxies.push({
        // Index of data as categories, for now
        data: [...Array(this.state.eegData[key].length).keys()],
        type: 'category',
        gridIndex: i,
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false,
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
        splitLine: {
          show: false,
        },
        min: -1e-3,
        max: 1e-3,
      })

      // Add a line config to series object
      series.push({
        name: key,
        type: 'line',
        symbol: 'none',
        gridIndex: i,
        yAxisIndex: i,
        xAxisIndex: i,
        smooth: false,
        sampling: 'lttb',

        data: this.state.eegData[key]
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

      dataZoom: [
        {
          show: true,
          xAxisIndex: Object.keys(series),
          type: 'slider',
          top: '95%',
          start: 0,
          end: 10,
          preventDefaultMouseMove: true,
        },
        {
          yAxisIndex: Object.keys(series),
          type: 'slider',
          top: '45%',
          filterMode: 'none',

          zoomOnMouseWheel: true,
          moveOnMouseWheel: false,
          moveOnMouseMove: false,
          preventDefaultMouseMove: true,

          id: 'eegGain',
          minSpan: 10,
          maxSpan: 100,
          start: 25,
          end: 75,          
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
      console.log(this.state.eegData)
    }

    return (
      <div style={{ backgroundColor: 'white', padding: 30, height:750}}>
        <ReactECharts
          ref={(ref) => { this.echartRef = ref }}
          option={this.getOptions()}
          style={{height: '100%'}}/>
      </div>
    )
  }
}

export default ElectrogramDisplay;