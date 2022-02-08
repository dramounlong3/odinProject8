import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = mongoose.Schema({
  username: {
    type: String,
    minLength: 1,
    maxLength: 12,
    required: true,
  },
  email: {
    type: String,
    minLength: 6,
    maxLength: 100,
    required: true,
  },
  googleID: {
    type: String,
  },
  password: {
    type: String,
    minLength: 6,
    maxLength: 1024,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

userSchema.methods.isPlayer = function () {
  return this.role == "player";
};

userSchema.methods.isAdmin = function () {
  return this.role == "admin";
};

//因為google save account時，不需密碼，故將save middle移至auth-route.js register
/*userSchema.pre("save", async function (next) {
  //根據呼叫的端的User model object (newUser) 為 this
  //第一次註冊時, this.isModified("passowrd") =>> false, this.isNew =>> true;
  if (this.isModified("password") || this.isNew) {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    next();
  } else {
    next();
  }
});*/

userSchema.methods.hashPassword = async function (password) {
  const hash = await bcrypt.hash(password, 10);
  return hash;
};

userSchema.methods.comparePassword = function (password, cb) {
  //password is from req.body.password, this.password is from DB by req.body.email finding in auth.js
  bcrypt.compare(password, this.password, (err, isMatch) => {
    if (err) {
      return cb(err, isMatch);
    } else {
      cb(null, isMatch);
    }
  });
};

const User = mongoose.model("User", userSchema);
export { User };
