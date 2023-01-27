const InternalServerError = require('../errors/InternalServerError')
const contractStatus = require('../util/contract_status')
const { Op } = require('sequelize')

class JobService {
  constructor ({ models }) {
    this.models = models
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
}

module.exports = JobService
