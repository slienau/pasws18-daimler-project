const GoogleMapsHelper = require('../services/GoogleMapsHelper.js')
const Route = require('../models/Route.js')
const Order = require('../models/Order.js')
const geolib = require('geolib')
// const VirtualBusStop = require('../models/VirtualBusStop.js')
const _ = require('lodash')
const Logger = require('./WinstonLogger').logger

const tenMinutes = 10 * 60 * 1000

class ManagementSystem {
  /*
      gets the next step (waypoint) on the route of the van that is at least 120 seconds ahead or the next way point and the duration
      it takes to get there
      if the van has only one next bus stop left, its meaning that the van is directly riding to the destionation, so in this case we can just
      take the step that is at least secondsAhead seconds ahead on the route
    */
  static getStepAheadOnCurrentRoute (vanId, secondsAhead = 120) {
    let van = this.vans[vanId - 1]
    let currentTime = new Date()
    if (van.nextRoutes.length > 0) {
      let steps = van.nextRoutes[0].routes[0].legs[0].steps
      let seconds = (van.lastStepTime - currentTime) / 1000
      for (let step = van.currentStep; step < steps.length; step++) {
        seconds += steps[step].duration.value
        if (seconds >= secondsAhead) {
          let location = {
            latitude: steps[step].end_location.lat,
            longitude: steps[step].end_location.lng
          }
          return [location, seconds, step] // equal to steps[step+1].start_location
        }
      }
    }
    return []
  }

  static getRemainingRouteDuration (van) {
    let duration = 0
    if (van.nextRoutes.length > 0) {
      // add remaining duration of current route
      duration += GoogleMapsHelper.readDurationFromGoogleResponseFromStep(van.nextRoutes[0], van.currentStep)
      // add duration of all future routes
      duration += van.nextRoutes.slice(1).reduce((acc, route) => acc + GoogleMapsHelper.readDurationFromGoogleResponse(route), 0)
    }
    return duration
  }

  static async getPossibleVans (fromVB, toVB, walkingTimeToStartVB) {
    const possibleVans = []
    for (let counter = 0; counter < this.numberOfVans; counter++) {
      const van = this.vans[counter]
      // Test 1 Gibt es potentialRoute --> dann gesperrt, wenn nicht eigene Route
      if (van.potentialRoute != null) {
        continue
      }

      // test 2 van is not driving at all and ready to take the route
      if (van.nextRoutes.length === 0 && !van.waiting) {
        // calculate duration how long the van would need to the start vb
        const toStartVBRoute = await GoogleMapsHelper.simpleGoogleRoute(van.location, fromVB.location)
        possibleVans.push({
          vanId: van.vanId,
          toStartVBRoute: toStartVBRoute,
          toStartVBDuration: GoogleMapsHelper.readDurationFromGoogleResponse(toStartVBRoute)
        })
        continue
      }

      // Test 2 van already has a route/order, but is not pooled yet and destination vb is equal
      // currently only allow pooling for vans that are not waiting
      if (!van.currentlyPooling && _.last(van.nextStops).vb.equals(toVB) && !van.waiting) {
        let referenceWayPoint, referenceWayPointDuration, potentialCutOffStep
        const threshold = 570 // in seconds, 10mins minus 30s for hopping on

        if (walkingTimeToStartVB > threshold) {
          // the passenger needs more than 10mins to the start vb, van is not possible
          continue
        }

        if (van.nextStops.length === 1) {
          // first, get the reference way point, because the van may be driving atm
          [referenceWayPoint, referenceWayPointDuration, potentialCutOffStep] = this.getStepAheadOnCurrentRoute(van.vanId)
        } else if (van.nextStops.length > 1) {
          referenceWayPoint = _.nth(van.nextStops, -2).vb.location
          referenceWayPointDuration = this.getRemainingRouteDuration(van) - GoogleMapsHelper.readDurationFromGoogleResponse(_.last(van.nextRoutes)) // TODO
        }
        if (!referenceWayPoint || !referenceWayPointDuration) continue
        Logger.info('referenceWayPoint: ' + referenceWayPoint)
        Logger.info('referenceWayPointDuration: ' + referenceWayPointDuration)
        Logger.info('potentialCutOffStep: ' + potentialCutOffStep)

        // calculate duration of the new route
        const toStartVBRoute = await GoogleMapsHelper.simpleGoogleRoute(referenceWayPoint, fromVB.location)
        const toEndVBRoute = await GoogleMapsHelper.simpleGoogleRoute(fromVB.location, toVB.location)
        let toStartVBDuration = GoogleMapsHelper.readDurationFromGoogleResponse(toStartVBRoute)
        toStartVBDuration += referenceWayPointDuration // add duration of how long the van needs to the reference way point
        const toEndVBDuration = GoogleMapsHelper.readDurationFromGoogleResponse(toEndVBRoute)
        const newDuration = toStartVBDuration + toEndVBDuration

        // compare duration of new route to duration of current route
        const currentDuration = this.getRemainingRouteDuration(van)
        Logger.info(currentDuration, newDuration)
        if (newDuration - currentDuration > threshold) {
          // threshold exceeded, van cant be used
          continue
        }
        possibleVans.push({
          vanId: van.vanId,
          toStartVBRoute: toStartVBRoute,
          toStartVBDuration: toStartVBDuration,
          potentialCutOffStep: potentialCutOffStep
        })
        continue
      }

      // Test 3 startVB oder destVB gleich
    }
    return _.sortBy(possibleVans, ['toStartVBDuration'])
  }

