const Joi = require('joi')
const { StatusCodes } = require('http-status-codes')
const ReportService = require('../services/report-service')
const ValidationError = require('../errors/ValidationError')
const createError = require('http-errors')

function validate ({ schema, data }) {
  const { error } = schema.validate(data)
  if (error) {
    throw new ValidationError(error)
  }
}

class ReportRouter {
  constructor ({ models, db }) {
    this.reportService = new ReportService({ models, db })
  }

  getBestProfessionReport () {
    const schema = Joi.object({
      start: Joi.date().required(),
      end: Joi.date().required()
    })
    return async (req, res, next) => {
      try {
        console.log('req.query', req.query)
        validate({ schema, data: req.query })
        const userId = req.profile.id
        const report = await this.reportService.getBestProfessionReport({ ...req.query, userId })
        return res.status(StatusCodes.OK).send(report)
      } catch (error) {
        console.log(error)
        if (error instanceof ValidationError) {
          return next(new createError.BadRequest(error.message))
        }
        return next(new createError.InternalServerError(error))
      }
    }
  }
}

module.exports = ReportRouter
