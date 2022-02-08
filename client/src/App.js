import React, { useState } from "react";
//react-router-dom 升到v6後, Switch須以Routes代替，Route語法有變更請參考下方，且無法在Route內直接寫html，必須都以Component回傳
import { Routes, Route } from "react-router-dom";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
// import Navcomponent from "./components/Navcomponent";
import Pokedexcomponent from "./components/Pokedexcomponent.js";
import Notfoundcomponent from "./components/Notfoundcomponent";
import Gamecomponent from "./components/Gamecomponent";
import Logincomponent from "./components/Logincomponent";
import "./styles/style.css";
import Registercomponent from "./components/Registercomponent";
import { authService } from "./services/auth.service";
import Profilecomponent from "./components/Profilecomponent";

const App = () => {
  const [roomNum, setRoomNum] = useState(""); //玩家房間號碼
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser()); //登入後記錄玩家json web token等...資訊, 每次重整都會從App開始從撈, 所以要寫函數每次都讀取

  return (
    <div>
      {/* <Navcomponent roomNum={roomNum} setRoomNum={setRoomNum} /> */}
      <Routes>
        <Route
          path="/login"
          element={
            <Logincomponent
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          }
        />
        <Route path="register/" element={<Registercomponent />} />

        <Route
          path="/"
          element={
            <Gamecomponent
              roomNum={roomNum}
              setRoomNum={setRoomNum}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          }
        />

        <Route
          path="/pokedex"
          element={
            <Pokedexcomponent
              roomNum={roomNum}
              setRoomNum={setRoomNum}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          }
        />

        <Route
          path="/profile"
          element={
            <Profilecomponent
              roomNum={roomNum}
              setRoomNum={setRoomNum}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          }
        />

        <Route path="*" element={<Notfoundcomponent />} />
      </Routes>
    </div>
  );
};

export default App;
