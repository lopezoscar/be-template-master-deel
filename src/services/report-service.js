const ValidationError = require('../errors/ValidationError')
const InternalServerError = require('../errors/InternalServerError')

class ReportService {
  constructor ({ models, db }) {
    this.models = models
    this.db = db
  }

  /**
   * Returns the profession that earned the most money (sum of jobs paid) for any contractor that worked in the query time range.
   *
   * Retornar los Jobs con sus contratos que estan en tal fecha.
   *
   * select p.profession, sum(j.price) as earns
   * from Profiles p, Contract c, Job j
   * where p.type = 'contractor', j.paid = true and j.createdAt BETWEEN start and end
   * group profession
   * order by earns desc
   *
   */
  async getBestProfessionReport ({ start, end, userId }) {
    if (new Date(start) > new Date(end)) {
      throw new ValidationError('start must be before end')
    }
    console.log(`getBestProfessionReport ${start} ${end} ${userId}`)
    try {
      const query = `
        SELECT p.profession, sum(j.price) as earned
        FROM Profiles p, Jobs j, Contracts c
        WHERE j.ContractId = c.id
        AND p.id = c.ContractorId
        AND p.type = 'contractor'
        AND j.paid = 1
        AND j.createdAt BETWEEN :startDate AND :endDate
        GROUP BY p.profession
        ORDER BY earned DESC
        LIMIT 1
      `
      const [results, metadata] = await this.db.query(query, { replacements: { startDate: start, endDate: end } })
      console.log('metadata', metadata)
      console.log('results', results)
      return results && results.length > 0 ? results.pop() : {}
    } catch (error) {
      console.log(error)
      throw new InternalServerError(error)
    }
  }

  /**
   *
   * Returns the clients the paid the most for jobs in the query time period. limit query parameter should be applied, default limit is 2.
   */
  async getBestClientsReport ({ start, end, limit = 2, userId }) {
    if (new Date(start) > new Date(end)) {
      throw new ValidationError('start must be before end')
    }
    console.log(`getBestClientsReport ${start} ${end} ${limit} ${userId}`)
    try {
      const query = `
        SELECT p.id, p.lastName, sum(j.price) as paid
        FROM Profiles p, Jobs j, Contracts c
        WHERE j.ContractId = c.id
        AND p.id = c.ClientId
        AND p.type = 'client'
        AND j.paid = 1
        AND j.createdAt BETWEEN :startDate AND :endDate
        GROUP BY p.id
        ORDER BY paid DESC
        LIMIT :limit
      `
      const [results, metadata] = await this.db.query(query, { replacements: { startDate: start, endDate: end, limit } })
      console.log('metadata', metadata)
      console.log('results', results)
      return results
    } catch (error) {
      console.log(error)
      throw new InternalServerError(error)
    }
  }
}

module.exports = ReportService
