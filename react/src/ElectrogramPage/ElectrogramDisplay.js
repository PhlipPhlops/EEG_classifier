import React from 'react'
import ReactECharts from 'echarts-for-react'

import netface from '../common/network_interface';
import store from '../common/reducers';
import styled from 'styled-components';

class ElectrogramDisplay extends React.Component {

  constructor(props) {
    super(props)

    this.backsplashGridIndex = 0;
    this.activeBrushAreas = [];
    this.activeMarkAreas = [];
    
    this.state = {
      isChunkDownloadLocked: false,
      sampleRate: null,
      eegData: {}
    }
  }

  /**
   *
   * Chart state management methods
   *
   */
  
  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);

    store.subscribe(() => {
      if (store.getState().serverStatus === 'UPLOADED'
        && !this.state.isChunkDownloadLocked
        && Object.keys(this.state.eegData).length == 0)
      {
        // Calling bindEvents here as echart is already established
        this.setState({isChunkDownloadLocked: true})
        let echart = this.echartRef.getEchartsInstance()
        this.bindInteractionEvents()
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

  onChartFirstRender() {
    this.selectHorizontalMultiBrush()
  }

  /**
   * 
   * Charts user interaction methods
   * 
   */

  bindInteractionEvents = () => {
    /**
     * Called on chart load, use to bind chart events
     */
    let echart = this.echartRef.getEchartsInstance()

    // Flag to lock render into place
    let chartFirstRender = true
    echart.on('finished', () => {
      if (!chartFirstRender) return
      else chartFirstRender = false
      this.onChartFirstRender()
    })

    echart.on('brushEnd', this.saveBrushAreasToState)
  }
  
  selectHorizontalMultiBrush = () => {
    /**
     * Called on chart load to autoselect the brush
     */
    let echart = this.echartRef.getEchartsInstance()

    echart.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'brush',
      brushOption: {
          brushType: 'lineX',
          brushMode: 'multiple'
      }
    });
  }

  saveBrushAreasToState = (params) => {
    this.activeBrushAreas = params.areas.map((area) => area.coordRange)
  }

  selectionClear = () => {
    /**
     * Clears all active brush selections
     */
    let echart = this.echartRef.getEchartsInstance()

    this.activeBrushAreas = []

    echart.dispatchAction({
      type: 'brush',
      command: 'clear',
      areas: []
    })
    // Found the command in echarts sourcecode Brush.ts
    // https://github1s.com/apache/echarts/blob/f3471f0a7080e68f8819f7b000d32d73fb0820fb/src/component/toolbox/feature/Brush.ts
  }

  brushSelectionsToMarkArea = () => {
    let echart = this.echartRef.getEchartsInstance()

    // Merge selection areas into markAreas
    this.activeMarkAreas = this.activeMarkAreas.concat(
      this.activeBrushAreas.map((range) => {
        return [
          {
            name: 'testMark',
            description: 'test',
            id: 'test1',
            xAxis: range[0]
          }, {
            xAxis: range[1]
          }
        ]
      })
    )

    echart.setOption({
      series: {
        gridIndex: this.backsplashGridIndex,
        yAxisIndex: this.backsplashGridIndex,
        xAxisIndex: this.backsplashGridIndex,
        
        markArea: {
          tooltip: {
            show: true,
          },
          itemStyle: {
            color: '#00FF0099',
          },
          data: this.activeMarkAreas
        }
      }
    })

    // Clear selection and area
    this.selectionClear()
  }

  handleKeyDown = (event) => {
    if (!this.echartRef) return

    let keyCodes = {
      37: 'LEFT',
      38: 'UP',
      39: 'RIGHT',
      40: 'DOWN',

      8: 'BACKSPACE',
      13: 'ENTER'
    }
    let key = keyCodes[event.keyCode]
    let sampleRate = store.getState().sampleRate

    if (key == 'BACKSPACE') {
      this.selectionClear()
      return
    }

    if (key == 'ENTER') {
      this.brushSelectionsToMarkArea()
      return
    }
    
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


  /**
   * 
   * Charts data requests, organization, and options
   * 
   */

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
        borderWidth: 0
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
      })
    })

    /**
     * Configure backsplash grid for highlights and such
     * Adds a grid at backsplashGridIndex that takes full height
     * Adds an xAxis identical to the others
     * Adds a series of 0s meant to be undisplayed,
     *  just for markAreas to be applied to
     */
    this.backsplashGridIndex = keysArray.length
    let backsplashGridIndex = this.backsplashGridIndex
    let configureBacksplashGrid = () => {
      if (backsplashGridIndex == 0) {
        // Catch before data loads in
        return
      }
      let arbitraryKey = keysArray[0]

      grids.push({
        left: '10%',
        right: '2%',
        top: '0%',
        bottom: '0%',
        show: true,
        containLabel: false, // Help grids aligned by axis
      })
      yAxies.push({
        type: 'value',
        gridIndex: backsplashGridIndex,
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
      xAxies.push({
        // Index of data as categories, for now
        data: [...Array(this.state.eegData[arbitraryKey].length).keys()],
        type: 'category',
        gridIndex: backsplashGridIndex,
        showGrid: false,
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: true,
          interval: sampleRate - 1,
          formatter: (value, index) => {
            return value / sampleRate
          }
        },
        axisLine: {
          show: false,
        },
      })
      series.push({
        type: 'line',
        symbol: 'none',
        lineStyle: {
          width: 0,
          color: '#00000000',
        },
        gridIndex: backsplashGridIndex,
        yAxisIndex: backsplashGridIndex,
        xAxisIndex: backsplashGridIndex,
        sampling: 'lttb',
  
        data: new Array(this.state.eegData[arbitraryKey].length).fill(0),
  
        markArea: {
          tooltip: {
            show: true,
            formatter: () => 'This is a description of the area'
          },
          itemStyle: {
            color: '#FFFF0099',
          },
          data: [
            [{
              name: 'testMark',
              xAxis: 800,
            }, {
              xAxis: 1000
            }]
          ]
        }
      })
    }
    configureBacksplashGrid()

    /**
     * 
     * The actual configuration for the chart
     * Loads in all of the previously filled grids, xAxies, yAxies, and series
     * 
     */
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

      toolbox: {
        orient: 'vertical',
        show: false,
      },

      brush: {
        toolbox: ['lineX', 'keep'],
        xAxisIndex: backsplashGridIndex
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
    }

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