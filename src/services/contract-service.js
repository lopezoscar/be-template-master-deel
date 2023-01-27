const InternalServerError = require('../errors/InternalServerError')
const ValidationError = require('../errors/ValidationError')
const NotFoundError = require('../errors/NotFoundError')
const contractStatus = require('../util/contract_status')
const { Op } = require('sequelize')

class ContractService {
  constructor ({ models }) {
    this.models = models
  }

  async getContractById ({ contractId, userId }) {
    let contract = null
    const { Contract } = this.models
    try {
      console.log(`getting contract by id ${contractId}`)
      contract = await Contract.findByPk(contractId)
      console.log(`contract ${contractId}`, contract)
    } catch (error) {
      console.log(error)
      throw new InternalServerError(error)
    }

    if (!contract) {
      throw new NotFoundError(`Contract ${contractId} not found`)
    }

    if (userId && contract.userId !== userId) {
      throw new ValidationError('this contract doesn`t belong to this user')
    }
    console.log(`contract by id ${contractId}`, contract)
    return contract
  }

  async getContracts ({ page = 1, limit = 20, userId }) {
    try {
      page = Number(page)
      limit = Number(limit)
      console.log(`getting contracts page ${page} ${limit} ${userId}`)

      const { Contract } = this.models
      const contracts = await Contract.findAndCountAll({
        where: {
          status: { [Op.in]: [contractStatus.NEW, contractStatus.IN_PROGRESS] },
          [Op.or]: {
            ContractorId: userId,
            ClientId: userId
          }
        },
        offset: (page - 1) * limit,
        limit
      })

      console.log('contracts response', contracts)
      return contracts
    } catch (error) {
      console.log(error)
      throw new InternalServerError(error)
    }
  }
}

module.exports = ContractService
