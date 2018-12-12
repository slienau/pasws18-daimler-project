import React from 'react'
import {
  AsyncStorage,
  TouchableWithoutFeedback,
  Image,
  StyleSheet,
} from 'react-native'
import {connect} from 'react-redux'
import styled from 'styled-components/native'
import {
  Container,
  Content,
  Button,
  Right,
  Icon,
  Left,
  Body,
  List,
  ListItem,
  Text,
  Thumbnail,
  Header,
  Title,
} from 'native-base'
import Dialog, {DialogContent, ScaleAnimation} from 'react-native-popup-dialog'
import PropTypes from 'prop-types'
import {fetchAccountData} from '../../ducks/account'

const StyledView = styled.View`
  flex: 1;
  align-items: stretch;
`

class Account extends React.Component {
  static propTypes = {
    account: PropTypes.object,
    onFetchAccountData: PropTypes.func,
  }

  // DrawNavigator settings
  static navigationOptions = {
    drawerIcon: () => <Icon name="person" />,
  }

  state = {
    avatarVisible: false,
  }

  componentDidMount() {
    this.props.onFetchAccountData()
  }

  logout = async () => {
    await AsyncStorage.clear()
    this.props.navigation.navigate('Login')
  }

  render() {
    const uri =
      'https://www.thehindu.com/sci-tech/technology/internet/article17759222.ece/alternates/FREE_660/02th-egg-person'
    return (
      <StyledView>
        <Container>
          {/* Header with menu-slider (without header or transparent header?) */}
          <Header>
            <Left>
              <Button transparent>
                <Icon
                  name="menu"
                  onPress={() => this.props.navigation.openDrawer()}
                />
              </Button>
            </Left>
            <Body>
              <Title>Account</Title>
            </Body>
          </Header>

          <Content>
            <Dialog
              height={0.5}
              visible={this.state.avatarVisible}
              onTouchOutside={() => {
                this.setState({
                  avatarVisible: false,
                })
              }}
              dialogAnimation={new ScaleAnimation({})}>
              <DialogContent>
                <Image style={styles.dialogImage} source={{uri: uri}} />
              </DialogContent>
            </Dialog>

            <List>
              <ListItem>
                <Left>
                  <TouchableWithoutFeedback
                    onPress={() => {
                      this.setState({
                        avatarVisible: true,
                      })
                    }}>
                    <Thumbnail large source={{uri: uri}} />
                  </TouchableWithoutFeedback>
                </Left>
                <Right style={styles.rightColumn}>
                  <Text>{this.props.account.username}</Text>
                  <Button onPress={this.logout}>
                    <Text>Log out</Text>
                  </Button>
                </Right>
              </ListItem>

              <ListItem itemDivider>
                <Text>Details</Text>
              </ListItem>
              <ListItem icon>
                <Left>
                  <Icon name="person" />
                </Left>
                <Body>
                  <Text>Name</Text>
                </Body>
                <Right>
                  <Text>{this.props.account.name}</Text>
                </Right>
              </ListItem>
              <ListItem icon>
                <Left>
                  <Icon name="mail" />
                </Left>
                <Body>
                  <Text>E-Mail</Text>
                </Body>
                <Right>
                  <Text>{this.props.account.email}</Text>
                </Right>
              </ListItem>
              <ListItem icon button onPress={() => {}}>
                <Left>
                  <Icon name="card" />
                </Left>
                <Body>
                  <Text>Payment Information</Text>
                </Body>
                <Right>
                  <Icon name="arrow-forward" />
                </Right>
              </ListItem>

              <ListItem itemDivider>
                <Text>Address information</Text>
              </ListItem>
              <ListItem icon>
                <Left>
                  <Text>Street</Text>
                </Left>
                <Body />
                <Right>
                  <Text>{this.props.account.street}</Text>
                </Right>
              </ListItem>
              <ListItem icon>
                <Left>
                  <Text>Zip Code</Text>
                </Left>
                <Body />
                <Right>
                  <Text>{this.props.account.zip}</Text>
                </Right>
              </ListItem>
              <ListItem icon>
                <Left>
                  <Text>City</Text>
                </Left>
                <Body />
                <Right>
                  <Text>{this.props.account.city}</Text>
                </Right>
              </ListItem>

              <ListItem itemDivider>
                <Text>Loyalty Program</Text>
              </ListItem>
              <ListItem icon>
                <Left>
                  <Icon active name="star" style={styles.starIcon} />
                </Left>
                <Body>
                  <Text>Loyalty Points</Text>
                </Body>
                <Right>
                  <Text>{this.props.account.points}</Text>
                </Right>
              </ListItem>
              <ListItem icon>
                <Left>
                  <Icon name="bus" style={styles.busIcon} />
                </Left>
                <Body>
                  <Text>Driven Kilometers</Text>
                </Body>
                <Right>
                  <Text>{this.props.account.miles}</Text>
                </Right>
              </ListItem>
              <ListItem icon button onPress={() => {}}>
                <Left>
                  <Icon name="unlock" style={styles.unlockIcon} />
                </Left>
                <Body>
                  <Text>Rewards</Text>
                </Body>
                <Right>
                  <Icon name="arrow-forward" />
                </Right>
              </ListItem>
            </List>
          </Content>
        </Container>
      </StyledView>
    )
  }
}

const palegoldenrod = 'palegoldenrod'
const dodgerblue = 'dodgerblue'
const gold = 'gold'

const styles = StyleSheet.create({
  unlockIcon: {
    color: palegoldenrod,
  },
  busIcon: {
    color: dodgerblue,
  },
  starIcon: {
    color: gold,
  },
  dialogImage: {
    // height: 100,
    width: 500,
    flex: 1,
    resizeMode: 'contain',
  },
  rightColumn: {
    flexDirection: 'column',
  },
})

const mapStateToProps = state => {
  return {
    account: state.account,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    onFetchAccountData: () => dispatch(fetchAccountData()),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Account)
