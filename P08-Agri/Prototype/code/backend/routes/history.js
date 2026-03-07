const express = require('express')
const { requireAuth } = require('../middleware/auth')
const Diagnosis = require('../models/Diagnosis')

const router = express.Router()

router.get('/', requireAuth, async function (request, response) {
  try {
    const limit_raw = Number(request.query.limit)
    const skip_raw = Number(request.query.skip)

    const limit = Number.isFinite(limit_raw) && limit_raw > 0 ? Math.min(limit_raw, 100) : 50
    const skip = Number.isFinite(skip_raw) && skip_raw >= 0 ? skip_raw : 0

    const query = { user_id: request.auth.userId }

    const [diagnoses, total] = await Promise.all([
      Diagnosis.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Diagnosis.countDocuments(query)
    ])

    response.json({
      diagnoses,
      total,
      limit,
      skip
    })
  } catch (error) {
    console.error('History route error:', error.message || error)
    response.status(500).json({
      message: 'Failed to load diagnosis history'
    })
  }
})

router.get('/:id', requireAuth, async function (request, response) {
  try {
    const diagnosis = await Diagnosis.findOne({
      _id: request.params.id,
      user_id: request.auth.userId
    }).lean()

    if (!diagnosis) {
      response.status(404).json({ message: 'Diagnosis not found' })
      return
    }

    response.json(diagnosis)
  } catch (error) {
    console.error('History detail route error:', error.message || error)
    response.status(500).json({
      message: 'Failed to load diagnosis details'
    })
  }
})

module.exports = router