  static getBestVan (possibleVans) {
    while (possibleVans.length > 0) {
      // get next best van
      const tmpVan = possibleVans.shift()
      // make sure the van is still available
      if (this.vans[tmpVan.vanId - 1].potentialRoute == null) {
        return tmpVan
      }
    }
    return null // no van found
  }

  // Returns the van that will execute the ride
  static async requestVan (start, fromVB, toVB, destination, time = new Date(), passengerCount = 1) {
    await this.updateVanLocations()

    // get all possible vans for this order request, sorted ascending by their duration
    const walkingRoutToStartVB = await GoogleMapsHelper.simpleGoogleRoute(start, fromVB.location, 'walking')
    const walkingTimeToStartVB = GoogleMapsHelper.readDurationFromGoogleResponse(walkingRoutToStartVB)

    const possibleVans = await this.getPossibleVans(fromVB, toVB, walkingTimeToStartVB)
    if (possibleVans.length === 0) {
      // error, no van found!
      return { code: 403, message: 'No van currently available please try later' }
    }
    Logger.info('possibleVans ' + possibleVans.map(v => [v.vanId, v.toStartVBDuration]))
    // now determine best from all possible vans (the one with the lowest duration)
    const bestVan = this.getBestVan(possibleVans)

    Logger.info('bestVan ' + bestVan.vanId)

    // set potential route (and thus lock the van)
    const vanId = bestVan.vanId
    this.vans[vanId - 1].potentialRoute = bestVan.toStartVBRoute
    this.vans[vanId - 1].potentialCutOffStep = bestVan.potentialCutOffStep

    this.vans[vanId - 1].potentialRouteTime = new Date()
    // const timeToVB = GoogleMapsHelper.readDurationFromGoogleResponse(route)
    const timeToVB = bestVan.toStartVBDuration

    return { vanId: vanId, nextStopTime: new Date(Date.now() + (timeToVB * 1000)) }
  }

