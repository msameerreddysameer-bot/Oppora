import express from "express"
import cors from "cors"
import cookieParser from "cookie-Parser"

const app = express()

app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        credentials:true
    }
))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true , limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import authRouter from "./auth/auth.routes.ts";
import userRouter from "./user/user.routes.ts";
import opportunityRouter from "./opportunity/opportunity.routes.ts"
import savedOpportunitiesRouter from "./saved Opportunity/saved opportunity routes.ts"
import applicationRouter from "./application/application routes.ts"

import { errorHandler } from "./utils/error.middleware.ts"

app.use("/api/v1/auth",authRouter)
app.use("/api/v1/user",userRouter)
app.use("/api/v1/opportunity",opportunityRouter)
app.use("/api/v1/saved-opportunities",savedOpportunitiesRouter)
app.use("/api/v1/application",applicationRouter)


// Global error handling middleware (must be after all routes)
app.use(errorHandler)

export default app