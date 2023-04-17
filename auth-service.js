const mongoose = require("mongoose");
const bcrypt = require('bcryptjs')
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
module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection('mongodb+srv://saujla7:{AUJ}%40=[2004]@senecadb.8rowe1c.mongodb.net/?retryWrites=true&w=majority');
        db.on('error', (err) => {
            reject(err);
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};
module.exports.registerUser = function (userData) {
    return new Promise(async (resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject(new Error("Passwords do not match"));
            return;
        }
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(userData.password, salt, async function (err, hash) {
                const newUser = new User({
                    userName: userData.userName,
                    userAgent: userData.userAgent,
                    email: userData.email,
                    password: hash,
                });
                newUser.save().then((result) => {
                    resolve();
                }).catch(err => {
                    console.log("err", err);
                    if (err.code === 11000) {
                        reject(new Error("User Name already taken"));
                    } else {
                        reject(new Error(`There was an error creating the user: ${err}`));
                    }
                });
            });
        });
    });
};
module.exports.checkUser = function (userData) {
    return User.find({ userName: userData.userName })
        .then(users => {
            if (users.length === 0) {
                return Promise.reject(`Unable to find user: ${userData.userName}`);
            }
            const user = users[0];
            const passwordMatch = bcrypt.compareSync(userData.password, user.password);
            if (passwordMatch) {
                const loginRecord = {
                    dateTime: (new Date()).toString(),
                    userAgent: userData.userAgent
                };
                user.loginHistory.push(loginRecord);
                return User.updateOne({ userName: user.userName }, { $set: { loginHistory: user.loginHistory } })
                    .then(() => {
                        return user;
                    })
                    .catch(err => {
                        return Promise.reject(`There was an error verifying the user: ${err}`);
                    });
            } else {
                return Promise.reject(`Incorrect Password for user: ${userData.userName}`);
            }
        })
        .catch(err => {
            console.log("err", err);
            return Promise.reject(err);
        });
}