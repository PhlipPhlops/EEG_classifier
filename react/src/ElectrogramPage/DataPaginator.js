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
    this.secsInViewport = 10
    this.samplesInViewport = null
    // Number of viewports worth of data on either side of the viewport
    // to preload
    this.numPagesToPreload = 3
    // These vars marked for deletion
    this.totalBufferSize = null
    
    // Buffer start index is tied into markAreas which will save to file
    // Modified by electrogram
    this.bufferStartIndex = 0 // Index of loaded chunks relative to total num samples
    
    // Data buffer
    this.buffer = {
      pre: { // unloaded eeg data that belongs to earlier indices
        start_i: null,
        end_i: null,
        data: {},
      },
      post: { // unloaded eeg data that belongs to later indices
        start_i: null,
        end_i: null,
        data: {},
      },
      loaded: {
        start_i: null,
        end_i: null,
      },
      dz: { // datazoom values
        start_i: 0,
        end_i: null,
      }
    }

    // Thresholds on which to request more data
    // when buffer.dz.start_i passes over these values, it'll update
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
    this.samplesInViewport = Math.ceil(this.secsInViewport * this.sampleRate)

    this.totalBufferSize = this.samplesInViewport * (this.numPagesToPreload * 2 + 1)
    this.buffer.dz.end_i = this.buffer.dz.start_i + this.samplesInViewport
    
    // Updates on threshold of the last chunk in the buffer (or first)
    this.threshold_left = 2 * this.samplesInViewport
    this.threshold_right = (this.numPagesToPreload * 2 - 1) * this.samplesInViewport
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
      let echart = this.echartRef.getEchartsInstance()
      echart.showLoading()
      return
    }

    let changeRate = this.samplesInViewport
    if (!isCtrlPressed) {
      changeRate = Math.ceil(changeRate / this.secsInViewport)
    }

    this.buffer.dz.start_i = this.buffer.dz.start_i - changeRate
    this.buffer.dz.end_i = this.buffer.dz.end_i - changeRate

    // Check for overflow
    if (this.bufferStartIndex + this.buffer.dz.start_i < 0) {
      this.buffer.dz.start_i = 0
      this.buffer.dz.end_i = this.buffer.dz.start_i + this.samplesInViewport
    }

    this.updateViewport()
    this.updateBufferLeft(changeRate)
    // Legacy
    this.updateDataBuffer()
  }

  moveRight = (isCtrlPressed) => {
    if (this.blockScrollMovement) {
      let echart = this.echartRef.getEchartsInstance()
      echart.showLoading()
      return
    }

    let changeRate = this.samplesInViewport
    if (!isCtrlPressed) {
      changeRate = Math.ceil(changeRate / this.secsInViewport)
    }

    this.buffer.dz.start_i = this.buffer.dz.start_i + changeRate
    this.buffer.dz.end_i = this.buffer.dz.end_i + changeRate

    // Check for overflow
    if (this.bufferStartIndex + this.buffer.dz.end_i > this.numSamples) {
      this.buffer.dz.end_i = this.numSamples - this.bufferStartIndex
      this.buffer.dz.start_i = this.buffer.dz.end_i - this.samplesInViewport
    }

    this.updateViewport()
    this.updateBufferRight(changeRate)
    // Legacy
    this.updateDataBuffer()
  }

  updateViewport = () => {
    // Using the current values stored in xAxisZoom, ensure there's adequate data
    // on either side to buffer any data changes before moving left or right
    let echart = this.echartRef.getEchartsInstance()

    echart.dispatchAction({
      type: 'dataZoom',
      dataZoomIndex: 0,
      startValue: this.buffer.dz.start_i,
      endValue: this.buffer.dz.end_i,
    })

    // this.positionBarRef.updatePosition(
    //   this.bufferStartIndex + this.buffer.dz.start_i,
    //   this.samplesInViewport,
    //   this.numSamples,
    // )
  }

  updateBufferLeft = (changeRate) => {
    let chunkEnd = this.buffer.pre.start_i
    let chunkStart = chunkEnd - changeRate
    
    this.requestSamplesByIndex(chunkStart, chunkEnd)
      .then((data) => {
        // Update buffer indices
        this.buffer.pre.start_i = data.start_i
        // Load data into buffer
        console.log(`Left loaded: [${data.start_i}, ${data.end_i}]`)
      })
  }

  updateBufferRight = (changeRate) => {
    let chunkStart = this.buffer.post.end_i
    let chunkEnd = chunkStart + changeRate

    this.requestSamplesByIndex(chunkStart, chunkEnd)
      .then((data) => {
        // Update buffer indices
        this.buffer.post.end_i = data.end_i
        // Load data into buffer
        console.log(`Right loaded: [${data.start_i}, ${data.end_i}]`)
      })
  }

  updateDataBuffer = () => {
    /**
     * Called on every move
     * 
     * By the time this method is called, the viewport has been
     * updated (buffer.dz.start_i, and buffer.dz.end_i have been modified and dispatched)
     * 
     * Nextstep is to query for new data and add it to the databuffer
     * 
     * If a threshhold has been passed, rollData into the buffer,
     * chop off the old data and clear the buffer
     * Threshold defined as:
     *  if ONE more ctrl->move would attempt to view unloaded data
     *  thus if theres any less (strictly) than two viewports, update
     * 
     * If another move is requested before dataRoll is completed,
     * block movement and showLoading until it's done.
     */

    /// LEGACY
    if (this.buffer.dz.start_i < this.threshold_left) {
      if (this.bufferStartIndex == 0) {
        return
      }
      this.rollDataLeft()
    } else if (this.buffer.dz.start_i >= this.threshold_right) {
      if (this.bufferStartIndex + this.totalBufferSize >= this.numSamples) {
        return
      }
      this.rollDataRight()
    }
  }

  rollDataLeft = () => {
    // next chunk indices refers to the indices of the actual data
    let prevChunkEnd = this.bufferStartIndex
    let prevChunkStart = (this.bufferStartIndex) - (this.numPagesToPreload * this.samplesInViewport)

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
        this.buffer.dz.start_i = this.buffer.dz.start_i + len
        this.buffer.dz.end_i = this.buffer.dz.end_i + len

        // Refresh options
        this.electrogram.refreshOptions()
        this.updateViewport()
        this.blockScrollMovement = false;
      })
  }

  rollDataRight = () => {
    // next chunk indices refers to the indices of the actual data
    let nextChunkStart = (this.bufferStartIndex) + this.totalBufferSize
    let nextChunkEnd = nextChunkStart + ((this.numPagesToPreload) * this.samplesInViewport)

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
        this.buffer.dz.start_i = this.buffer.dz.start_i - len
        this.buffer.dz.end_i = this.buffer.dz.end_i - len

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

            this.buffer.loaded = {
              start_i: 0,
              end_i: this.totalBufferSize
            }
            this.buffer.pre = {
              start_i: 0,
              end_i: 0,
              data: {}
            }
            this.buffer.post = {
              start_i: this.totalBufferSize,
              end_i: this.totalBufferSize,
              data: {}
            }

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
      .then((data) => {
        data.start_i = i_start
        data.end_i = i_end
        return data
      })
  }

  pushDataToSeries = (data) => {
    /*
      This method expects data formatted as is returned  from
      organizeEegData and pushes it to the eegData object
     */
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