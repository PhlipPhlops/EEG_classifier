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
    
    // Total number of pages to keep loaded into EEG Vizualizer
    this.numPagesToLoad = 4
    this.loadedDataWidth = null // Equates to numPages * samplesInViewport

    // These vars marked for deletion
    // Number of viewports worth of data on either side of the viewport
    // to preload
    // Buffer start index is tied into markAreas which will save to file
    // Modified by electrogram
    
    
    // Data buffer
    this.buffer = {
      pre: { // unloaded eeg data that belongs to earlier indices
        start_i: null,
        end_i: null,
        data: {},
        // Pre buffer data width should be one viewport width
        // or less if squished to the left side of totalData
      },
      post: { // unloaded eeg data that belongs to later indices
        start_i: null,
        end_i: null,
        data: {},
        // Pre buffer data width should be one viewport width
        // or less if squished to the right side of totalData
      },
      loaded: {
        start_i: 0, // Index of loaded chunks relative to total num samples
        end_i: null,
        // eegData is its own variable
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
    // These toplevel flags act as a gate
    // there is an event listening listening to datazoom events so
    // that the data roll code is only executed AFTER a zoom.
    // These flags are switches as to whether to execute that code
    this.rollFlags = {
      right: false,
      left: false,
    }


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

    this.loadedDataWidth = this.samplesInViewport * this.numPagesToLoad
    this.buffer.dz.end_i = this.buffer.dz.start_i + this.samplesInViewport
    
    // Updates on threshold of the last chunk in the buffer (or first)
    this.threshold_left = this.samplesInViewport // One page off the left edge
    this.threshold_right = this.loadedDataWidth - this.samplesInViewport // one page off the right edge

    // Register datazoom listeners
    this.registerRollDataEvents()
  }

  setBufferIndex = (newIndex) => {
    // console.log(`New buffer index set: ${newIndex}`)
    if (newIndex < 0) {
      newIndex = 0
    }
    this.buffer.loaded.start_i = newIndex
    this.buffer.loaded.end_i = newIndex + this.loadedDataWidth
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
    if (this.buffer.loaded.start_i + this.buffer.dz.start_i < 0) {
      this.buffer.dz.start_i = 0
      this.buffer.dz.end_i = this.buffer.dz.start_i + this.samplesInViewport
    }

    // Before viewport update, check if rollData should be triggered
    if (this.buffer.dz.start_i < this.threshold_left
      && this.buffer.loaded.start_i != 0) {
      // setting this to true executes this.rollDataLeft()
      // on the next datazoom (after viewport update)
      this.rollFlags.left = true
    }

    this.updateViewport()


    // this.updateBufferLeft(changeRate)
    // // Legacy
    // this.updateDataBuffer()
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
    if (this.buffer.loaded.start_i + this.buffer.dz.end_i > this.numSamples) {
      this.buffer.dz.end_i = this.numSamples - this.buffer.loaded.start_i
      this.buffer.dz.start_i = this.buffer.dz.end_i - this.samplesInViewport
    }

    console.log(this.buffer)
    console.log(this.threshold_left)
    console.log(this.threshold_right)

    if (this.buffer.dz.end_i > this.threshold_right
      && this.buffer.loaded.end_i < this.numSamples) {
      console.log("rollFlag.right set to true")
      // setting this to true executes this.rollDataRight()
      // on the next datazoom
      this.rollFlags.right = true
    }

    this.updateViewport()
  }

  registerRollDataEvents = () => {
    /**
     * Called once, this method adds event listenres to the
     * data zoom even to ensure some methods are only executed
     * AFTER the datazoom has been completed
     */
    let echart = this.echartRef.getEchartsInstance()
    echart.on('finished', () => {
      // Hypothetically this is only called after
      // actions have been completed; in this case, a datazoom
      if (this.rollFlags.left) {
        this.rollDataLeft()
      } else if (this.rollFlags.right) {
        this.rollDataRight()
      }
    })
    // echart.on('rendered', () => {
    //   console.log("after render")
    // })
    // echart.on('finished', () => {
    //   console.log('after finished')
    // })
  }

  updateViewport = () => {
    // Using the current values stored in xAxisZoom, ensure there's adequate data
    // on either side to buffer any data changes before moving left or right
    let echart = this.echartRef.getEchartsInstance()
    console.log("Before view dispatch?")

    echart.dispatchAction({
      type: 'dataZoom',
      dataZoomIndex: 0,
      startValue: this.buffer.dz.start_i,
      endValue: this.buffer.dz.end_i,
    })

    // this.positionBarRef.updatePosition(
    //   this.buffer.loaded.start_i + this.buffer.dz.start_i,
    //   this.samplesInViewport,
    //   this.numSamples,
    // )
  }

  rollDataLeft = () => {
    console.log("in rollDataLeft, flag is cleared")
    // Clear flag immediately to avoid double method calling
    this.rollFlags.left = false

    // next chunk indices refers to the indices of the actual data
    // let prevChunkEnd = this.buffer.loaded.start_i
    // let prevChunkStart = (this.buffer.loaded.start_i) - (this.numPagesToLoad * this.samplesInViewport)

    // this.blockScrollMovement = true
    // this.requestSamplesByIndex(prevChunkStart, prevChunkEnd)
    //   .then((eegData) => {

    //     // Postpend the data and remove prefix
    //     let len = 0
    //     for (let key in eegData) {
    //       // DANGER in len: may shift the viewport size
    //       len = eegData[key].length
    //       // Remove prefix and push new data
    //       this.eegData[key] = this.eegData[key].slice(0, this.eegData[key].length - len)
    //       this.eegData[key].unshift(...eegData[key])
    //     }

    //     // Apply a shift to the buffer.loaded.start_i for further requests
    //     this.setBufferIndex(this.buffer.loaded.start_i - len)
    //     this.buffer.dz.start_i = this.buffer.dz.start_i + len
    //     this.buffer.dz.end_i = this.buffer.dz.end_i + len

    //     // Refresh options
    //     this.electrogram.refreshOptions()
    //     this.updateViewport()
    //     this.blockScrollMovement = false;
    //   })
  }

  rollDataRight = () => {
    // Snaps data from buffer into the live eegData, removing far data
    console.log("In rollDataRight, flag is cleared")
    // Clear flag as soon as data roll is initted
    this.rollFlags.right = false

    // Buffer width variable uses the length of the retrieved data as
    // it's been adjusted by requestSamplesByIndex()'s overflow protection
    let bufferWidth = 0
    // Postpend the buffer's data and remove eegData from the far end
    let newData = this.buffer.post.data
    for (let key in newData) {
      bufferWidth = newData[key].length
      // Remove prefix and push new data
      this.eegData[key] = this.eegData[key].slice(bufferWidth)
      this.eegData[key].push(...newData[key])
    }
    console.log("-- done pushing data")

    // Apply a shift to the buffer.loaded.start_i to keep markAreas aligned
    this.setBufferIndex(this.buffer.loaded.start_i + bufferWidth)
    // Load data back into electrogram
    this.electrogram.refreshOptions()
    console.log("-- done refreshing options")
    
    // Shift viewport to be visually in the same position
    this.buffer.dz.start_i = this.buffer.dz.start_i - bufferWidth
    this.buffer.dz.end_i = this.buffer.dz.end_i - bufferWidth
    this.updateViewport()
    console.log("-- done updating viewport after options reset")
    // Give control back to the user
    this.blockScrollMovement = false;

    // Request new data to fill both buffers
    // Post Buffer
    this.buffer.post.start_i += bufferWidth
    this.buffer.post.end_i += bufferWidth
    this.requestSamplesByIndex(this.buffer.post.start_i, this.buffer.post.end_i)
      .then((eegData) => {
        this.buffer.post.data = eegData
        console.log("---- done downloading data")
      })

    // Pre buffer
    // WARNING: has pre indices been loaded yet? -> NOPE
    // this.buffer.pre.start_i += bufferWidth
    // this.buffer.pre.end_i += bufferWidth
    // this.requestSamplesByIndex(this.buffer.pre.start_i, this.buffer.pre.end_i)
    //   .then((eegData) => {
    //     this.buffer.pre.data = eegData
    //   })
    
    // request1
    // request2

    // // next chunk indices refers to the indices of the actual data
    // let nextChunkStart = (this.buffer.loaded.start_i) + this.loadedDataWidth
    // let nextChunkEnd = nextChunkStart + ((this.numPagesToLoad) * this.samplesInViewport)

    // this.blockScrollMovement = true;
    // this.requestSamplesByIndex(nextChunkStart, nextChunkEnd)
    //   .then((eegData) => {

    //     // Postpend the data and remove prefix
    //     let len = 0
    //     for (let key in eegData) {
    //       // DANGER in len: may shift the viewport size
    //       len = eegData[key].length
    //       // Remove prefix and push new data
    //       this.eegData[key] = this.eegData[key].slice(len)
    //       this.eegData[key].push(...eegData[key])
    //     }

    //     // Apply a shift to the buffer.loaded.start_i for further requests
    //     this.setBufferIndex(this.buffer.loaded.start_i + len)
    //     this.buffer.dz.start_i = this.buffer.dz.start_i - len
    //     this.buffer.dz.end_i = this.buffer.dz.end_i - len

    //     // Refresh options
    //     this.electrogram.refreshOptions()
    //     this.updateViewport()
    //     this.blockScrollMovement = false;
    //   })
  }



  /**
   * THIS COLLECTION OF METHODS HANDLES NETWORK REQUESTS AND DATA ORGANIZATION
   */
  initialDataLoad = () => {
    this.requestSamplesByIndex(0, this.loadedDataWidth)
      .then((eegData) => {
        this.pushDataToSeries(eegData)
          .then(() => {
            // Intiailize Buffer Meta Data
            this.buffer.loaded = {
              start_i: 0,
              end_i: this.loadedDataWidth
            }
            this.buffer.pre = {
              start_i: 0,
              end_i: 0,
              data: {}
            }

            // Display the electrogram and zoom
            this.electrogram.setState({})
            this.updateViewport()

            // Load up annotations
            netface.requestAnnotations()
              .then(this.networkAnnotationsToMarkArea)

            // Load up post page buffer
            this.buffer.post = {
              start_i: this.loadedDataWidth,
              end_i: this.loadedDataWidth + this.samplesInViewport,
              data: {}
            }
            let post = this.buffer.post
            this.requestSamplesByIndex(post.start_i, post.end_i)
              .then((data) => {
                this.buffer.post.data = data
              })
          })
      })
  }

  requestSamplesByIndex = (i_start, i_end) => {
    // Returns a promise representing a JSON of the data
    if (i_start < 0 || i_end < 0) {
      throw Error('Cannot request data of index < 0')
    }
    if (i_end > this.numSamples || i_start > this.numSamples) {
      throw Error('Cannot request data of index > numSamples')
    }
    console.log(`Requesting samples [ ${i_start} : ${i_end}] `)
    return netface.requestSamplesByIndex(i_start, i_end)
      .then((data) => data.json())
      .then((data) => {
        let chunk = JSON.parse(data.eeg_chunk)
        return this.organizeEegData(chunk)
      })
  }

  pushDataToSeries = (data) => {
    /*
      This method expects data formatted as is returned  from
      organizeEegData and pushes it to the eegData object

      Legacy method only used in the initialDataLoad for now
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