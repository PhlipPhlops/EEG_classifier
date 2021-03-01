import React from 'react'
import ReactECharts from 'echarts-for-react'

import netface from '../api/classifier_interface';

class ElectrogramDisplay extends React.Component {

  constructor(props) {
    super(props)
    
    this.state = {
      eegData: {}
    }

    // Download chunks (from index 0 -> arbitrary total)
    // If it's too heavy, raise total for smaller chunks
    this.requestData(0, 100) 
  }


  requestData = (n, N) => {
    if (n >= N) {
      let sum = 0
      for (let key in this.state.eegData) {
        sum += this.state.eegData[key].length
      }
      console.log(`Data download complete! Sum: ${sum}`)
      return
    }

    console.log(`Requesting ${n} of ${N}`)
    netface.requestChunk(n, N)
      .then((data) => data.json())
      .then((data) => {
        let chunk = JSON.parse(data.eeg_chunk)
        // Organize and load data
        let eegData = this.organizeEegData(chunk)
        this.pushDataToSeries(eegData)
          .then(() => {
            // Call for next chunk
            if (n < 10)
            this.requestData(n+1, N)
          })

      })
  }

  pushDataToSeries = (eegData) => {
    return new Promise((resolve, reject) => {
      let masterCopy = this.state.eegData
      for (let key in eegData) {
        if (key == "time") {
          continue
        }
        if (!(key in masterCopy)) {
          masterCopy[key] = []
        }
        masterCopy[key].push(...eegData[key])
      }
      this.setState({
        eegData: masterCopy
      })
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
    let keysList = Object.keys(chunk).slice(0, 100)
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
      let oflow_pad = 5
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
          show: (i == keysArray.length - 1),
        },
      })

      yAxies.push({
        type: 'value',
        gridIndex: i,
        axisLabel: {
          show: (i == keysArray.length - 1),
        },
        min: -1e-4,
        max: 1e-4,
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
          type: 'inside',
          start: 5,
          end: 30,
        },
        {
          show: true,
          gridIndex: 2,
          type: 'slider',
          top: '90%',
          start: 50,
          end: 100
        }
      ],
    }

    return options
  }

  render() {
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