const InternalServerError = require('../errors/InternalServerError')
const contractStatus = require('../util/contract_status')
const { Op } = require('sequelize')
const NotFoundError = require('../errors/NotFoundError')
const ValidationError = require('../errors/ValidationError')
const AMOUNT_LIMIT = 0.25

class BalanceService {
  constructor ({ models, db }) {
    this.models = models
    this.db = db
  }

  /**
   * Deposits money into the balance of a client, a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)
   * IMPORTANT: I assume that the userId logged-in is must be the same userId in the request param.
   */
  async deposit ({ userId, userIdToDeposit, amount }) {
    const { Profile, Job } = this.models
    console.log('deposit', userId, userIdToDeposit, 'amount', amount)
    amount = Number(amount)

    if (amount < 0 || isNaN(amount)) {
      throw new ValidationError('invalid amount')
    }

    if (userId !== Number(userIdToDeposit)) {
      throw new ValidationError('userId has to be the same userId to deposit')
    }

    let client = null
    try {
      client = await Profile.findByPk(userId)
    } catch (error) {
      console.log(error)
      throw new InternalServerError(error)
    }

    if (!client) {
      throw new NotFoundError(`client with userId ${userId} doesn\`t exists`)
    }

    if (client.type !== 'client') {
      throw new ValidationError('you can only deposit to a client')
    }

    console.log('client balance', client.balance)

    const transaction = await this.db.transaction()
    try {
      const amountOfUnpaidJobs = await Job.sum('price', {
        include: {
          model: this.models.Contract,
          where: {
            status: { [Op.in]: [contractStatus.NEW, contractStatus.IN_PROGRESS] },
            ClientId: userId
          }
        },
        where: {
          paid: { [Op.or]: [false, null] }
        }
      })
      console.log('amountOfUnpaidJobs', amountOfUnpaidJobs)
      if (amount > amountOfUnpaidJobs * AMOUNT_LIMIT) {
        throw new Error('ERROR_AMOUNT_LIMIT_EXCCEDED')
      }

      // update client balance
      await Profile.increment({ balance: amount }, { where: { id: userId } })

      transaction.commit()
    } catch (error) {
      transaction.rollback()
      console.log(error)
      if (error.message === 'ERROR_AMOUNT_LIMIT_EXCCEDED') {
        throw new ValidationError("Can't deposit more than 25% of unpaid jobs")
      }
      throw new InternalServerError(error)
    }
  }
}

module.exports = BalanceService
