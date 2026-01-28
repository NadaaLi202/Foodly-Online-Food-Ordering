import express from 'express'
import { dbConnection } from './dataBase/dbConnection.js'
import { routes } from './src/modules/index.routes.js'

import cors from 'cors'
import * as  dotenv from 'dotenv'
dotenv.config()


const app = express()
const port = process.env.PORT || 8000

app.use(cors())
app.use(express.json())



app.get('/', (req, res) => res.send('Hello World!'))

routes(app)
dbConnection()

app.listen(process.env.PORT || port, () => console.log(`Example app listening on port ${port}!`))

process.on('unhandledRejection',(err)=> {
    console.log('unhandledRejection',err)
})