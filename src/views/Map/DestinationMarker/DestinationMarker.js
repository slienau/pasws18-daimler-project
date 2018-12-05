import React from 'react'
import {Marker} from 'react-native-maps'
import PropTypes from 'prop-types'

const DestinationMarker = props => {
  return (
    <Marker
      coordinate={props.coordinate}
      title={props.title}
      description={props.description}
      image={require('./assets/marker.png')}
    />
  )
}

DestinationMarker.propTypes = {
  coordinate: PropTypes.object,
  description: PropTypes.string,
  title: PropTypes.string,
}

export default DestinationMarker
