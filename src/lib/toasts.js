export const NETWORK_TIMEOUT_TOAST = {
  text: 'Network connection timeout. Please check your internet connection.',
  duration: 10000,
  type: 'warning',
  position: 'bottom',
  buttonText: 'Okay',
}

export const DEFAULT_REQUEST_ERROR_TOAST = {
  text: "Couldn't get data from server.",
  duration: 10000,
  type: 'danger',
  position: 'bottom',
  buttonText: 'Okay',
}

export const UNEXPECTED_BEHAVIOUR_TOAST = {
  text: 'Something unexpected happened.',
  duration: 5000,
  type: 'danger',
  position: 'bottom',
  buttonText: 'Okay',
}

export function defaultDangerToast(message) {
  return {
    text: message,
    duration: 5000,
    type: 'danger',
    position: 'bottom',
    buttonText: 'Okay',
  }
}

export function defaultToast(message) {
  return {
    text: message,
    duration: 5000,
    position: 'bottom',
    buttonText: 'Okay',
  }
}
