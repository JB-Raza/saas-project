import express from 'express'
import {login, signup, changeUserCredentials, getUser} from '../controllers/user.controllers.js'

import {verifyUser} from '../middlewares.js'

const router = express.Router()

router.post("/signup", signup)
router.post('/login', login)
router.put('/:userId/update', verifyUser, changeUserCredentials)

router.get("/getUser", verifyUser, getUser)





export default router