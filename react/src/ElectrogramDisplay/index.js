import React from 'react'
import ReactECharts from 'echarts-for-react'

class ElectrogramDisplay extends React.Component {


  getOptions() {
    return {
      grid: { top: 8, right: 8, bottom: 24, left: 36 },
      xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          data: [820, 932, 901, 934, 1290, 1330, 1320],
          type: 'line',
          smooth: true,
        },
      ],
      tooltip: {
        trigger: 'axis',
      }
    }
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