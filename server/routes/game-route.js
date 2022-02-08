import route from "express";
const router = route.Router();
import { getPokemon } from "../api/pokeapi.js";
import {
  fetchPokemonValidation,
  profileValidationForPost,
  profileValidationForPatch,
} from "../validation/validation.js";
import { Profile } from "../models/profile-model.js";
import { User } from "../models/user-model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import moment from "moment";

router.use((req, res, next) => {
  console.log("A request is coming in to game-auth.js");
  next();
});

/**************取得各世代寶可夢*************/
//各世代數量
const generation = [
  { generation: 1, quantities: 151, offset: 0 },
  { generation: 2, quantities: 100, offset: 151 },
  { generation: 3, quantities: 135, offset: 251 },
  { generation: 4, quantities: 107, offset: 386 },
  { generation: 5, quantities: 156, offset: 493 },
  { generation: 6, quantities: 72, offset: 649 },
  { generation: 7, quantities: 88, offset: 721 },
  { generation: 8, quantities: 89, offset: 809 },
  { generation: 9, quantities: 898, offset: 0 },
];

const generationGroup = [];

router.post("/pokemon", async (req, res) => {
  let { clientGeneration } = req.body;
  let { error } = fetchPokemonValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  //改由上方的fetchValidation執行
  //   if (
  //     clientGeneration === undefined ||
  //     clientGeneration < 1 ||
  //     clientGeneration > 9
  //   ) {
  //     res.send("please select 1~8.");
  //     return;
  //   }

  if (generationGroup[clientGeneration - 1] === undefined) {
    console.log("fetchPokemonData, generation " + clientGeneration);
    generationGroup[clientGeneration - 1] = await getPokemon(
      generation[clientGeneration - 1].quantities,
      generation[clientGeneration - 1].offset
    );
    console.log("fetchPokemonData finished.");
  }

  res.send(generationGroup[clientGeneration - 1]);
});
/**************取得各世代寶可夢*************/

/*restful api*/
//顯示該玩家的遊戲紀錄
router.get("/profile/:_id", async (req, res) => {
  let reqpa = {};
  reqpa.user_id = req.params._id;

  Profile.find({ user_id: reqpa.user_id })
    .then((data) => {
      if (data.length > 0) {
        res.send(data);
      } else {
        res.send("The user has no game records or user is not found.");
      }
    })
    .catch((e) => {
      console.log(e);
      res.send(
        "Some error has been happened. Please ask for a technical support."
      );
    }); //此方法會回傳一個array裡面都是物件
});

//儲存遊戲結果
router.post("/profile/:_id", async (req, res) => {
  let reqbd = {};
  reqbd.user_id = req.params._id;
  reqbd.game_generation = req.body.game_generation;
  reqbd.game_result = req.body.game_result;
  //reqbd.game_date = moment(Date.now())
  //.local()
  //.format("YYYY-MM-DDTHH:mm:ss.SSS");
  if (reqbd.game_generation === "9") {
    reqbd.game_generation = "mix";
  }
  let { error } = profileValidationForPost(reqbd);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }

  let profile = new Profile({
    user_id: reqbd.user_id,
    game_generation: reqbd.game_generation,
    game_result: reqbd.game_result,
    //date: reqbd.game_date,
  });

  //必須另建變數為Profle schema的物件，才能使用save, 若直接使用Profile.save({...}) 會出現Profile.save is not a function
  profile
    .save()
    .then(() => {
      console.log(reqbd.user_id + "'s game result has been saved.");
      res.send(reqbd.user_id + "'s game result has been saved.");
    })
    .catch((e) => {
      console.log(e);
      res.send("Game result has not saved.");
    });
});

//更新玩家名稱 或 密碼
router.patch("/profile/:_id", async (req, res) => {
  let { _id } = req.params;

  //先確認此玩家是否用google註冊
  let googleUser = await User.findOne({ _id });

  let reqbd = {};
  let { username, password } = req.body;
  if (username) {
    reqbd.username = username;
  }

  //不是google註冊玩家才能調整password
  if (password && !googleUser.googleID) {
    reqbd.password = password;
  }

  let { error } = profileValidationForPatch(reqbd);

  //validation
  if (
    error ===
    "Either username or password is required before press 'send' button."
  ) {
    //根據googleID是否有值來判斷要回傳哪一個訊息
    if (!googleUser.googleID) {
      return res
        .status(400)
        .send(
          "Either username or password is required before press 'send' button."
        );
    } else {
      return res
        .status(400)
        .send("Username is required before press 'send' button.");
    }
  } else if (error) {
    return res.status(400).send(error.details[0].message);
  }

  //搜尋該玩家資料並修改
  let user = await User.findOne({ _id });
  if (!user) {
    res.status(400).send("The user is not founded.");
  } else {
    //避免其中一個為空時存到空值
    if (!username) {
      username = user.usernaem;
    }
    if (!password) {
      password = user.password;
    } else {
      //加密
      password = await bcrypt.hash(password, 10);
    }

    User.findOneAndUpdate(
      { _id },
      { username, password },
      {
        new: true,
        runValidator: true,
      }
    )
      .then(() => {
        res.status(200).send("User data has been updated.");
      })
      .catch((e) => {
        res.status(500).send(e);
      });
  }
});

//管理員可以刪除任一筆紀錄, 但尚未實作
router.delete("/profile/:_id", async (req, res) => {
  //to do
});

//當玩家變更名稱或密碼時重新取得token
router.get("/profile/reloaded/:_id", async (req, res) => {
  let { _id } = req.params;

  User.findOne({ _id }, function (err, user) {
    if (err) {
      res.status(400).send(err);
    }
    if (!user) {
      res.status(401).send("User is not found.");
    } else {
      const tokenObject = {
        _id: user.id,
        email: user.email,
      };
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      res.send({ success: true, token: "JWT " + token, user });
    }
  });
});

/*restful api*/

//回傳user認證通過
router.get("/authenticated", async (req, res) => {
  res.send({ authResult: true });
});

export { router };
