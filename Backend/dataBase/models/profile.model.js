import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({

   name : {
       type : String,
       minLength : [3, 'Product name must be at least 3 characters long'],
       maxLength : [30, 'Product name must be at most 30 characters long']
   },
   phone: {
    type: String,
    unique : [true, 'User phone number must be unique'],
   },
   address: {
    type: String,
    minLength:[3,'Address must be at least 3 characters long'],
    maxLength:[30,'Address must be at most 300 characters long'],
   },

   email : {
    type: String,
    trim: true,
    unique: [true, 'User email must be unique'],
    lowercase: true,
    },

    image: {
        type: String,
        trim: true,
    },
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user',
    },
    isAuthenticated : {
        type : Boolean,
        default : false
    },

},{timestamps:true})

profileSchema.post('init',(doc) => {
    console.log(doc)
    doc.image = "http://localhost:3000/profile/" + doc.image

})

export const profileModel = mongoose.model('profile',profileSchema)