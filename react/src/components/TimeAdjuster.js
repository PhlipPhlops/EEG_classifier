import React from 'react'
import styled from 'styled-components'
import store from '../common/reducers';


export default class TimeAdjuster extends React.Component {
  // Talks directly to redux

  constructor(props) {
    super(props)
    this.timestamp = null
  }

  handleKeyDown = (e) => {
    if (e.key == 'Enter') {
      this.sendTimeAdjustment()
    }
  }

  sendTimeAdjustment = () => {
    if (this.timestamp == null) {
      return
    }

    // Convert to seconds
    var a = this.timestamp.split(':'); // split it at the colons
    // minutes are worth 60 seconds. Hours are worth 60 minutes.
    var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]); 
    
    store.dispatch({
      type: 'client/adjust_timestamp',
      timeDisplayAdjustment: seconds
    })
  }

  render () {
    return (
      <input
        type="time"
        step="1"
        onKeyDown={this.handleKeyDown}
        onBlur={this.sendTimeAdjustment}
        onChange={(event) => {
          this.timestamp = event.target.value
        }}
        />
    )
  }
}