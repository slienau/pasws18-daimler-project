import React from 'react'
import _ from 'lodash'
import MapView from 'react-native-maps'
import PropTypes from 'prop-types'
import {Container} from 'native-base'
import Routes from '../MapScreen/Routes'
import MapMarkers from '../MapScreen/MapMarkers'
import styled from 'styled-components/native'
import {connect} from 'react-redux'

const StyledMapView = styled(MapView)`
  flex: 1;
`

const InRideMapScreen = props => {
  const mapRegion = {
    latitude: _.get(props.route, 'vanStartVBS.location.latitude'),
    longitude: _.get(props.route, 'vanStartVBS.location.longitude'),
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  }
  return (
    <Container>
      <StyledMapView
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={mapRegion}>
        <Routes hideStart />
        <MapMarkers />
      </StyledMapView>
    </Container>
  )
}

InRideMapScreen.propTypes = {
  route: PropTypes.object,
}

export default connect(state => ({
  route: _.get(state.map, 'routes.0'),
}))(InRideMapScreen)