import express from "express";
import { addQuote, deleteQuote, getAllQuotes, getQuoteById, updateQuote } from "./quotes.controller.js";
import { validation } from "../../middleware/validation.js";
import { addQuoteSchema, updateQuoteSchema } from "./quotes.validation.js";

const quoteRouter = express.Router();

quoteRouter.route('/')
    .post(validation(addQuoteSchema), addQuote)
    .get(getAllQuotes);

quoteRouter.route('/:id')
    .get(getQuoteById)
    .put(validation(updateQuoteSchema), updateQuote)
    .delete(deleteQuote);

export default quoteRouter;
