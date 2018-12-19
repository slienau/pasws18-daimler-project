const rpn = require('request-promise-native')
const EnvVariableService = require('../services/envVariableService.js')

class GoogleMapsHelper {
  static async googleAPICall (start, destination, vb1, vb2, time) {

    const responses = []
    const key = EnvVariableService.apiKey()

    // First API Call to get to Virtual Bus stop
    const url1 = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${vb1.location.latitude},${vb1.location.longitude}&key=${key}&mode=walking`
    console.log(url1)

    const response1 = await rpn({uri: url1, json: true})
    const duration1 = this.readDurationFromGoogleResponse(response1)
    responses.push(response1)

    // Second API Call to get to second Virtual Bus stop
    const time2 = parseInt(new Date(time).getTime() / 1000 + duration1)
    const url2 = `https://maps.googleapis.com/maps/api/directions/json?origin=${vb1.location.latitude},${vb1.location.longitude}&destination=${vb2.location.latitude},${vb2.location.longitude}&key=${key}&mode=driving&departure_time=${time2}`
    console.log(url2)

    const response2 = await rpn({uri: url2, json: true})
    const duration2 = this.readDurationFromGoogleResponse(response2)
    responses.push(response2)

    // Third API Call to get to destination
    const time3 = time2 + duration2
    const url3 = `https://maps.googleapis.com/maps/api/directions/json?origin=${vb2.location.latitude},${vb2.location.longitude}&destination=${destination.latitude},${destination.longitude}&key=${key}&mode=walking&departure_time=${time3}`
    console.log(url3)

    const response3 = await rpn({uri: url3, json: true})
    responses.push(response3)
    return responses
  }

  // Returns the route's traveltime in seconds
  static readDurationFromGoogleResponse (googleresponse) {
    return googleresponse.routes[0].legs[0].duration.value
  }
}

module.exports = GoogleMapsHelper
