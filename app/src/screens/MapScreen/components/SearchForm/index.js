import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import {
  OrderState,
  swapJourneyStartAndDestination,
  setPersonCount,
} from '../../../../ducks/map'
import {StyledSearchForm, StyledCard} from './StyledComponents'
import RouteSearched from './RouteSearched'
import SearchRoutes from './SearchRoutes'
import {connect} from 'react-redux'
import _ from 'lodash'

const SearchForm = props => {
  const formatTime = time => {
    if (!time) return
    return moment(time).format('LT')
  }

  const calculateDuration = () => {
    if (!props.routeInfo) return

    const arrival = _.get(props.routeInfo, 'userArrivalTime')
    const start = moment()
    const end = moment(arrival)
    const diff = end.diff(start) // diff in milliseconds
    if (diff / (1000 * 60) < 60) return end.from(start, true) // if diff is less than an hour, return 'xx minutes'
    return moment.utc(diff).format('HH:mm') + ' hours'
  }

  const calculateWaitingTime = () => {
    if (!props.routeInfo) return

    const departure = _.get(props.routeInfo, 'vanDepartureTime')
    const start = moment()
    const end = moment(departure)
    return start.to(end)
  }

  const destinationText = _.get(props.userDestinationLocation, 'title')
  const startText = _.get(props.userStartLocation, 'title')
  const personCount = props.personCount

  let content = null
  switch (props.orderState) {
    case OrderState.SEARCH_ROUTES:
      content = (
        <SearchRoutes
          onStartPress={() => props.toSearchView('START')}
          onDestinationPress={() => props.toSearchView('DESTINATION')}
          startText={startText}
          destinationText={destinationText}
          onSwapPress={() => props.swapJourneyStartAndDestination()}
          setPersonCount={p => props.setPersonCount(p)}
          personCount={personCount}
        />
      )
      break
    case OrderState.ROUTE_SEARCHED:
      content = (
        <RouteSearched
          startText={startText}
          destinationText={destinationText}
          departureTime={formatTime(_.get(props.routeInfo, 'vanDepartureTime'))}
          waitingTime={calculateWaitingTime()}
          durationTime={calculateDuration()}
          arrivalTime={formatTime(_.get(props.routeInfo, 'userArrivalTime'))}
        />
      )
      break
    default:
      return null
  }

  return (
    <StyledSearchForm>
      <StyledCard>{content}</StyledCard>
    </StyledSearchForm>
  )
}

SearchForm.propTypes = {
  orderState: PropTypes.string,
  personCount: PropTypes.number,
  routeInfo: PropTypes.object,
  setPersonCount: PropTypes.func,
  swapJourneyStartAndDestination: PropTypes.func,
  toSearchView: PropTypes.func,
  userDestinationLocation: PropTypes.object,
  userStartLocation: PropTypes.object,
}

export default connect(
  state => {
    return {
      personCount: state.map.personCount,
      orderState: state.map.orderState,
      routeInfo: state.map.routeInfo,
      userStartLocation: state.map.userStartLocation,
      userDestinationLocation: state.map.userDestinationLocation,
    }
  },
  dispatch => {
    return {
      swapJourneyStartAndDestination: () =>
        dispatch(swapJourneyStartAndDestination()),
      setPersonCount: persons => dispatch(setPersonCount(persons)),
    }
  }
)(SearchForm)
