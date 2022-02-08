import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongogoose from "mongoose";
//import session from "express-session";
import passport from "passport";
import { router as authRoute } from "./routes/auth-route.js";
import { router as gameRoute } from "./routes/game-route.js";
import { pst } from "./config/passport.js";
pst(passport);
const app = express();

mongogoose
  .connect(process.env.DB_CONNECT)
  .then(() => {
    console.log("Successfully connected to mongodb Atlas.");
  })
  .catch((e) => {
    console.log("Atlas Connection failed");
    console.log(e);
  });

//app.use(cors());
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = createServer(app);
const io = new Server(server, {
  //cross-origin-resource-sharing 跨來源資源分享設定
  cors: {
    origin: "http://localhost:3000", //使server sokcet.io 監聽來自此網域的request
  },
});
//cookie由express-session取
// app.use(
//   session({
//     secret: process.env.SECRET,
//     resave: false,
//     saveUninitialized: false,
//   })
// );

//passport初始化
app.use(passport.initialize());
//建立在原本的session之後
// app.use(passport.session());

app.use("/api/user", authRoute);
app.use("/game", passport.authenticate("jwt", { session: false }), gameRoute);

app.get("/", (req, res) => {
  //res.sendFile(path.join(__dirname + "/index.html"));
  res.send("server");
});

//移至game-route.js 透過jwt保護
/*app.post("/pokemon", async (req, res) => {
  let { clientGeneration } = req.body;
  if (
    clientGeneration === undefined ||
    clientGeneration < 1 ||
    clientGeneration > 9
  ) {
    res.send("please select 1~8.");
    return;
  }

  if (generationGroup[clientGeneration - 1] === undefined) {
    console.log("fetchPokemonData, generation " + clientGeneration);
    generationGroup[clientGeneration - 1] = await getPokemon(
      generation[clientGeneration - 1].quantities,
      generation[clientGeneration - 1].offset
    );
    console.log("fetchPokemonData finished.");
  }

  res.send(generationGroup[clientGeneration - 1]);
});*/

app.get("*", (req, res) => {
  res.status(404).send("The URL is not found.");
});

/*****socket.io*****/
let currentRoomNum = 1; //要加入的房間號碼
let emptyRoom = []; //空房號碼
let vacancy = []; //房間內空位
vacancy[0] = [];

