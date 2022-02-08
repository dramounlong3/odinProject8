import route from "express";
const router = route.Router();
import {
  registerValidation,
  loginValidation,
} from "../validation/validation.js";
import { User } from "../models/user-model.js";
import jwt from "jsonwebtoken";
import passport from "passport";
import bcrypt from "bcrypt";
import Cookies from "universal-cookie";

router.use((req, res, next) => {
  console.log("A request is coming in to auth.js");
  next();
});

//測試google/redirect 甚麼時候被呼叫
// const gr = (req, res, next) => {
//   console.log("in gr middleware");
//   next();
// };

router.get("/testAPI", (req, res) => {
  res.send({ message: "Test API is working." });
});

//register
router.post("/register", async (req, res) => {
  //check the validation of data
  let { username, email, password } = req.body;

  //via Joi registerValidation function to check if the registration data is validation
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //check if the user exists
  const emailExist = await User.findOne({ email });
  if (emailExist) {
    return res.status(400).send("Email has already been registered.");
  }

  //加密
  const hash = await bcrypt.hash(password, 10);
  password = hash;

  //register the user
  const newUser = new User({
    username,
    email,
    password,
  });

  //save the user to DB
  try {
    //before the newUser save into DB, it will call Models/user-model.js pre middleware to hash the password
    const savedUser = await newUser.save();
    //react .then的地方可以拿到這個物件
    res.status(200).send({ msg: "success", savedObject: savedUser });
  } catch (error) {
    res.status(400).send("User not saved.");
    console.log(error);
  }
});

//local login
router.post("/login", (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      res.status(400).send(err);
    }
    if (!user) {
      res.status(401).send("Email is not existed.");
    } else if (user.googleID) {
      //避免打google註冊的帳號卻按一般登入, 故需額外判斷
      res
        .status(402)
        .send("The email has already registered by a google account.");
    } else {
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (err) return res.status(400).send(err);
        if (isMatch) {
          const tokenObject = {
            _id: user.id,
            email: user.email,
          };
          const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
          res.send({ success: true, token: "JWT " + token, user });
        } else {
          res.status(401).send("Incorrect email or password.");
        }
      });
    }
  });
});

//google login
router.get(
  "/google",
  //passport.authenticate是middleware, 將使用者透過passport的module送到google的頁面進行登入
  passport.authenticate("google", {
    //選擇要取得甚麼資料, 此處為profile email, 也可以單純的獲取email...之類的
    scope: ["profile", "email"],
    //每次按登入都可以選擇帳戶(即使已經登入)
    prompt: "select_account",
  })
);

//google端成功登入後, 會被導向此route(passport.js  callbackURL的設定),  此時google同時也回傳google端的使用者資訊了
router.get(
  "/google/redirect",
  passport.authenticate("google", {
    failureMessage: "Can't login to Google, please try again later!",
    failureRedirect: "http://localhost:3000/login",
    //successRedirect: "http://localhost:3000/",
    session: false,
  }),
  (req, res) => {
    //再把user導到profile的頁面
    console.log("in Google redirect");
    let { user } = req;
    const tokenObject = {
      //_id: user.googleID,
      _id: user._id, //需存入db中的object_id, 否則後續使用googleID無法在JWT轉換搜尋
      email: user.email,
    };
    const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
    // res.cookie({ success: true, token: "JWT " + token, user });
    //res.send({ success: true, token: "JWT " + token, user });

    //經測試後不需要透過universal-cookie產生cookie內容也可以讓使用者讀取到cookie(只要domain有設定正確即可)
    // const cookies = new Cookies(req.headers.cookie);
    // cookies.set(
    //   "context",
    //   { success: true, token: "JWT " + token, user },
    //   { httpOnly: false }
    // );
    // let userCookies = cookies.get("context");
    res
      .cookie(
        "context",
        { success: true, token: "JWT " + token, user },
        { httpOnly: false, domain: "localhost" }
        //      { success: true, token: "JWT " + token, user },
        //"myText"
      )
      .redirect("http://localhost:3000");
    cookies.remove("context");

    // if (!req.session.rTo) {
    //res.redirect("/");

    //   res.send("profile");
    // } else {
    //   let newPath = req.session.rTo;
    //   req.session.rTo = "";
    //   res.redirect(newPath);
    // }
  }
);
// router.get("/*", (req, res) => {
//   res.send("something wrong.");
// });

// //error handler
// router.use((err, req, res, next) => {
//   res.status(400).send("Something wrong in auth error handler.");
// });

export { router };
