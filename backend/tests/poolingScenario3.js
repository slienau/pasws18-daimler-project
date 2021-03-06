const axios = require('axios')
var assert = require('assert')
var _ = require('lodash')

const address = 'http://localhost:8080'
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const startVB = {
  'latitude': 52.500048,
  'longitude': 13.361408
}
const stopVB1 = {
  'latitude': 52.508969,
  'longitude': 13.332151
}

/*
const stopVB2 = {
  'latitude': 52.510144,
  'longitude': 13.387231
} */

// test if the vans assigned to the routes are locked and not available anymore
async function starttest () {
  const credentials1 = await axios.post(address + '/login', { username: 'maexle', password: 'maxiscool' })
  console.log('maexle Login worked')
  const credentials2 = await axios.post(address + '/login', { username: 'philipp', password: 'philippiscooler' })
  console.log('philipp Login worked')
  console.log('----------------------')

  const axiosInstance1 = axios.create({
    baseURL: address,
    timeout: 30000,
    headers: { 'Authorization': 'Bearer ' + credentials1.data.token }
  })
  const axiosInstance2 = axios.create({
    baseURL: address,
    timeout: 5000,
    headers: { 'Authorization': 'Bearer ' + credentials2.data.token }
  })

  const route1 = await axiosInstance1.post('/routes', {
    'start': startVB,
    'destination': stopVB1
  })
  const routeInfo1 = _.first(route1.data)

  console.log(routeInfo1)

  console.log('testing first route request')
  assert.strictEqual(true, routeInfo1 != null, 'route null')
  assert.strictEqual(true, routeInfo1.vanId != null, 'vanId null')
  console.log('testing first order')
  const order1 = await axiosInstance1.post('/orders', { routeId: routeInfo1.id })
  const orderInfo1 = order1.data
  assert.strictEqual(true, orderInfo1 != null, 'order is null')
  console.log(orderInfo1)

  let started = false
  // let ended = false
  while (!started) {
    await sleep(1000 * 10)

    let status1 = await axiosInstance1.get('/activeorderstatus')
    let status2 = await axiosInstance2.get('/activeorderstatus')

    console.log(status1.data)
    console.log(status2.data)
    console.log('----------------------------')
    let res

    if (status1.data.userAllowedToEnter) {
      res = await axiosInstance1.put('/activeorder', {
        action: 'startride',
        userLocation: orderInfo1.route.vanStartVBS.location
      })
      if (res.data.vanEnterTime) {
        started = true
      }
    }
    console.log('start time (1):', res.data.startTime)
  }
}

starttest().catch(e => {
  console.log('FAILED')
  console.log(e)
  process.exit(1)
})
  .then(() => console.log('OK'))
