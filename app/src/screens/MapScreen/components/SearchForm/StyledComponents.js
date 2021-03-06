import styled from 'styled-components/native'
import {TouchableOpacity, View} from 'react-native'
import {Card, CardItem, Icon, Text} from 'native-base'
import NumericInput from 'react-native-numeric-input'

export const StyledSearchForm = styled(View)`
  width: 98%;
  align-self: center;
`
export const StyledTouchableOpacity = styled(TouchableOpacity)`
  align-self: flex-end;
`

export const StyledNumericInput = styled(NumericInput)`
  align-items: flex-end;
`

export const TextFlex = styled(Text)`
  flex: 1;
`
export const TextFlexGray = styled(Text)`
  color: gray;
  flex: 1;
`
export const TextDarkGray = styled(Text)`
  color: rgb(90, 90, 90);
`
export const TextBoldBlue = styled(Text)`
  color: #3f51b5;
  font-weight: bold;
`

export const IconBlack = styled(Icon)`
  color: black;
  font-size: 26;
`

export const StyledCard = styled(Card)`
  border-radius: 10;
  align-items: stretch;
`
export const CardItemBorderBottom = styled(CardItem)`
  border-radius: 10;
  border-bottom-width: 1;
  border-bottom-color: rgb(230, 230, 230);
`
export const CardItemNoBorders = styled(CardItem)`
  border-radius: 10;
`
