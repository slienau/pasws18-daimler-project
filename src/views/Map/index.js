import React from 'react'
import {Alert} from 'react-native'
import styled from 'styled-components/native'
import MapView from 'react-native-maps'
import MapEncodedPolyline from '../../components/MapEncodedPolyline'
import PropTypes from 'prop-types'
import _ from 'lodash'
import Marker from './Marker'
import SearchForm from '../Map/SearchForm'
import BottomButtons from '../Map/BottomButtons'
import {createStackNavigator} from 'react-navigation'
import SearchView from './SearchView'
import {connect} from 'react-redux'
import * as act from '../../ducks/map'
import {Container, Icon, Fab} from 'native-base'
import api from '../../lib/api'

/* const StyledContainer = styled(Container)`
  flex: 1;
  align-items: center;
  justify-content: center;
` */

const StyledMapView = styled(MapView)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin-bottom: ${props => props.marginBottom};
`
// For bottom button
const StyledMenu = styled(Fab)`
  margin-top: 5px;
  background-color: gray;
`

const StyledFab = styled(Fab)`
  margin-bottom: 55;
`

const MapState = {
  INIT: 'INIT',
  SEARCH_ROUTES: 'SEARCH_ROUTES',
  ROUTE_SEARCHED: 'ROUTE_SEARCHED',
  ROUTE_ORDERED: 'ROUTE_ORDERED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
}

const ANIMATION_DUR = 1500

class Map extends React.Component {
  state = {
    mapState: MapState.INIT,
    destinationButton: true,
    userLocationMarker: false,
    placeOrderButton: false,
    cancelOrderButton: false,
    destinationMarker: null,
    routes: null,
    error: null,
    initialRegion: {
      latitude: 52.509663,
      longitude: 13.376481,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    },
  }

  showCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      position => {
        this.setState({
          currentLocation: position.coords,
        })
        if (this.state.mapState === MapState.SEARCH_ROUTES) {
          const coords = [
            this.state.destinationMarker.location,
            position.coords,
          ]
          this.mapRef.fitToCoordinates(coords, {
            edgePadding: {top: 400, right: 100, left: 100, bottom: 350},
            animated: true,
          })
        } else {
          this.mapRef.animateToRegion(
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.001,
            },
            ANIMATION_DUR
          )
        }
      },
      error => this.setState({error: error.message}),
      {enableHighAccuracy: true, timeout: 200000, maximumAge: 1000}
    )
  }

  renderBottomButtons() {
    return [
      // destination button
      <BottomButtons
        key={0}
        visible={this.state.mapState === MapState.INIT}
        iconRight
        addFunc={() =>
          this.props.navigation.navigate('Search', {
            predefinedPlaces: _.uniqBy(this.props.map.searchResults, 'id'),
            onSearchResult: (data, details) =>
              this.handleSearchResult(data, details),
          })
        }
        text="destination"
        iconName="arrow-forward"
        bottom="3%"
      />,
      // back button
      <BottomButtons
        key={1}
        visible={this.state.mapState === MapState.SEARCH_ROUTES}
        iconLeft
        addFunc={() => {
          this.setState({
            mapState: MapState.INIT,
            destinationMarker: null,
            routes: null,
          })
        }}
        text=""
        iconName="arrow-back"
        left="10%"
        right="70%"
        bottom="3%"
      />,
      // search routes button
      <BottomButtons
        key={2}
        visible={this.state.mapState === MapState.SEARCH_ROUTES}
        iconRight
        addFunc={() => this.fetchRoutes()}
        text="Search Route"
        iconName="arrow-forward"
        left="45%"
        right="10%"
        bottom="3%"
      />,
      // place order button
      <BottomButtons
        visible={this.state.mapState === MapState.ROUTE_SEARCHED}
        iconRight
        key={3}
        addFunc={() => alert('TODO - Place Order function')}
        text="Place Order"
        iconName="arrow-forward"
        left="42%"
        right="10%"
        bottom="3%"
      />,
      // cancel order button
      <BottomButtons
        visible={this.state.mapState === MapState.ROUTE_SEARCHED}
        iconLeft
        key={4}
        addFunc={() =>
          Alert.alert(
            'Cancel Order',
            'Are you sure to cancel your order?',
            [
              {
                text: 'Yes',
                onPress: () => {
                  this.routing = null
                  this.setState({mapState: MapState.SEARCH_ROUTES})
                },
                style: 'cancel',
              },
              {text: 'No', onPress: () => console.log('No Pressed')},
            ],
            {cancelable: false}
          )
        }
        text="Cancel"
        iconName="close"
        left="10%"
        right="60%"
        bottom="3%"
      />,
    ]
  }

  showCurrentLocation = () => {
    this.setState({
      userLocationMarker: true,
    })
  }

  handleSearchResult = (data, details) => {
    if (!details) return
    details.description = details.name
    this.props.addSearchResult(details)
    const destinationLocation = {
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
    }
    switch (this.state.mapState) {
      case MapState.INIT:
        this.setState({
          mapState: MapState.SEARCH_ROUTES,
          destinationMarker: {
            location: destinationLocation,
            title: details.name,
            description: details.vicinity,
          },
        })
        this.mapRef.animateToRegion(
          {
            latitude: details.geometry.location.latitude,
            longitude: details.geometry.location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          ANIMATION_DUR
        )
        break
      case MapState.SEARCH_ROUTES:
        this.setUserLocationMarker(
          details.geometry.location,
          details.name,
          details.vicinity
        )
        this.setState({
          mapState: MapState.SEARCH_ROUTES, // stay in SEARCH_ROUTES
        })
        const coords = [this.state.currentLocation, destinationLocation]
        this.mapRef.fitToCoordinates(coords, {
          edgePadding: {top: 400, right: 100, left: 100, bottom: 350},
          animated: true,
        })
        break
    }
  }

  fetchRoutes = async () => {
    const routesPayload = {
      start: _.pick(this.state.currentLocation, ['latitude', 'longitude']),
      destination: this.state.destinationMarker.location,
    }
    try {
      const {data} = await api.post('/routes', routesPayload)
      this.setState({routes: data})
    } catch (e) {
      console.warn(e)
      this.setState({routes: null})
    }
  }

  renderRoutes = () => {
    if (!this.state.routes || !this.state.routes.length) return
    const colors = ['red', 'green', 'blue']
    return ['toStartRoute', 'vanRoute', 'toDestinationRoute']
      .map(r =>
        _.get(this.state.routes[0][r], 'routes.0.overview_polyline.points')
      )
      .map((p, i) => (
        <MapEncodedPolyline
          key={i}
          points={p}
          strokeWidth={3}
          strokeColor={colors[i]}
        />
      ))
  }

  render() {
    return (
      <Container>
        <StyledMapView
          ref={ref => {
            this.mapRef = ref
          }}
          initialRegion={this.state.initialRegion}
          showsMyLocationButton={false}
          showsUserLocation
          followsUserLocation>
          {this.state.userLocationMarker && (
            <Marker
              location={this.state.currentLocation}
              title={'My Current Location'}
              image="person"
            />
          )}
          {this.state.destinationMarker && (
            <Marker image="destination" {...this.state.destinationMarker} />
          )}
          {this.renderRoutes()}
        </StyledMapView>
        <SearchForm
          onStartPress={() => {
            this.props.navigation.navigate('Search')
          }}
          onDestinationPress={() => {
            this.props.navigation.navigate('Search')
          }}
          visible={this.state.mapState === MapState.SEARCH_ROUTES}
          text={_.get(this.state, 'destinationMarker.title')}
          startText={null}
        />
        <StyledMenu
          active={this.state.active}
          direction="up"
          containerStyle={{}}
          position="topLeft"
          onPress={() => this.props.navigation.openDrawer()}>
          <Icon name="menu" />
        </StyledMenu>

        {/* Floating Button to show current location */}
        <StyledFab
          active={this.state.active}
          direction="up"
          position="bottomRight"
          onPress={() => this.showCurrentLocation()}>
          <Icon name="locate" />
        </StyledFab>

        {this.renderBottomButtons()}
      </Container>
    )
  }
}

Map.propTypes = {
  addSearchResult: PropTypes.func,
  map: PropTypes.object,
}

const MapScreen = connect(
  state => ({
    map: state.map,
  }),
  dispatch => ({
    addSearchResult: result => {
      dispatch(act.addSearchResultAction(result))
    },
  })
)(Map)

// we create a stack navigator with the map as default and the search view, so that it can be placed on top
// of the map to get the start and destination
export default createStackNavigator(
  {
    Map: {
      screen: MapScreen,
      navigationOptions: () => ({
        header: null,
        drawerIcon: () => <Icon name="map" />,
      }),
    },
    Search: {
      screen: SearchView,
    },
  },
  {
    initialRouteName: 'Map',
  }
)