  // This is called when the users confirms/ places an order
  static async confirmVan (fromVB, toVB, vanId, order, passengerCount = 1) {
    const orderId = order._id
    const van = this.vans[vanId - 1]
    const wholeRoute = await Route.findById(order.route)
    const vanRoute = wholeRoute.vanRoute
    const toVBRoute = van.potentialRoute
    van.potentialRoute = null

    // van already has a route
    if (van.nextRoutes.length > 0) {
      van.currentlyPooling = true
    }

    let timeToVB = GoogleMapsHelper.readDurationFromGoogleResponse(toVBRoute)
    if (!timeToVB && van.nextRoutes.length !== 0) {
      timeToVB = GoogleMapsHelper.readDurationFromGoogleResponse(van.nextRoutes[0])
      Logger.info('Took time from different route: ' + timeToVB)
    }
    Logger.info('Seconds to next VB: ' + timeToVB)
    van.nextStopTime = new Date(Date.now() + (timeToVB * 1000))

    // link the added next stops with the order they came from so that we can delete them if one cancels its order
    let fromStop = {
      vb: fromVB,
      orderId: orderId
    }
    let toStop = {
      vb: toVB,
      orderId: orderId
    }

    // insert the two new stops at the second last position of the next stops
    van.nextStops.splice(-1, 0, fromStop, toStop)

    if (van.potentialCutOffStep != null) {
      // cut off the current route from where the stepAhead begins
      van.nextRoutes[0].routes[0].legs[0].steps.splice(van.potentialCutOffStep + 1)
      van.potentialCutOffStep = null
    } else {
      // throw away the last route because thats the one thats changed
      van.nextRoutes.pop()
    }
    // add the new two routes
    van.nextRoutes.push(toVBRoute, vanRoute)

    if (van.currentStep === 0 && !van.lastStepTime) {
      van.lastStepTime = new Date()
    }

    Logger.info('##### CONFIRM #####')
    Logger.info(van.nextStops)
    Logger.info(van.nextRoutes)
    return van
  }

  static async startRide (order) {
    const vanId = order.vanId
    const van = this.vans[vanId - 1]
    // if a passenger enters the van, remove the passengers start bus stop from the list of all next stops
    // if this list then contains no next stop that matches the current waiting stop, the van picked up all passengers and is ready to ride
    if (van.waiting) {
      let r = _.remove(van.nextStops, (nextStop) => {
        return nextStop.orderId.equals(order._id) && nextStop.vb._id.equals(van.waitingAt._id)
      })
      Logger.info('removed ' + r.length + ' stops')
      if (_.find(van.nextStops, (nextStop) => nextStop.vb._id.equals(van.waitingAt._id)) === undefined) {
        // van continues the ride
        van.currentStep = 0
        van.lastStepTime = new Date()
        van.waiting = false
        van.waitingAt = null
        const timeToVB = GoogleMapsHelper.readDurationFromGoogleResponse(van.nextRoutes[0])
        van.nextStopTime = new Date(Date.now() + (timeToVB * 1000))
        Logger.info('continue ride')
      }
      return true
    }
    return false
  }

  static async endRide (order) {
    const vanId = order.vanId
    const van = this.vans[vanId - 1]
    // if a passenger leaves the van, remove the passengers end bus stop from the list of all next stops
    // if this list then contains no next stop anymore, all passengers have left the van and its again ready to ride
    if (van.waiting) {
      let r = _.remove(van.nextStops, nextStop => nextStop.orderId.equals(order._id))
      Logger.info('removed ' + r.length + ' stops')
      if (van.nextStops.length === 0) {
        this.resetVan(vanId)
        Logger.info('van reset')
      }
      return true
    }
    return false
  }

