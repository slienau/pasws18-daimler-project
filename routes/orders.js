const express = require('express')
const router = express.Router()
const Order = require('../models/Order.js')
const VirtualBusStop = require('../models/VirtualBusStop.js')
const OrderHelper = require('../services/OrderHelper')

router.get('/', async function (req, res) {
  const orders = await Order.find({ 'accountID': req.user._id })
  const ordersObject = JSON.parse(JSON.stringify(orders))
  res.setHeader('Content-Type', 'application/json')

  try {
    for (const ord in ordersObject) {
      const vb1 = await VirtualBusStop.findById(ordersObject[ord].virtualBusStopStart)
      const vb2 = await VirtualBusStop.findById(ordersObject[ord].virtualBusStopEnd)
      ordersObject[ord].virtualBusStopStart = vb1
      ordersObject[ord].virtualBusStopEnd = vb2
    }
  } catch (error) {
    console.log(error)
  }
  res.json(ordersObject)
})

router.post('/', async function (req, res) {
  console.log('Request to Post Orders with body: ')
  console.log(req.body)

  res.setHeader('Content-Type', 'application/json')

  const accountID = req.user._id
  const vb1 = req.body.start
  const vb2 = req.body.end
  const pickupTime = req.query.time ? req.query.time : null
  let order

  try {
    order = await OrderHelper.createOrder(accountID, vb1, vb2, pickupTime)
  } catch (error) {
    res.json(error)
  }
  console.log('created active order for user ' + accountID)
  res.json(order)
})

module.exports = router
