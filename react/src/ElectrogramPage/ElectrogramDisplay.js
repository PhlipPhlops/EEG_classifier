import React from 'react'
import ReactECharts from 'echarts-for-react'

import netface from '../common/network_interface';
import store from '../common/reducers';
import styled from 'styled-components';

class ElectrogramDisplay extends React.Component {

  constructor(props) {
    super(props)

    // MARK AREA VARIABLES
    this.backsplashGridIndex = 0;
    this.activeBrushAreas = [];
    this.activeMarkAreas = [];

    // OTHER VARIABLES
    this.removedAxies = ["time"] // time is filtered by default
    this.axiesToRemove = [] // Temporary storage before being pushed to removedAxies

    // These variables are used for viewport control, leveraging
    // echarts setOption() so no need for setState()
    // ALL MUST BE SET AFTER FILE UPLOADED SIGNAL
    this.sampleRate = null // samples per second
    this.secPerChunk = 10
    this.chunkSize = null // (updated later)
    this.numChunkBuffers = 5 // Num chunks on either side ofthe viewport
    this.totalBufferSize = null
    // Buffer start index is tied into markAreas which will save to file
    this.bufferStartIndex = 0 // Index of loaded chunks relative to total num samples
    // Datazoom indices
    this.dz_start = 0
    this.dz_end = this.chunkSize
    // Thresholds on which to request more data
    // when dz_start passes over these values, it'll update
    this.threshold_left = null
    this.threshold_right = null
    // Holds y-zoom data
    this.yZoom = .01
    this.yTranslate = 0

    // Movement flag to handle rapid pressing of the movment buttons
    this.blockScrollMovement = false
    
    this.state = {
      isRenderIntitialized: false,
      eegData: {}
    }
  }

