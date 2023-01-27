const Joi = require('joi')
const { StatusCodes } = require('http-status-codes')
const ContractService = require('../services/contract-service')
const ValidationError = require('../errors/ValidationError')
const createError = require('http-errors')

function validate ({ schema, data }) {
  const { error } = schema.validate(data)
  if (error) {
    throw new ValidationError(error)
  }
}

class ContractRouter {
  constructor ({ models }) {
    this.contractService = new ContractService({ models })
  }

  getContractById () {
    const schema = Joi.object({
      id: Joi.string().required()
    })
    return async (req, res, next) => {
      try {
        validate({ schema, data: req.params })
        const userId = req.profile.id
        const contract = await this.contractService.getContractById({ contractId: req.params.id, userId })
        console.log('req.params', req.params)
        return res.status(StatusCodes.OK).send(contract)
      } catch (error) {
        console.log(error)
        if (error instanceof ValidationError) {
          return next(new createError.BadRequest(error.message))
        }
        return next(new createError.InternalServerError(error))
      }
    }
  }

  getContracts () {
    const schema = Joi.object({
      page: Joi.number(),
      limit: Joi.number().required()
    })
    return async (req, res, next) => {
      try {
        console.log('req.query', req.query)
        validate({ schema, data: req.query })
        const userId = req.profile.id
        const contracts = await this.contractService.getContracts({ ...req.query, userId })
        return res.status(StatusCodes.OK).send(contracts)
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

module.exports = ContractRouter
