import store from '../common/reducers';
import netface from '../common/network_interface';

class DataPaginator {
  /**
   * This class contains methods to smoothly paginate (ie, 
   * network request data as needed) to speed up the user
   * interaction process
   * 
   * This class is very tightly couples to the ElectrogramDisplay class
   */

  constructor(electrogramComponent) {
    // This is the source of truth variable for the EEG data
    this.eegData = {}
    // This is the pointer modify the echart directly
    this.echartRef = undefined
    // access to setState to refresh electrogram after data load
    this.electrogram = electrogramComponent

    // These variables are used for viewport control, leveraging
    // echarts setOption()
    // ALL MUST BE SET AFTER FILE UPLOADED SIGNAL
    this.sampleRate = null // samples per second
    this.secPerChunk = 10
    this.chunkSize = null // (updated later)
    this.numChunkBuffers = 5 // Num chunks on either side ofthe viewport
    this.totalBufferSize = null
    
    // Buffer start index is tied into markAreas which will save to file
    // Modified by electrogram
    this.bufferStartIndex = 0 // Index of loaded chunks relative to total num samples
    
    // Datazoom indices
    this.dz_start = 0
    this.dz_end = this.chunkSize

    // Thresholds on which to request more data
    // when dz_start passes over these values, it'll update
    this.threshold_left = null
    this.threshold_right = null


    // Movement flag to handle rapid pressing of the movment buttons
    this.blockScrollMovement = false
  }

  updateNavVariables() {
    // Must be called after Redis store receives info from file
    // upload. Called from Electrogram display

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

  setBufferIndex = (newIndex) => {
    // console.log(`New buffer index set: ${newIndex}`)
    if (newIndex < 0) {
      newIndex = 0
    }
    this.bufferStartIndex = newIndex
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
    this.updateDataBuffer()
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
    this.updateDataBuffer()
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

    // this.positionBarRef.updatePosition(
    //   this.bufferStartIndex + this.dz_start,
    //   this.chunkSize,
    //   this.numSamples,
    // )
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
          this.eegData[key] = this.eegData[key].slice(0, this.eegData[key].length - len)
          this.eegData[key].unshift(...eegData[key])
        }

        // Apply a shift to the bufferStartIndex for further requests
        this.setBufferIndex(this.bufferStartIndex - len)
        this.dz_start = this.dz_start + len
        this.dz_end = this.dz_end + len

        // Refresh options
        this.electrogram.refreshOptions()
        this.updateViewport()
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
          this.eegData[key] = this.eegData[key].slice(len)
          this.eegData[key].push(...eegData[key])
        }

        // Apply a shift to the bufferStartIndex for further requests
        this.setBufferIndex(this.bufferStartIndex + len)
        this.dz_start = this.dz_start - len
        this.dz_end = this.dz_end - len

        // Refresh options
        this.electrogram.refreshOptions()
        this.updateViewport()
        this.blockScrollMovement = false;
      })
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
            this.electrogram.setState({})
            this.updateViewport()

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
        if (!(key in this.eegData)) {
          this.eegData[key] = []
        }
        this.eegData[key].push(...data[key])
      }
      resolve()
    })
  }

  organizeEegData(chunk) {
    /*
      This methods takes in EEG Data from the network and organizes
      for simple appending to the eegData object

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

}

export default DataPaginator;