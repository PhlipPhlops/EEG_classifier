import React from 'react'
import ReactECharts from 'echarts-for-react'

import netface from '../api/classifier_interface';

class ElectrogramDisplay extends React.Component {

  constructor(props) {
    super(props)
    // this.state = {
    //   eegData: this.organizeEegData(this.props.data.eegData)
    // }
    // Annotations is the magic here, data is handled in chunks now
    
    this.state = {
      eegData: {}
    }

    this.masterCopy = {}

    // Download chunks (from index 0 -> arbitrary total)
    // If it's too heavy, raise total for smaller chunks
    this.requestData(0, 100) 
  }


  requestData = (n, N) => {
    if (n >= N) {
      console.log("Data download complete!")
      // Set state to re-render
      this.setState({
        eegData: this.masterCopy
      })
      let sum = 0
      for (let key in this.masterCopy) {
        console.log(this.masterCopy[key].length)
        sum += this.masterCopy[key].length
      }
      console.log(sum)
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

        // Call for next chunk
        this.requestData(n+1, N)
      })
  }

  pushDataToSeries(eegData) {

    // if (this.echartRef == undefined) {
    //   let reattempt = () => {
    //     this.pushDataToSeries(eegData)
    //   }
    //   setTimeout(reattempt, 500) // Try again until echart is available
    //   return
    // }
    // const echartInstance = this.echartRef.getEchartsInstance()
    // for (let key in eegData) {
    //   if (key == "time") {
    //     continue
    //   }
    //   try {
    //     echartInstance.appendData({
    //       seriesIndex: key,
    //       data: eegData[key]
    //     })
    //   } catch (e) {
    //     console.log(e)
    //     // console.error(e)
    //     return
    //   }
    // }
    for (let key in eegData) {
      if (key == "time") {
        continue
      }
      if (!(key in this.masterCopy)) {
        this.masterCopy[key] = []
      }
      this.masterCopy[key].push(eegData[key])
    }
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
    // console.log(electrodeList)
    // console.log(chunk[keysList[0]])
    electrodeList.forEach((elec) => {
      orgedData[elec] = []
    })
    
    // The big loop: populate lists
    keysList.forEach((key) => {
      electrodeList.forEach((elec) => {
        orgedData[elec].push(chunk[key][elec])
      })
    })

    console.log(orgedData)

    return orgedData
  }


  getOptions() {
    let series = []
    // Grab data from eegData state
    Object.keys(this.state.eegData).forEach((key) => {
      if (key == "time"){
        // Skip time value
        return
      }
      // Add a line config to series object
      series.push({
        name: key,
        type: 'line',
        smooth: true,
        data: this.state.eegData[key]
      })
    })

    // Configure Chart
    let options = {
      grid: { top: 8, right: 8, bottom: 24, left: 36 },
      xAxis: {
        type: 'time',
      },
      yAxis: {
        type: 'value',
      },
      series: series,
      tooltip: {
        trigger: 'axis',
      }
    }

    return options
  }

  render() {
    return (
      <div style={{ backgroundColor: 'white', padding: 30}}>
        <ReactECharts 
          ref={(ref) => { this.echartRef = ref }}
          option={this.getOptions()} />
      </div>
    )
  }
}

export default ElectrogramDisplay;