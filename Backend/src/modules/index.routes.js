import { globalErrorMiddleware } from "../middleware/globalErrorMiddleware.js"
import { AppError } from "../utils/AppError.js"
import authRouter from "./auth/auth.router.js"
import { companyRouter } from "./Company(from)/company.router.js"
import { customerRouter } from "./Customer(to)/customer.router.js"
import invoiceRouter from "./invoices/invoices.routes.js"
import productRouter from "./product/product.router.js"
import profileRouter from "./Profile/profile.router.js"
import { userRouter } from "./user/user.router.js"
import returnsRouter from "./returns/returns.routes.js"
import quoteRouter from "./quotes/quotes.routes.js"
import salesCustomerRouter from "./customers/customers.routes.js"
import paymentRouter from "./payments/payments.routes.js"
import salesRouter from "./sales/sales.routes.js"




export function routes(app) {

    app.use('/api/v1/users', userRouter)
    app.use('/api/v1/auth', authRouter)
    app.use('/api/v1/invoices', invoiceRouter)
    app.use('/api/v1/products', productRouter)
    app.use('/api/v1/companies', companyRouter)
    app.use('/api/v1/customers', customerRouter)
    app.use('/api/v1/profiles', profileRouter)
    app.use('/api/v1/returns', returnsRouter)
    app.use('/api/v1/quotes', quoteRouter)
    app.use('/api/v1/sales-customers', salesCustomerRouter)
    app.use('/api/v1/payments', paymentRouter)
    app.use('/api/v1/sales', salesRouter)


    app.use('*', (req, res, next) => {
        // res.status(404).json({message : 'Route not found'})
        next(new AppError(`Route ${req.originalUrl} not found`, 404))
    })
    // global error handling middleware
    app.use(globalErrorMiddleware)
}