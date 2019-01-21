import {Text, Body, Icon, Left, Right} from 'native-base'
import PropTypes from 'prop-types'
import {
  StyledCard,
  CardItemNoBorders,
  IconCenterFlex,
  TextDarkGray,
  ViewCentered,
  TextLarge,
  CardItemBorderBottom,
} from '../StyledComponents'
import React from 'react'

class DestinationWalkCardLarge extends React.Component {
  componentDidMount() {
    this.props.zoomToDestinationWalk()
  }

  render() {
    return (
      <StyledCard>
        <CardItemNoBorders button onPress={this.props.zoomToDestinationWalk}>
          <Left>
            <Icon name="walk" />
            <Body>
              <Text>{this.props.walkingDuration}</Text>
              <Text note>{this.props.walkingDistance}</Text>
            </Body>
          </Left>
          <IconCenterFlex type="Entypo" name="arrow-long-right" />
          <Right>
            <Text>{this.props.endAddress}</Text>
          </Right>
        </CardItemNoBorders>
        <CardItemBorderBottom>
          <Left>
            <Icon name="bus" />
            {/* <Body> */}
            <Text>Van arrival: {this.props.vanArrival}</Text>
            {/* <TextGreen note>{this.props.waitingTime}</TextGreen> */}
            {/* </Body> */}
          </Left>
        </CardItemBorderBottom>
        <CardItemNoBorders>
          <Body>
            <ViewCentered>
              <TextLarge>{this.props.vanId}</TextLarge>
              <TextDarkGray>Van number</TextDarkGray>
            </ViewCentered>
          </Body>
        </CardItemNoBorders>
      </StyledCard>
    )
  }
}

DestinationWalkCardLarge.propTypes = {
  endAddress: PropTypes.string,
  vanArrival: PropTypes.string,
  vanId: PropTypes.number,
  walkingDistance: PropTypes.string,
  walkingDuration: PropTypes.string,
  zoomToDestinationWalk: PropTypes.func,
}

export default DestinationWalkCardLarge
