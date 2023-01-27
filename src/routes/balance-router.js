const Joi = require('joi')
const { StatusCodes } = require('http-status-codes')
const BalanceService = require('../services/balance-service')
const ValidationError = require('../errors/ValidationError')
const createError = require('http-errors')
const NotFoundError = require('../errors/NotFoundError')

function validate ({ schema, data }) {
  const { error } = schema.validate(data)
  if (error) {
    throw new ValidationError(error)
  }
}

class BalanceRouter {
  constructor ({ models, db }) {
    this.balanceService = new BalanceService({ models, db })
  }

  deposit () {
    const schema = Joi.object({
      userId: Joi.string().required(),
      amount: Joi.number().required()
    })
    return async (req, res, next) => {
      try {
        validate({ schema, data: { ...req.params, ...req.body } })
        console.log('req.params', req.params)
        console.log('req.body', req.body)

        const { userId: userIdToDeposit } = req.params
        const userId = req.profile.id

        console.log('deposit to userId', userIdToDeposit, 'user logged-in', userId)
        const depositResponse = await this.balanceService.deposit({ userId, userIdToDeposit, amount: req.body.amount })

        return res.status(StatusCodes.OK).send(depositResponse)
      } catch (error) {
        console.log(error)
        if (error instanceof NotFoundError) {
          return next(new createError.NotFound(error.message))
        }
        if (error instanceof ValidationError) {
          return next(new createError.BadRequest(error.message))
        }
        return next(new createError.InternalServerError(error))
      }
    }
  }
}

module.exports = BalanceRouter
