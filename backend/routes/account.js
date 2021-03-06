const express = require('express')
const router = express.Router()
const Account = require('../models/Account.js')
const Order = require('../models/Order.js')
const AccountHelper = require('../services/AccountHelper.js')
const Logger = require('../services/WinstonLogger').logger

router.get('/', async function (req, res) {
  res.setHeader('Content-Type', 'application/json')
  let account, loyaltyItem, responsebody
  let loyaltyPoints = 0
  let co2savings = 0
  let distance = 0
  try {
    account = await Account.findById(req.user._id, '-password')

    Logger.info('Requested Account with id ' + account._id)
    loyaltyItem = await Order.aggregate([
      {
        $match:
          {
            'accountId': String(req.user._id),
            'canceled': false
          }
      },
      {
        $group:
          {
            _id: '$accountId',
            loyaltyPoints: { $sum: '$loyaltyPoints' },
            co2savings: { $sum: '$co2savings' },
            distance: { $sum: '$distance' }
          }
      }
    ])
    if (loyaltyItem.length > 0) {
      loyaltyPoints = loyaltyItem[0].loyaltyPoints
      co2savings = loyaltyItem[0].co2savings
      distance = loyaltyItem[0].distance
    }
    loyaltyPoints = Number(loyaltyPoints.toFixed(0))
    co2savings = Number(co2savings.toFixed(2))
    distance = Number(distance.toFixed(2))
    responsebody = account.toObject()
    responsebody.loyaltyPoints = loyaltyPoints
    responsebody.co2savings = co2savings
    responsebody.distance = distance // total distance the user travelled
    // Calculate the status of an account based on the loyalty points
    responsebody.loyaltyStatus = AccountHelper.status(loyaltyPoints)
    res.json(responsebody)
  } catch (error) {
    Logger.error(error)
    res.status(404).json({ error: error, message: 'No items found' })
  }
})

module.exports = router
