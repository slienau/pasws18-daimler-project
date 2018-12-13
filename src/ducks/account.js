import api from '../lib/api'

export const SET_ACCOUNT_DATA = 'account/SET_ACCOUNT_DATA'

// reducers (pure functions, no side-effects!)
export default function account(state = {}, action) {
  switch (action.type) {
    case SET_ACCOUNT_DATA:
      const fullName = action.payload.firstName + ' ' + action.payload.lastName
      return {
        ...state,
        name: fullName,
        username: action.payload.username,
        email: action.payload.email,
        street: action.payload.address.street,
        city: action.payload.address.city,
        zip: action.payload.address.zipcode,
      }
    default:
      return state
  }
}

// actions (can cause side-effects)
export function fetchAccountData() {
  return async dispatch => {
    const {data} = await api.get('/account')
    dispatch(setAccountData(data))
  }
}

function setAccountData(accountData) {
  return {
    type: SET_ACCOUNT_DATA,
    payload: accountData,
  }
}
