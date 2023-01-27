const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
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

module.exports = app