  static async cancelRide (order) {
    const vanId = order.vanId
    const van = this.vans[vanId - 1]

    // if a passenger cancels its ride, remove all next stops of the passenger
    // van.nextRoutes needs to be updated
    _.remove(van.nextStops, nextStop => nextStop.orderId.equals(order._id))
    const numberStops = _.uniqWith(van.nextStops, (val1, val2) => val1.vb._id.equals(val2.vb._id)).length
    if (van.nextStops.length === 0) {
      // if the list of next stops then is empty, the van has no order anymore and can be reset
      this.resetVan(vanId)
    } else if (numberStops === 1) {
      // TODO something with steps ahead?
      const startLocation = van.location
      const endVB = van.nextStops[0].vb
      const newRoute = await GoogleMapsHelper.simpleGoogleRoute(startLocation, endVB.location)
      // remove the two old/cancelled routes and add the new one
      van.nextRoutes.pop()
      van.nextRoutes.pop()
      van.nextRoutes.push(newRoute)
      van.currentStep = 0
      van.lastStepTime = new Date()
    } else {
      // recalculate route bewteen the last two stops
      const startVB = _.nth(van.nextStops, -2).vb
      const endVB = _.nth(van.nextStops, -1).vb
      const newRoute = await GoogleMapsHelper.simpleGoogleRoute(startVB.location, endVB.location)
      // remove the two old/cancelled routes and add the new one
      van.nextRoutes.pop()
      van.nextRoutes.pop()
      van.nextRoutes.push(newRoute)
    }
    Logger.info('Cancel')
    Logger.info(van.nextStops)
    Logger.info(van.nextRoutes)
  }

  static initializeVans () {
    for (let i = 0; i < this.numberOfVans; i++) {
      this.vans[i] = {
        vanId: i + 1,
        lastStepLocation: {
          latitude: 52.522222,
          longitude: 13.403312
        },
        location: {
          latitude: 52.522222,
          longitude: 13.403312
        },
        lastStepTime: null,
        nextStopTime: null,
        nextStops: [],
        nextRoutes: [],
        potentialRoute: null,
        potentialRouteTime: null,
        potentialCutOffStep: null,
        currentlyPooling: false,
        currentStep: 0,
        waiting: false,
        waitingAt: null
      }
    }
  }

  static resetVan (vanId) {
    Logger.info('resetting van', vanId)
    this.vans[vanId - 1].lastStepTime = null
    this.vans[vanId - 1].nextStopTime = null
    this.vans[vanId - 1].nextStops = []
    this.vans[vanId - 1].potentialRoute = null
    this.vans[vanId - 1].potentialCutOffStep = null
    this.vans[vanId - 1].potentialRouteTime = null
    this.vans[vanId - 1].currentlyPooling = false
    this.vans[vanId - 1].currentStep = 0
    this.vans[vanId - 1].waiting = false
    this.vans[vanId - 1].waitingAt = null
    this.vans[vanId - 1].nextRoutes = []
  }