io.on("connection", async (socket) => {
  //建立每一位使用者資訊
  let player = {
    playerID: socket.id,
    playerName: "",
    playerRoomNum: 0,
    playerRoomQuan: 0,
    playerIDX: "",
  };

  console.log(`${player.playerID} connected.`);

  //有空房先加入入空房
  if (emptyRoom.length !== 0) {
    socket.join(emptyRoom[0]);
    player.playerRoomNum = emptyRoom[0];

    //將補位的位子加上該玩家資訊
    // vacancy[player.playerRoomNum - 1].find((p, idx, arr) => {
    //   if (!p.playerIDX && p.playerIDX !== 0) {
    //     console.log("in the find function");
    //     arr[idx] = player;
    //     arr[idx].playerIDX = idx;
    //   }
    // });

    //將補位的位子加上該玩家資訊, 但用forEach要中斷較麻煩, 改用for loop找到第一筆後就中斷
    for (let i = 0; i < vacancy[player.playerRoomNum - 1].length; i++) {
      if (
        !vacancy[player.playerRoomNum - 1][i].playerIDX &&
        vacancy[player.playerRoomNum - 1][i].playerIDX !== 0
      ) {
        vacancy[player.playerRoomNum - 1][i] = player;
        vacancy[player.playerRoomNum - 1][i].playerIDX = i;
        break;
      }
    }
    emptyRoom.shift(); //刪掉第一個空位
  } else {
    socket.join(currentRoomNum);
    player.playerRoomNum = currentRoomNum;

    if (io.sockets.adapter.rooms.get(currentRoomNum).size === 1) {
      (player.playerIDX = 0), (vacancy[player.playerRoomNum - 1][0] = player);
    }
    //若加入後房間人數為2，則房間號碼+1
    else if (io.sockets.adapter.rooms.get(currentRoomNum).size === 2) {
      (player.playerIDX = 1), (vacancy[player.playerRoomNum - 1][1] = player);

      currentRoomNum++;
      //建立新房間，因為二維陣列無法直接放值，故須先建立新array，房間號碼和陣列位置差1
      vacancy[currentRoomNum - 1] = [];
    }
  }
  //玩家一進來紀錄房間人數， 且回傳目前房間人數
  player.playerRoomQuan = io.sockets.adapter.rooms.get(
    player.playerRoomNum
  ).size;

  // console.log(vacancy);
  // console.log(
  //   `RoomNumber: ${player.playerRoomNum}, RoomQuan: ${player.playerRoomQuan}`
  // );

  //監聽使用者發送名稱訊息
  socket.on("playerName", (m) => {
    player.playerName = m.name;

    //記錄使用者名稱到對應的空缺中
    vacancy[player.playerRoomNum - 1].forEach((p, idx, arr) => {
      if (p.playerID === socket.id) {
        arr[idx].playerName = player.playerName;
      }
    });

    console.log("Quan " + player.playerRoomQuan);
    //讓第一位玩家在等待時也能顯示自己的名字
    if (player.playerRoomQuan === 1) {
      io.to(player.playerRoomNum).emit("playerNP", {
        playerID: player.playerID,
        player1ID: player.playerID,
        player1Name: player.playerName,
        player1IDX: player.playerIDX,
        player2ID: "",
        player2Name: "",
        player2IDX: "",
        roomQuan: player.playerRoomQuan,
      });
    }
    //當房間人數為2時, 發送雙方使用者名稱和位置給對手和自己
    else if (player.playerRoomQuan === 2) {
      io.to(player.playerRoomNum).emit("playerNP", {
        player1ID: vacancy[player.playerRoomNum - 1][0].playerID,
        player1Name: vacancy[player.playerRoomNum - 1][0].playerName,
        player1IDX: vacancy[player.playerRoomNum - 1][0].playerIDX,
        player2ID: vacancy[player.playerRoomNum - 1][1].playerID,
        player2Name: vacancy[player.playerRoomNum - 1][1].playerName,
        player2IDX: vacancy[player.playerRoomNum - 1][1].playerIDX,
        roomQuan: player.playerRoomQuan,
      });
    }
  });

  //重複確認player2 name
  socket.on("checkP2Name", () => {
    if (vacancy[player.playerRoomNum - 1][1] === undefined) {
      io.to(player.playerRoomNum).emit("returnP2Name", {
        player1ID: vacancy[player.playerRoomNum - 1][0].playerID,
        player1Name: vacancy[player.playerRoomNum - 1][0].playerName,
        player1IDX: vacancy[player.playerRoomNum - 1][0].playerIDX,
        player2ID: "",
        player2Name: "",
        player2IDX: "",
        roomQuan: player.playerRoomQuan,
      });
    } else {
      io.to(player.playerRoomNum).emit("returnP2Name", {
        player1ID: vacancy[player.playerRoomNum - 1][0].playerID,
        player1Name: vacancy[player.playerRoomNum - 1][0].playerName,
        player1IDX: vacancy[player.playerRoomNum - 1][0].playerIDX,
        player2ID: vacancy[player.playerRoomNum - 1][1].playerID,
        player2Name: vacancy[player.playerRoomNum - 1][1].playerName,
        player2IDX: vacancy[player.playerRoomNum - 1][1].playerIDX,
        roomQuan: player.playerRoomQuan,
      });
    }
  });

  //重複確認player2 ID
  socket.on("checkP2ID", () => {
    if (vacancy[player.playerRoomNum - 1][1] === undefined) {
      io.to(player.playerRoomNum).emit("returnP2ID", {
        player1ID: vacancy[player.playerRoomNum - 1][0].playerID,
        player1Name: vacancy[player.playerRoomNum - 1][0].playerName,
        player1IDX: vacancy[player.playerRoomNum - 1][0].playerIDX,
        player2ID: "",
        player2Name: "",
        player2IDX: "",
        roomQuan: player.playerRoomQuan,
      });
    } else {
      io.to(player.playerRoomNum).emit("returnP2ID", {
        player1ID: vacancy[player.playerRoomNum - 1][0].playerID,
        player1Name: vacancy[player.playerRoomNum - 1][0].playerName,
        player1IDX: vacancy[player.playerRoomNum - 1][0].playerIDX,
        player2ID: vacancy[player.playerRoomNum - 1][1].playerID,
        player2Name: vacancy[player.playerRoomNum - 1][1].playerName,
        player2IDX: vacancy[player.playerRoomNum - 1][1].playerIDX,
        roomQuan: player.playerRoomQuan,
      });
    }
  });

  //監聽使用者離開
  socket.on("disconnect", (e) => {
    console.log(socket.id + " left room");
    emptyRoom.push(player.playerRoomNum); //將空位加入最後,
    emptyRoom.sort((a, b) => {
      return a - b;
    }); //並且排序讓接下來進入的人由房間號碼小的開始加入;
    socket.to(player.playerRoomNum).emit("leaveRoom", {
      playerName: player.playerName,
      playerIDX: player.playerIDX,
    }); //發給另一位玩家，斷線者的資訊
    //清除玩家在房間的資訊
    vacancy[player.playerRoomNum - 1].forEach((p, idx, arr) => {
      if (p.playerID === socket.id) {
        arr[idx].playerID = "";
        arr[idx].playerName = "";
        arr[idx].playerRoomNum = 0;
        arr[idx].playerRoomQuan = 0;
        arr[idx].playerIDX = "";
      }
    });
  });

  socket.emit("playerInfo", {
    playerRoomNum: player.playerRoomNum,
    playerRoomQuan: player.playerRoomQuan,
  });

  /*當p1按下開始, p2不能再顯示pokedex按鈕*/
  socket.on("closePokedex", () => {
    socket.to(player.playerRoomNum).emit("notifyClose");
  });

  /*當p1 fetch data結束時, 需再次確認p2是否斷線*/
  socket.on("checkOpponent", () => {
    io.to(player.playerRoomNum).emit("opponentStatus", {
      player2ID: vacancy[player.playerRoomNum - 1][1].playerID,
      player2Name: vacancy[player.playerRoomNum - 1][1].playerName,
      player2IDX: vacancy[player.playerRoomNum - 1][1].playerIDX,
      roomQuan: player.playerRoomQuan,
    });
  });

  /*同步更新翻牌後, 互相需再次確認是否斷線, 且避免主動方與被動方互相影響故改以不同事件名稱確認*/
  socket.on("checkActiveOpponent", () => {
    io.to(socket.id).emit("opponentActiveStatus", {
      //socket.emit("opponentActiveStatus", {
      player1ID: vacancy[player.playerRoomNum - 1][0].playerID,
      player1Name: vacancy[player.playerRoomNum - 1][0].playerName,
      player1IDX: vacancy[player.playerRoomNum - 1][0].playerIDX,
      player2ID: vacancy[player.playerRoomNum - 1][1].playerID,
      player2Name: vacancy[player.playerRoomNum - 1][1].playerName,
      player2IDX: vacancy[player.playerRoomNum - 1][1].playerIDX,
      roomQuan: player.playerRoomQuan,
    });
  });

  /*同步更新翻盤後, 互相需再次確認是否斷線, 且避免主動方與被動方互相影響故改以不同事件名稱確認*/
  socket.on("checkUnactiveOpponent", () => {
    io.to(socket.id).emit("opponentUnactiveStatus", {
      //socket.emit("opponentUnactiveStatus", {
      player1ID: vacancy[player.playerRoomNum - 1][0].playerID,
      player1Name: vacancy[player.playerRoomNum - 1][0].playerName,
      player1IDX: vacancy[player.playerRoomNum - 1][0].playerIDX,
      player2ID: vacancy[player.playerRoomNum - 1][1].playerID,
      player2Name: vacancy[player.playerRoomNum - 1][1].playerName,
      player2IDX: vacancy[player.playerRoomNum - 1][1].playerIDX,
      roomQuan: player.playerRoomQuan,
    });
  });

  /*通知p2卡牌資訊清空和loading圖示開啟*/
  socket.on("notifyURLandLoading", (m) => {
    socket.to(player.playerRoomNum).emit("returnURLandLoading", m);
  });

  /*通知p2 load圖示關閉*/
  socket.on("loading", (m) => {
    socket.to(player.playerRoomNum).emit("returnLoading", m);
  });

  /*傳送遊戲卡片資訊*/
  socket.on("copyPartial", (m) => {
    socket.to(player.playerRoomNum).emit("copyPartial", {
      copyPartial: m.copyPartial,
      generation: m.generation,
    });
  });

  /*傳送點擊卡片資訊*/
  socket.on("clickStatus", (m) => {
    socket.to(player.playerRoomNum).emit("clickStatus", {
      toUserName: m.toUserName,
      toClick1: m.toClick1,
      toClick2: m.toClick2,
      toCard1Index: m.toCard1Index,
      toCard2Index: m.toCard2Index,
      toTempScore1: m.toTempScore1,
      toTempScore2: m.toTempScore2,
      toMatch: m.toMatch,
      toGameIsOver: m.toGameIsOver,
      toWinner: m.toWinner,
    });
  });

  /*傳送遊戲重新開始*/
  socket.on("restart", (m) => {
    //雙方都要通知, 避免房主一結束就初始化變數會造成卡片馬上覆蓋
    io.to(player.playerRoomNum).emit("toRestart", "restart");
  });
});

/*****socket.io*****/

server.listen(8000, () => {
  console.log("the server is running on port 8000.");
});
