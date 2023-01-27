const express = require('express')
const bodyParser = require('body-parser')
const { sequelize, Job } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const app = express()
app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

const ContractRouter = require('./routes/contract-router')
const contractRouter = new ContractRouter({ models: sequelize.models })

const contractExpressRouter = express.Router()
contractExpressRouter.use(getProfile)
contractExpressRouter.get('/contracts/:id', contractRouter.getContractById())
contractExpressRouter.get('/contracts', contractRouter.getContracts())

app.use(contractExpressRouter)

const JobRouter = require('./routes/job-router')
const jobRouter = new JobRouter({ models: sequelize.models })

const jobExpressRouter = express.Router()
jobExpressRouter.use(getProfile)
jobExpressRouter.get('/jobs/unpaid', jobRouter.getUnpaidJobs())

app.use(jobExpressRouter)

module.exports = app