  static async updateVanLocations () {
    const currentTime = new Date()
    let latDif, longDif, timeFraction
    // Iterate through all vans
    for (let van of ManagementSystem.vans) {
      // check if potential is older than 10 minutes
      if (van.potentialRoute && van.potentialRouteTime.getTime() + 60 * 1000 < currentTime.getTime()) {
        Logger.info('Deleting old potential route')
        van.potentialRoute = null
        van.potentialCutOffStep = null
        van.potentialRouteTime = null
      }

      // Reset van if if waiting for more than 10 minutes
      if (van.waiting && van.lastStepTime.getTime() + tenMinutes < currentTime.getTime()) {
        await this.checkForInactiveOrders(van.vanId)
        continue
      }

      // If van does not have a route or is waiting just contiunue with next van
      if (van.nextRoutes.length === 0 || van.waiting) {
        continue
      }

      // This happens if van has aroute and has not reached the next bus Stop yet
      // This updates the step location
      const currentRoute = van.nextRoutes[0]
      const steps = currentRoute.routes[0].legs[0].steps
      Logger.info('##### UPDATE LOCATIONS #####')
      Logger.info('next stops: ' + van.nextStops.length)
      Logger.info('number steps: ' + steps.length)
      Logger.info('currentStep: ' + van.currentStep)

      // timePassed is the the time that has passed since the lastStepTime
      const timePassed = ((currentTime.getTime() - van.lastStepTime.getTime()) / 1000)
      let timeCounter = 0
      Logger.info('time passed: ' + timePassed)
      Logger.info('curren step duration: ' + steps[van.currentStep].duration.value)

      // Iterate through all steps ahead of current step & find the one that matches the time that has passed
      for (let step = van.currentStep; step < steps.length; step++) {
        timeCounter += steps[step].duration.value

        if (timeCounter > timePassed) {
          // Calculating the actual location in between the step locations only if there is a next step
          latDif = steps[step].end_location.lat - van.lastStepLocation.latitude
          longDif = steps[step].end_location.lng - van.lastStepLocation.longitude
          timeFraction = timePassed / steps[step].duration.value

          // Updating the actual location
          van.location = {
            latitude: van.lastStepLocation.latitude + latDif * timeFraction,
            longitude: van.lastStepLocation.longitude + longDif * timeFraction
          }

          // Updating step location (usually not changing it unless a step has passed)
          van.lastStepLocation = {
            latitude: steps[step].start_location.lat,
            longitude: steps[step].start_location.lng
          }
          // if algorithm has advanced a step, save the current time as the time of the last step and set the actual location to the step location
          if (step > van.currentStep) {
            van.lastStepTime = new Date(van.lastStepTime.getTime() + steps[step - 1].duration.value * 1000)
            Logger.info('setting new step')
            van.location = {
              latitude: steps[step].start_location.lat,
              longitude: steps[step].start_location.lng
            }
          }
          van.currentStep = step
          break
        } else if (van.currentStep === steps.length - 1) {
          // van reached last step
          Logger.info('last step reached')
          van.lastStepLocation = {
            latitude: steps[van.currentStep].end_location.lat,
            longitude: steps[van.currentStep].end_location.lng
          }
          van.location = {
            latitude: steps[van.currentStep].end_location.lat,
            longitude: steps[van.currentStep].end_location.lng
          }
          // if algorithm has advanced a step, save the current time as the time of the last step
          van.lastStepTime = currentTime
          van.currentStep = 0
          this.wait(van.vanId, currentTime)
          // van.waiting = true
          // van.waitingAt = van.nextStops[0].vb
          // remove the current driven route (and all succeeding ones with a duration of zero)
          van.nextRoutes.shift()
          van.nextRoutes = _.dropWhile(van.nextRoutes, nextRoute => nextRoute.routes[0].legs[0].duration.value === 0)
        }
      }
    }
  }

  static wait (vanId) {
    let van = this.vans[vanId - 1]
    let nextVB = van.nextStops[0].vb
    // check if the next stop is close to the current van location (range in meters)
    let range = 20
    let from = { latitude: van.lastStepLocation.latitude, longitude: van.lastStepLocation.longitude }
    let to = { latitude: nextVB.location.latitude, longitude: nextVB.location.longitude }
    let dist = geolib.getDistance(from, to)
    Logger.info('check waiting from ' + from + ' to ' + to + ' dist ' + dist)
    if (dist < range) {
      Logger.info('waiting confirmed')
      van.waiting = true
      van.waitingAt = nextVB
    }
  }

  static async checkForInactiveOrders (vanId) {
    const van = this.vans[vanId - 1]
    let orderIds = van.nextStops.filter(stop => stop.vb._id.equals(van.waitingAt._id)).map(stop => stop.orderId)
    const currentTime = new Date()
    let counter = orderIds.length
    for (let oid of orderIds) {
      const order = await Order.findById(oid)
      const route = await Route.findById(order.route).lean()
      if (route.vanETAatStartVBS.getTime() + tenMinutes < currentTime.getTime()) {
        Logger.info('deactivated Order ' + oid)
        await Order.updateOne({ _id: oid }, { $set: { active: false } })
        await this.cancelRide(order)
        counter--
      }
    }
    if (!counter) {
      this.resetVan(van.vanId)
    }
  }
}

ManagementSystem.vans = []
ManagementSystem.numberOfVans = 3
module.exports = ManagementSystem
