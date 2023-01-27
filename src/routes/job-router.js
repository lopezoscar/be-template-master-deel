const Joi = require('joi')
const { StatusCodes } = require('http-status-codes')
const JobService = require('../services/job-service')
const ValidationError = require('../errors/ValidationError')
const createError = require('http-errors')

function validate ({ schema, data }) {
  const { error } = schema.validate(data)
  if (error) {
    throw new ValidationError(error)
  }
}

class JobRouter {
  constructor ({ models }) {
    this.jobService = new JobService({ models })
  }

  getUnpaidJobs () {
    const schema = Joi.object({
      page: Joi.number(),
      limit: Joi.number().required()
    })
    return async (req, res, next) => {
      try {
        console.log('req.query', req.query)
        validate({ schema, data: req.query })
        const userId = req.profile.id
        const unpaidJobs = await this.jobService.getUnpaidJobs({ ...req.query, userId })
        return res.status(StatusCodes.OK).send(unpaidJobs)
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

module.exports = JobRouter
