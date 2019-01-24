import React from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import MapMarker from '../../../components/MapMarker'
import {connect} from 'react-redux'
import {MapState} from '../../../ducks/map'

const MapMarkers = props => {
  return (
    <>
      {props.routes && props.routes.length && (
        <>
          <MapMarker
            location={_.get(props.routes[0], 'startStation.location')}
            title={'Start station'}
            image="vbs"
          />
          <MapMarker
            location={_.get(props.routes[0], 'endStation.location')}
            title={'End station'}
            image="vbs"
          />
        </>
      )}
      {props.journeyStart && (
        <MapMarker
          location={props.journeyStart.location}
          title={'My Current Location'}
          image="person"
        />
      )}
      {props.journeyDestination && (
        <MapMarker image="destination" {...props.journeyDestination} />
      )}
      {[MapState.INIT, MapState.SEARCH_ROUTES].includes(props.mapState) &&
        props.vans &&
        props.vans.map((v, i) => <MapMarker key={i} image="van" {...v} />)}
      {[MapState.ROUTE_ORDERED].includes(props.mapState) &&
        props.activeOrderStatus && (
          <MapMarker
            image="van"
            location={props.activeOrderStatus.vanPosition}
          />
        )}
    </>
  )
}

MapMarkers.propTypes = {
  activeOrderStatus: PropTypes.object,
  journeyDestination: PropTypes.object,
  journeyStart: PropTypes.object,
  mapState: PropTypes.string,
  routes: PropTypes.array,
  vans: PropTypes.array,
}

export default connect(state => ({
  activeOrderStatus: state.orders.activeOrderStatus,
  journeyDestination: state.map.journeyDestination,
  journeyStart: state.map.journeyStart,
  mapState: state.map.mapState,
  routes: state.map.routes,
  vans: state.map.vans,
}))(MapMarkers)