  /**
   * THIS COLLECTOIN OF METHODS HANDLES COMPONENT AND CHART INITIALIZATION
   */
  
  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);

    store.subscribe(() => {
      if (store.getState().serverStatus === 'UPLOADED'
        && !this.state.isRenderIntitialized
        && Object.keys(this.state.eegData).length == 0)
      {
        // File has been successfully uploaded
        // Must be called before echartRef becomes active
        this.setState({isRenderIntitialized: true})
        
        this.updateNavVariables()
        
        // Bind events and show loading
        let echart = this.echartRef.getEchartsInstance()
        this.bindInteractionEvents()
        echart.showLoading({
          color: '#cccccc'
        })
        
        this.initialDataLoad()
        // LEGACY
        // this.requestData(0, 10)
      }
    })
  }

  onChartFirstRender() {
    this.selectHorizontalMultiBrush()
  }

  updateNavVariables() {
    // Store variables from server
    this.sampleRate = store.getState().sampleRate
    this.numSamples = store.getState().numSamples
    this.chunkSize = Math.ceil(this.secPerChunk * this.sampleRate)
    this.totalBufferSize = this.chunkSize * (this.numChunkBuffers * 2 + 1)
    this.dz_end = this.dz_start + this.chunkSize
    // Updates on threshold of the last chunk in the buffer (or first)
    this.threshold_left = 2 * this.chunkSize
    this.threshold_right = (this.numChunkBuffers * 2 - 1) * this.chunkSize
  }


  changeChunkSize(toBeSmaller) {
    if (toBeSmaller) {
      this.secPerChunk = this.secPerChunk / 2
    } else {
      this.secPerChunk = this.secPerChunk * 2
    }
    this.updateNavVariables()
    this.updateViewport()
  }


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

    // Catch markArea events
    echart.on('dblclick', (event) => {
      if (event.componentType === 'markArea') {
        this.deleteMarkArea(event)
      }
    })
    // Catch del axis e vents
    echart.on('click', (event) => {
      if (event.componentType === 'xAxis') {
        this.markAxisForDeletion(event)
      }
    })
  }
  
  setBufferIndex = (newIndex) => {
    // console.log(`New buffer index set: ${newIndex}`)
    if (newIndex < 0) {
      newIndex = 0
    }
    this.bufferStartIndex = newIndex
  }

  /**
   * THIS COLLECTION OF METHODS HANDLES ALL THINGS PERTAINING TO MARKAREAS
   * 
   * ActiveMarkArea indices are relative to the TOTAL NUMBER OF SAMPLES
   * so they can be safely saved to file. They are only adjusted to fit the screen
   * during rendering
   */
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
    // Merge selection areas into markAreas
    this.activeMarkAreas = this.activeMarkAreas.concat(
      this.activeBrushAreas.map((range) => {
        return [
          {
            name: 'testMark',
            description: 'test',
            id: 'test1',
            xAxis: range[0] + this.bufferStartIndex
          }, {
            xAxis: range[1] + this.bufferStartIndex
          }
        ]
      })
    )

    this.refreshMarkArea()

    this.selectionClear()
  }

  deleteMarkArea = (event) => {
    let areaCoords = [
      event.data.coord[0][0] + this.bufferStartIndex, // minX
      event.data.coord[1][0] + this.bufferStartIndex, // maxX
    ]

    // Filter the one data with these coords from the markArea array
    this.activeMarkAreas = this.activeMarkAreas.filter(
      // If either minX or maxX don't match, keep the data
      markArea => markArea[0].xAxis != areaCoords[0] ||
                  markArea[1].xAxis != areaCoords[1]
    )

    this.refreshMarkArea()
  }

  refreshMarkArea = (saveToNetwork) => {
    // Draw all active Mark Areas
    let echart = this.echartRef.getEchartsInstance()
    echart.setOption({
      series: {

        name: 'backSplashSeries',

        data: [],
        
        markArea: {
          id: 'markArea',
          name: 'markArea',
          tooltip: {
            show: true,
          },
          itemStyle: {
            color: '#00FF0099',
          },
          data: this.activeMarkAreas.map((area) => {
            return [
              {
                ...area[0],
                xAxis: area[0].xAxis - this.bufferStartIndex
              },
              {
                ...area[1],
                xAxis: area[1].xAxis - this.bufferStartIndex
              }
            ]
          })
          //     show: true,
          //     formatter: () => 'This is a description of the area'
        }
      }
    })

    if (saveToNetwork == undefined || saveToNetwork)
      this.saveMarkAreasToNetwork()
  }

  saveMarkAreasToNetwork = () => { 
    /** Current format
     * [
          {
            name: 'testMark',
            description: 'test',
            id: 'test1',
            xAxis: range[0]
          }, {
            xAxis: range[1]
          }
        ]
     */
    if (this.activeMarkAreas.length == 0) {
      // Cancel early if called before markAreas is set
      // otherwise the server will fail to parse
      return
    }

    let onsets = []
    let durations = []
    let descriptions = []
    let sr = store.getState().sampleRate

    this.activeMarkAreas.forEach((area) => {
      onsets.push(area[0].xAxis / sr)
      durations.push((area[1].xAxis - area[0].xAxis) / sr)
      descriptions.push(area[0].description)
    })

    netface.uploadAnnotations(onsets, durations, descriptions)
  }

  networkAnnotationsToMarkArea = (data) => {
    // Called once after data loads in
    /**
     * Current format
     * {
     *  description: {0: ---, 1: ---}
     *  duration: {0: ---, 1: ---}
     *  onset: {0: ---, 1: ---}
     * }
     */
    let sr = store.getState().sampleRate
    let onsets = data['onset'] // Onsets from network is in Milliseconds
    let durations = data['duration']
    let descriptions = data['description']

    let secToMilli = (num) => num / 1000

    for (let i = 0; i < Object.values(onsets).length; i++) {
      let minX = Math.ceil(secToMilli(onsets[i]) * sr)
      let maxX = Math.ceil(durations[i] * sr) + minX
      let desc = descriptions[i]

      this.activeMarkAreas.push(
        [
          {
            description: desc,
            xAxis: minX
          }, {
            xAxis: maxX
          }
        ]
      )
    }

    this.refreshMarkArea(false)
  }

  handleKeyDown = (event) => {
    if (!this.echartRef) return

    let keyCodes = {
      37: 'LEFT',
      38: 'UP',
      39: 'RIGHT',
      40: 'DOWN',

      32: 'SPACEBAR',
      8: 'BACKSPACE',
      13: 'ENTER'
    }
    let ctrl = event.ctrlKey || event.metaKey
    let key = keyCodes[event.keyCode]
    let sampleRate = store.getState().sampleRate

    if (key == 'SPACEBAR') {
      // Use this method to test anything as result of a keypress
      console.log(event)
      this.refreshMarkArea()
      return
    }
    
    if (key == 'BACKSPACE') {
      this.selectionClear()
      this.clearMarkedAxies()
      return
    }

    if (key == 'ENTER') {
      this.brushSelectionsToMarkArea()
      this.deleteMarkedAxies()
      return
    }
    
    if (key == 'LEFT' || key == 'RIGHT') {
      if (ctrl && event.altKey) {
        this.changeChunkSize(key == 'LEFT')
        return
      }

      if (key == 'LEFT') {
        this.moveLeft(ctrl)
      }
      if (key == 'RIGHT') {
        this.moveRight(ctrl)
      }
    }

    if (key == 'UP' || key == 'DOWN') {
      let echart = this.echartRef.getEchartsInstance()
      let zoomRate = 1.5
      let translateAmt = 0.5*this.yZoom
      if (key == 'UP') {
        if (ctrl) {
          this.yTranslate = this.yTranslate + translateAmt
        } else {
          this.yZoom = this.yZoom / zoomRate
        }
      }
      if (key == 'DOWN') {
        if (ctrl) {
          this.yTranslate = this.yTranslate - translateAmt
        } else {
          this.yZoom = this.yZoom * zoomRate
        }
      }
      echart.dispatchAction({
        type: 'dataZoom',
        dataZoomIndex: 1,
        start: 50 + this.yTranslate - this.yZoom,
        end: 50 + this.yTranslate + this.yZoom,
      })
    }
  }


  markAxisForDeletion = (xAxis) => {
    let key = xAxis.name
    this.axiesToRemove.push(key)
    console.log("Axies marked for deletion")
    console.log(this.axiesToRemove)
  }
  deleteMarkedAxies = () => {
    if (this.axiesToRemove.length == 0) return
    this.removedAxies.push(...this.axiesToRemove)
    this.clearMarkedAxies()
    this.refreshOptionsHard()
  }
  clearMarkedAxies = () => {
    this.axiesToRemove = []
  }


  /**
   * THIS COLLECTION OF FUNCTIONS HANDLES PANNING AROUND THE DATA
   * INCLUDING ALL NETWORK REQUESTS TO ROLL IN DATA AS NEEDED
   */
  moveLeft = (isCtrlPressed) => {
    if (this.blockScrollMovement) {
      return
    }

    let changeRate = this.chunkSize
    if (!isCtrlPressed) {
      changeRate = Math.ceil(changeRate / this.secPerChunk)
    }

    this.dz_start = this.dz_start - changeRate
    this.dz_end = this.dz_end - changeRate

    // Check for overflow
    if (this.bufferStartIndex + this.dz_start < 0) {
      this.dz_start = 0
      this.dz_end = this.dz_start + this.chunkSize
    }

    this.updateViewport()
  }

  moveRight = (isCtrlPressed) => {
    if (this.blockScrollMovement) {
      return
    }

    let changeRate = this.chunkSize
    if (!isCtrlPressed) {
      changeRate = Math.ceil(changeRate / this.secPerChunk)
    }

    this.dz_start = this.dz_start + changeRate
    this.dz_end = this.dz_end + changeRate

    // Check for overflow
    if (this.bufferStartIndex + this.dz_end > this.numSamples) {
      this.dz_end = this.numSamples - this.bufferStartIndex
      this.dz_start = this.dz_end - this.chunkSize
    }

    this.updateViewport()
  }

  updateViewport = () => {
    // Using the current values stored in xAxisZoom, ensure there's adequate data
    // on either side to buffer any data changes before moving left or right
    let echart = this.echartRef.getEchartsInstance()

    echart.dispatchAction({
      type: 'dataZoom',
      dataZoomIndex: 0,
      startValue: this.dz_start,
      endValue: this.dz_end,
    })

    this.positionBarRef.updatePosition(
      this.bufferStartIndex + this.dz_start,
      this.chunkSize,
      this.numSamples,
    )

    this.updateDataBuffer()
  }

  updateDataBuffer = () => {
    let echart = this.echartRef.getEchartsInstance()
    if (this.dz_start < this.threshold_left) {
      if (this.bufferStartIndex == 0) {
        return
      }
      echart.showLoading()
      this.rollDataLeft()
    } else if (this.dz_start >= this.threshold_right) {
      if (this.bufferStartIndex + this.totalBufferSize >= this.numSamples) {
        return
      }
      echart.showLoading()
      this.rollDataRight()
    }
  }

  rollDataLeft = () => {
    // next chunk indices refers to the indices of the actual data
    let prevChunkEnd = this.bufferStartIndex
    let prevChunkStart = (this.bufferStartIndex) - (this.numChunkBuffers * this.chunkSize)

    this.blockScrollMovement = true
    this.requestSamplesByIndex(prevChunkStart, prevChunkEnd)
      .then((data) => {
        let chunk = JSON.parse(data.eeg_chunk)
        let eegData = this.organizeEegData(chunk)

        // Postpend the data and remove prefix
        let len = 0
        for (let key in eegData) {
          // DANGER in len: may shift the viewport size
          len = eegData[key].length
          // Remove prefix and push new data
          this.state.eegData[key] = this.state.eegData[key].slice(0, this.state.eegData[key].length - len)
          this.state.eegData[key].unshift(...eegData[key])
        }

        // Apply a shift to the bufferStartIndex for further requests
        this.setBufferIndex(this.bufferStartIndex - len)
        this.dz_start = this.dz_start + len
        this.dz_end = this.dz_end + len

        // Refresh options
        this.refreshOptions()
        this.blockScrollMovement = false;
      })
  }

  rollDataRight = () => {
    // next chunk indices refers to the indices of the actual data
    let nextChunkStart = (this.bufferStartIndex) + this.totalBufferSize
    let nextChunkEnd = nextChunkStart + ((this.numChunkBuffers) * this.chunkSize)

    this.blockScrollMovement = true;
    this.requestSamplesByIndex(nextChunkStart, nextChunkEnd)
      .then((data) => {
        let chunk = JSON.parse(data.eeg_chunk)
        let eegData = this.organizeEegData(chunk)

        // Postpend the data and remove prefix
        let len = 0
        for (let key in eegData) {
          // DANGER in len: may shift the viewport size
          len = eegData[key].length
          // Remove prefix and push new data
          this.state.eegData[key] = this.state.eegData[key].slice(len)
          this.state.eegData[key].push(...eegData[key])
        }

        // Apply a shift to the bufferStartIndex for further requests
        this.setBufferIndex(this.bufferStartIndex + len)
        this.dz_start = this.dz_start - len
        this.dz_end = this.dz_end - len

        // Refresh options
        this.refreshOptions()
        this.blockScrollMovement = false;
      })
  }

  onScrollBarClick = (percentage) => {
    /**
     * Delete all data and zoom to a new buffer 
     * Placed here because it's much more like rollData methods
     */
    let echart = this.echartRef.getEchartsInstance()
    let totalNumChunkBuffers = (this.numChunkBuffers * 2) + 1
    
    // Round to nearest chunk size
    let zoomStart = Math.ceil(percentage * this.numSamples)
    zoomStart = Math.round(zoomStart / this.chunkSize) * this.chunkSize
    
    this.setBufferIndex(zoomStart - (this.numChunkBuffers * this.chunkSize))
    let fullBufferEnd = this.bufferStartIndex + (totalNumChunkBuffers * this.chunkSize)

    echart.showLoading()
    this.blockScrollMovement = true;
    this.requestSamplesByIndex(this.bufferStartIndex, fullBufferEnd)
      .then((data) => {
        let chunk = JSON.parse(data.eeg_chunk)
        let eegData = this.organizeEegData(chunk)

        // Postpend the data and remove prefix
        let len = 0
        for (let key in eegData) {
          // DANGER in len: may shift the viewport size
          len = eegData[key].length
          // Remove prefix and push new data
          this.state.eegData[key] = []
          this.state.eegData[key].push(...eegData[key])
        }

        // Apply a shift to the bufferStartIndex for further requests
        this.dz_start = this.numChunkBuffers * this.chunkSize
        this.dz_end = this.dz_start + this.chunkSize

        // Update viewport and scroll bar to the new position
        this.updateViewport()

        // Refresh options
        this.refreshOptions()
        echart.hideLoading()
        this.blockScrollMovement = false;
      })
  }

  refreshOptions = () => {
    let echart = this.echartRef.getEchartsInstance()
    let option = this.getOptions()
    echart.setOption(option)
    // Must be called AFTER echart Set option else it gets erased
    this.refreshMarkArea()
    echart.hideLoading()
  }
  refreshOptionsHard = () => {
    let echart = this.echartRef.getEchartsInstance()
    let option = this.getOptions()
    echart.showLoading()
    echart.setOption(option, true)
    // Must be called AFTER echart Set option else it gets erased
    this.refreshMarkArea()
    this.selectHorizontalMultiBrush()
    echart.hideLoading()
  }


  /**
   * THIS COLLECTION OF METHODS HANDLES NETWORK REQUESTS AND DATA ORGANIZATION
   */
  initialDataLoad = () => {
    this.requestSamplesByIndex(0, this.totalBufferSize)
      .then((data) => {
        let chunk = JSON.parse(data.eeg_chunk)
        let eegData = this.organizeEegData(chunk)
        this.pushDataToSeries(eegData)
          .then(() => {
            this.updateViewport()
            this.setState({})

            netface.requestAnnotations()
              .then(this.networkAnnotationsToMarkArea)
          })
      })
  }

  requestSamplesByIndex = (i_start, i_end) => {
    // Returns a promise representing a JSON of the data
    if (i_start < 0) {
      i_start = 0
    }
    if (i_end > this.numSamples) {
      i_end = this.numSamples
    }
    console.log(`Requesting samples [ ${i_start} : ${i_end}] `)
    return netface.requestSamplesByIndex(i_start, i_end)
      .then((data) => data.json())
  }

  pushDataToSeries = (data) => {
    return new Promise((resolve, reject) => {
      for (let key in data) {
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


  requestData = (n, N) => {
    // Download chunks (from index 0 -> arbitrary total)
    // If it's too heavy, raise total for smaller chunks
    // ### LEGACY METHOD

    // Use || n == <somenumber> to early stop for testing
    // if (n == 5) {
    if (n >= N) {
      let sum = 0
      for (let key in this.state.eegData) {
        sum += this.state.eegData[key].length
      }
      // Data has been loaded into state.eegData,
      console.log(`Data download complete! Sum: ${sum}`)
      // Download annotations
      netface.requestAnnotations()
        .then(this.networkAnnotationsToMarkArea)
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


  /**
   * This method configures the apache eCharts options to display multiple
   * electrode signals plotted against time
   */
  getOptions() {
    let grids = []
    let xAxies = []
    let yAxies = []
    let series = []
    
    let sampleRate = store.getState().sampleRate
    let keysArray = Object.keys(this.state.eegData)
    // Remove deleted keys
    keysArray = keysArray.filter((key) => {
      return !this.removedAxies.includes(key);
    });

    // Layout configuration
    function generateGridTops(grid_height, num_grids) {
      // Returns an array of the top value for each
      // grid to be represented by keysArray
      let padding = 4
      let render_limits = [0+padding, 100-padding]
      let jump_width = (100 - 2*padding) / num_grids
      var list = [];
      for (var i = render_limits[0]; i <= render_limits[1]; i += jump_width) {
        let adjusted_top = i - (grid_height / 2)  
        list.push(Math.ceil(adjusted_top));
      }
      return list
    }
    let height = 40
    let topsList = generateGridTops(height, keysArray.length)

    keysArray.forEach((key) => {
      let i = keysArray.indexOf(key)
      let grid_top = topsList[i] + "%"

      grids.push({
        id: key,
        left: '10%',
        right: '2%',
        top: grid_top,
        height: height + "%",
        show: true,
        name: key,
        tooltip: {
          show: true,
          trigger: 'axis',
          showDelay: 25
        },
        containLabel: false, // Help grids aligned by axis
        borderWidth: 0
      })

      xAxies.push({
        id: key,
        name: key,
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
            return (this.bufferStartIndex + parseInt(value)) / sampleRate
          }
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          show: true,
          interval: sampleRate - 1,
        },
        // Trigger event means you can click on name to register event
        triggerEvent: true,
        nameLocation: 'start',
      })

      // let scaleMax = new MyMaths().roundToNextDigit(Math.max(...this.state.eegData[key]))
      let scaleMax = 1
      let scaleMin = -scaleMax

      yAxies.push({
        id: key,
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
        // Programatically scale min/max
        min: scaleMin,
        max: scaleMax
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
        right: '4%',
        top: '0%',
        bottom: '4%',
        show: false,
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
            return (value + this.bufferStartIndex) / sampleRate
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
        
        name: 'backSplashSeries',
  
        data: new Array(this.state.eegData[arbitraryKey].length).fill(0),
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

      // toolbox hidden
      toolbox: {
        orient: 'vertical',
        show: false,
      },

      // Brush allows for selection that gets turned into markAreas
      brush: {
        toolbox: ['lineX', 'keep'],
        xAxisIndex: backsplashGridIndex
      },

      dataZoom: [
        {
          show: false,
          xAxisIndex: Object.keys(series),
          type: 'slider',
          bottom: '2%',
          startValue: this.dz_start,
          endValue: this.dz_end,
          preventDefaultMouseMove: true,

          zoomOnMouseWheel: false,
          moveOnMouseWheel: false,
          moveOnMouseMove: false,
        },
        {
          yAxisIndex: Object.keys(series),
          type: 'slider',
          top: '45%',
          filterMode: 'none',
          show: false,

          zoomOnMouseWheel: false,
          moveOnMouseWheel: false,
          moveOnMouseMove: false,

          id: 'eegGain',
          start: 50 - this.yZoom,
          end: 50 + this.yZoom,
        },{
          type: 'inside',
          yAxisIndex: Object.keys(series),

          zoomOnMouseWheel: false,
          moveOnMouseWheel: false,
          moveOnMouseMove: false,
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
          style={{
            height: '100%',
          }}
          />
        <PositionBar
          ref={(ref) => { this.positionBarRef = ref }}
          onClick={this.onScrollBarClick}
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
  overflow-y: scroll;
`;

class PositionBar extends React.Component {
  // Handles position and sends big jump zoom events to the
  // data zoom

  constructor(props) {
    super(props)

    this.state = {
      left: 0,
      width: 0,
      mousePerc: 0,
      hover: true
    }
  }

  onClick = (event) => {
    let bounds = this.parent.getBoundingClientRect();
    let x = event.clientX - bounds.left;
    let width = bounds.right - bounds.left;
    let perc = x / width

    this.props.onClick(perc)
  }

  updatePosition(leftZoomIndex, chunkSize, numSamples) {
    /**
     * Left zoom = bufferLeftIndex + datazoom left
     * chunkSize is chunkSize
     * numSamples is total num samples
     */
    this.setState({
      left: (leftZoomIndex / numSamples) * 100,
      width: Math.ceil((chunkSize / numSamples) * 100)
    })
  }

  renderBar = () => {
    return <div style={{
      backgroundColor: '#000000',
      top: '0px',
      marginLeft: `${this.state.left}%`,
      height: '100%',
      width: `${this.state.width}%`,
      minWidth: `10px`,
      borderRadius: '2px'
    }}>
    </div>
  }

  render = () => {
    return (
      <PositionParents
        onClick={this.onClick}
        ref={(ref) => {this.parent = ref}}
      >
        {this.renderBar()}
      </PositionParents>
    )
  }
}

const PositionParents = styled.div`
  background-color: #cccccc;
  height: 5px;
  border-radius: 2px;
  margin-left: 7.5%;
  margin-right: 2.5%;
  margin-top: 5px;
  margin-bottom: 5px;
  pointer-events: auto;
`;

class MyMaths {
  roundToNextDigit = (flt) => {
    if (flt <= 0) flt = flt * -1
    // For configuring max and min on yAxis scale
    // Flt should be a positive float
    // Find the order of the float
    let ctr = 0
    if (flt > 1) {
      while (flt > 1) {
        flt = flt / 10
        ctr = ctr + 1
      }
    } else if (flt > 0) {
      while (flt < 1) {
        flt = flt * 10
        ctr = ctr - 1
      }
    }
    if (ctr > 0) return 10**(ctr - 1)
    if (ctr < 0) return 10**(ctr + 1)
  }

  absoluteAvg = (array) => {
    return array.reduce((a, b) => {
      if (a < 0) a = a * -1
      if (b < 0) b = b * -1
      return a + b
    }) / array.length;
  }
}