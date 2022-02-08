//載入passport module
//import passport from "passport";
//透過passport 用 google strategy module驗證google登入
//官網的引用方式可以省略最後的.strategy
import GoogleStrategy from "passport-google-oauth20";
import { User } from "../models/user-model.js";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

//透過passport登入後, 在req中會有三個屬性/函數 可以使用
//req.user                //已經登入的使用者資料
//req.logout()            //幫助已登入的使用者作登出
//res.isAuthenticated()   //確認request端的client, 是否為被認證過的user(是否登入)

const pst = (passport) => {
  passport.serializeUser((user, done) => {
    console.log("Serialiing user now");
    // console.log(user);
    //user是儲存在db內該user的物件資料, 故含有mondodb內建的_id (但此處是已經拿出來儲存在記憶體的地方)
    done(null, user._id);
  });

  //當user透過passport strategy登入時會被serializeUser 配發一組cookie : connect.sid
  //在已登入的情況下, user隨後的任何request都會將connect.sid跟著一起發到server端
  //server端會在每一次接收到request時, 都先進行deserialieUser, 將connect.sid解序列化
  //隨後得知此user是誰, 並將在mongodb內的_id直接回傳給使用者
  //若將_id變數改名, 會出錯, 只能用_id來取得資料, 不像是某個地方呼叫此function, 而是在拿物件內的_id屬性, 所以名稱不能變更
  passport.deserializeUser((_id, done) => {
    console.log("Deserializing user now");
    User.findById({ _id }).then((user) => {
      //console.log("Found user. the _id is " + _id);
      done(null, user);
    });
  });

  //google strategy, 處理用google登入的方式
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        //在google成功登入後要導向哪一個route,  此路徑在auth-route.js, 此時下面的callback function還沒執行就會先跳到auth/google/redirect
        callbackURL: "/api/user/google/redirect",
      },
      //passport callback function
      /*透過auth-route.js的路徑auth/google/redirect內的middleware跳轉到這裡執行google strategy的callback function
       *檢查從google拿到的資訊是否已經儲存在mongodb atlas
       *儲存完或db內已有資訊, 都繼續執行done function
       *接著會先執行serializeUser 將含有簽章的cookie: connect.sid設定好, 並將使用者的db資訊一併存在session(server記憶體)
       *最後再回到auth-route.js的/auth/google/redirect路徑, 執行req,res function 轉到redirect的位置/profile
       *但在轉到routes\profile-route.js /profile路徑之前會先進行deserializeUser, 得到user session相關的資訊,
       *解析完session後, 繼續profile-route.js 並於response profile.ejs之前在執行其對應的middleware檢查是否登入
       *最後回傳profile.ejs頁面給user時, 同步將connect.sid的資訊傳給user*/
      function (accessToken, refreshToken, profile, done) {
        console.log("in Google strategy.");
        //處理goole name > 12 造成schema validator會出錯的問題
        if (profile.displayName.length > 12) {
          for (let i = 1; i <= 12; i++) {
            profile.displayName += profile.displayName[i];
          }
        }

        //google回給server的使用者profile;
        User.findOne({ googleID: profile.id }).then((foundUser) => {
          //console.log(foundUser);
          if (foundUser) {
            console.log("User already exit.");
            done(null, foundUser);
          } else {
            new User({
              username: profile.displayName,
              googleID: profile.id,
              // thumbnail: profile.photos[0].value,
              email: profile.emails[0].value,
            })
              .save()
              .then((newUser) => {
                console.log("New user created.");
                done(null, newUser);
              })
              .catch((e) => {
                console.log("Saved fail.");
                console.log(e);
              });
          }
        });
      }
    )
  );

  let objs = {};
  //推測以下是根據登入時發送token, 空白前的字元JWT, 來決定要解析哪個token
  objs.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
  //推測因為jwt加密時有用到環境變數, 所以解密也需要用到
  objs.secretOrKey = process.env.PASSPORT_SECRET;
  //jwt strategy
  passport.use(
    new JwtStrategy(objs, function (jwt_payload, done) {
      //此處jwt_playload(有測試過, 可以隨意命名)有三個參數 1._id 2.email 3.iat
      //1和2應該是因為在登入時透過auth.js的post login route, 有從資料庫將登入者的_id和email取出, 並透過jwtwebtoken 將_id和email一起包進去, 並簽名(sign)
      //當使用者要到/api/couse的route時, 就會因為middleware的關係跑到passport.js執行jwt strategy
      //所以在此處解析時就可以拿到登入者的_id和email
      //第3個參數應該是jwt自己本身會有的
      //最後就可以透過token裡面的_id來找到資料庫是否有這個人, 如果有就回傳true, 讓使用者可以通過此middleware, 進而到course.js裡面的route
      User.findOne({ _id: jwt_payload._id }, (err, user) => {
        if (err) {
          return done(err, false);
        }
        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      });
    })
  );
};

export { pst };
