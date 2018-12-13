import React, {Component} from 'react'
import {Container, Button, Text, Icon, Fab} from 'native-base'

import Map from '../Map'
import styled from 'styled-components/native'

// For bottom button
const StyledButton = styled(Button)`
  position: absolute;
  left: 30%;
  right: 30%;
  bottom: 4%;
`

// For bottom button
const StyledFab = styled(Fab)`
  margin-bottom: 55px;
`
// For bottom button
const StyledMenu = styled(Fab)`
  margin-top: 5px;
  background-color: gray;
`

export default class Welcome extends Component {
  // DrawNavigator settings
  static navigationOptions = {
    drawerIcon: () => <Icon name="map" />,
  }

  constructor(props) {
    super(props)

    this.state = {
      userLocationMarker: null,
      destinationMarker: null,
      routing: null,
      error: null,
      marker: {
        region: {
          latitude: 52.509663,
          longitude: 13.376481,
          latitudeDelta: 0.01,
          longitudeDelta: 0.1,
        },
      },
    }
  }

  // sets location for start and destination
  onSearchRoutes() {
    this.setState({
      marker: {
        userLocationMarker: 'nul',
        destinationMarker: 'keks',
        routing: 'schokokeks',
      },
    })
  }

  // shows current position on the map
  showCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      position => {
        this.setState({
          marker: {
            region: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.1,
            },
            currentLatitude: position.coords.latitude,
            currentLongitude: position.coords.longitude,
            error: null,
          },
        })
      },
      error => this.setState({error: error.message}),
      {enableHighAccuracy: false, timeout: 200000, maximumAge: 1000}
    )
  }

  render() {
    console.log(this.state.marker)
    return (
      <Container>
        {/* Header with menu-slider (without header or transparent header?) */}

        {/* Map */}
        <Map {...this.state.marker} />
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
          containerStyle={{}}
          position="bottomRight"
          onPress={() => this.showCurrentLocation()}>
          <Icon name="locate" />
        </StyledFab>

        {/* button for searching route */}
        <StyledButton
          rounded
          iconRight
          light
          onPress={() => this.onSearchRoutes()}>
          <Text>destination </Text>
          <Icon name="arrow-forward" />
        </StyledButton>
      </Container>
    )
  }
}
