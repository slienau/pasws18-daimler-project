import {GET_ACCOUNT_DATA, UPDATE_ACCOUNT_DATA} from './../actions/actionTypes'

const initialState = {
  name: 'Vorname Nachname',
  email: 'somemail@example.com',
  username: 'username',
  street: 'Long Street',
  zip: 99999,
  city: 'NotBerlin',
  points: 768,
  miles: 46,
  visible: false,
}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_ACCOUNT_DATA:
      return {
        ...state,
      }
    case UPDATE_ACCOUNT_DATA:
      return {
        ...state,
      }
    default:
      return state
  }
}

export default reducer