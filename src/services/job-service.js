const InternalServerError = require('../errors/InternalServerError')
const contractStatus = require('../util/contract_status')
const { Op } = require('sequelize')
const NotFoundError = require('../errors/NotFoundError')
const ValidationError = require('../errors/ValidationError')

class JobService {
  constructor ({ models, db }) {
    this.models = models
    this.db = db
  }

  async getUnpaidJobs ({ page = 1, limit = 20, userId }) {
    try {
      page = Number(page)
      limit = Number(limit)
      console.log(`getting unpaid jobs page ${page} ${limit} ${userId}`)

      const { Job } = this.models
      const unpaidJobs = await Job.findAndCountAll({
        include: {
          model: this.models.Contract,
          where: {
            status: { [Op.in]: [contractStatus.NEW, contractStatus.IN_PROGRESS] },
            [Op.or]: {
              ContractorId: userId,
              ClientId: userId
            }
          }
        },
        where: {
          paid: { [Op.or]: [false, null] }
        },
        offset: (page - 1) * limit,
        limit
      })

      console.log('unpaid jobs response', unpaidJobs)
      return unpaidJobs
    } catch (error) {
      console.log(error)
      throw new InternalServerError(error)
    }
  }

  /**
   * Pay for a job, a client can only pay if his balance >= the amount to pay.
   * The amount should be moved from the client's balance to the contractor balance.
   */
  async payJob ({ jobId, userId }) {
    const { Job, Profile, Contract } = this.models

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
      throw new ValidationError('only a client can pay other users')
    }

    console.log(client)

    let job = null
    try {
      job = await Job.findByPk(jobId, { include: Contract })
    } catch (error) {
      console.log(error)
      throw new InternalServerError(error)
    }

    if (!job) {
      throw new NotFoundError(`job with id ${jobId} doesn\`t exists`)
    }

    if (job.paid) {
      throw new ValidationError(`this job is paid - payment date ${job.paymentDate}`)
    }

    console.log('job', job)

    if (client.balance < job.price) {
      throw new ValidationError(`Client balance ${client.balance} is not enough to pay the job ${jobId}, cost ${job.price}`)
    }

    console.log('client balance', client.balance)
    console.log('job price', job.price)

    const transaction = await this.db.transaction()
    try {
      // update client balance
      await Profile.decrement({ balance: job.price }, { where: { id: client.id } })

      // update contractor balance
      await Profile.increment({ balance: job.price }, { where: { id: job.Contract.ContractorId } })

      // update job paid status and payment date
      await Job.update({ paid: true, paymentDate: new Date() }, { where: { id: jobId } })

      // IMPORTANT: I assume that a contract is terminated when the job is paid
      await Contract.update({ status: contractStatus.TERMINATED }, { where: { id: job.Contract.id } })

      transaction.commit()
    } catch (error) {
      console.log(error)
      transaction.rollback()
      throw new InternalServerError(error)
    }
  }
}

module.exports = JobService
