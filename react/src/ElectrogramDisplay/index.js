import React from 'react'
import ReactECharts from 'echarts-for-react'

class ElectrogramDisplay extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      eegData: this.organizeEegData(this.props.data.eegData)
    }
  }


  organizeEegData(eegData) {
    // let eegData = this.props.data.eegData
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
    let keysList = Object.keys(eegData).slice(0, 100)
    let electrodeList = Object.keys(eegData[keysList[0]])
    // Create empty lists
    let orgedData = {}
    console.log(electrodeList)
    electrodeList.forEach((elec) => {
      orgedData[elec] = []
    })
    
    // The big loop: populate lists
    keysList.forEach((key) => {
      electrodeList.forEach((elec) => {
        orgedData[elec].push(eegData[key][elec])
      })
    })

    return orgedData
  }


  getOptions() {
    let series = []
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
        <ReactECharts option={this.getOptions()} />
      </div>
    )
  }
}

export default ElectrogramDisplay;