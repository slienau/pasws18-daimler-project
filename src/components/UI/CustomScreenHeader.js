import {Body, Button, Header, Icon, Left, Title} from 'native-base'
import React from 'react'
import {StyleSheet} from 'react-native'
import PropTypes from 'prop-types'
import {DARK_COLOR, LIGHT_COLOR} from './colors'

const CustomScreenHeader = props => {
  let leftContent = null
  if (props.onPress) {
    leftContent = (
      <Left>
        <Button transparent>
          <Icon name={props.icon || 'arrow-back'} onPress={props.onPress} />
        </Button>
      </Left>
    )
  }
  return (
    <Header style={styles.header}>
      {leftContent}
      <Body>
        <Title style={styles.title}>{props.title}</Title>
      </Body>
    </Header>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: DARK_COLOR,
  },
  title: {
    color: LIGHT_COLOR,
    fontWeight: 'bold',
  },
})

CustomScreenHeader.propTypes = {
  icon: PropTypes.string,
  onPress: PropTypes.func,
  title: PropTypes.string,
}

export default CustomScreenHeader