const { default: mongoose } = require("mongoose");
mongoose.connect('mongodb+srv://saujla7:{AUJ}%40=[2004]@senecadb.8rowe1c.mongodb.net/?retryWrites=true&w=majority');
const userSchema = new mongoose.Schema({
    userName: { type: String, unique: true },
    password: String,
    email: String,
    loginHistory: [
        {
            dateTime: Date,
            userAgent: String
        }
    ]
});
const userMode = mongoose.model('User', userSchema)
export default userMode;