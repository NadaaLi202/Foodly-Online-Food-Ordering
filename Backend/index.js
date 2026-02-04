import express from 'express'
import { dbConnection } from './dataBase/dbConnection.js'
import { routes } from './src/modules/index.routes.js'

import cors from 'cors'
import * as  dotenv from 'dotenv'
dotenv.config()


console.log('Current working directory:', process.cwd());

const app = express()
const port = process.env.PORT || 8000

app.use(cors())
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
app.use(express.json())
app.use('/uploads', express.static('uploads'))



app.get('/', (req, res) => res.send('Hello World!'))

routes(app)
dbConnection()

app.listen(process.env.PORT || port, () => console.log(`Example app listening on port ${port}!`))

process.on('unhandledRejection', (err) => {
    console.log('unhandledRejection', err)
})