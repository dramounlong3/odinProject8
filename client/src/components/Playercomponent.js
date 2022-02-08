import React, { useEffect, useState /*useMemo, useCallback*/ } from "react";
import axios from "axios";
import _ from "lodash";
import Swal from "sweetalert2";
import "../../node_modules/@fortawesome/fontawesome-free/css/all.min.css";
import { socket } from "../services/socket.service.js";
//import { authService } from "../services/auth.service";

let generationFullInfo = [];
//決定要玩的卡牌組數
let gameMatchNumber = 0;

const Playercomponent = React.memo(
  ({
    setUrl,
    generation,
    setGeneration,
    message,
    setMessage,
    userPlayer1Name,
    userPlayer2Name,
    userPlayer2ID,
    setPokemonPartial,
    controlList,
    setControlList,
    score1,
    setScore1,
    score2,
    setScore2,
  }) => {
    const [loading, setLoading] = useState("d-none");
    // const controller = useMemo(() => {
    //   const reqController = new AbortController();
    //   return reqController;
    // }, []);
    // const controller = useCallback(() => {
    //   const controllering = () => {
    //     const reqController = new AbortController();
    //     return reqController;
    //   };
    //   return controllering();
    // }, []);
    let controller;

    useEffect(() => {
      socket.on("copyPartial", (m) => {
        let pokedexLink = document.querySelector("#pokedex");
        pokedexLink.classList.add("d-none");

        setScore1(0);
        setScore2(0);

        setMessage("Game start! Your opponent's turn.");

        setGeneration(m.generation);
        setUrl(m.copyPartial);

        //後攻方預設為pointerEvents = "none";
        const allCards = document.querySelectorAll("div[data-num]");
        allCards.forEach((x, idx, arr) => {
          arr[idx].style.pointerEvents = "none";
        });
      });

      socket.on("notifyClose", () => {
        let pokedexLink = document.querySelector("#pokedex");
        pokedexLink.classList.add("d-none");
      });

      socket.on("returnURLandLoading", (m) => {
        setUrl("");
        let loadingIcon = document.querySelector("#loadingIcon");
        loadingIcon.classList.remove("d-none");
        setLoading(m);
        setMessage("fetch Pokemon data, please wait...");
      });

      socket.on("returnLoading", (m) => {
        setLoading(m);
      });

      socket.on("leaveRoom", (m) => {
        if (controller) controller.abort();
      });

      return () => {
        socket.off("copyPartial");
        socket.off("closePokedex");
        socket.off("returnURLandLoading");
        socket.off("returnLoading");
        socket.off("leaveRoom");
        if (controller) controller.abort();
      };
    }, [setUrl, setMessage, setScore1, setScore2, controller, setGeneration]);

    //處理select onchange 將 generation即時設定
    const handleGeneration = (e) => {
      setGeneration(e.target.value);
      setUrl("");
    };

    const handleStart = () => {
      //generation選定後才能發送post request
      if (!generation) {
        setMessage("You need choose a generation before start the game.");
        return;
      } else {
        setMessage("");
        fetchData(generation);
      }
    };

    //get url of pokemon by useState
    let fullGameData;
    const fetchData = async (clientGeneration) => {
      controller = new AbortController();
      //載入card時需disabled select & button 並使圖鑑Link消失
      setControlList(true);
      let pokedexLink = document.querySelector("#pokedex");
      pokedexLink.classList.add("d-none");

      socket.emit("closePokedex");

      setScore1(0);
      setScore2(0);

      //決定要玩的卡片組數

      async function cardsQuan() {
        const { value } = await Swal.fire({
          title: "How many card do you want to play?",
          input: "number",
          inputAttributes: {
            min: 2,
            max: 10,
            step: 1,
          },
          inputLabel: "input number 2 ~ 10.",
          inputValue: 4, //default input on the screen
          showCancelButton: false, //不顯示取消button
          allowOutsideClick: false, //禁止點彈跳視窗外面取消
          //user input validator
          inputValidator: (value) => {
            if (
              !value ||
              value.split("").includes(".") ||
              parseInt(value, 10) < 2 ||
              parseInt(value, 10) > 10
            ) {
              return "You need to input number 2 ~ 10.";
            }
          },
        });

        return parseInt(value);
      }

      //await cardsQuan();
      gameMatchNumber = await cardsQuan();

      setMessage("fetch Pokemon data, please wait...");
      setUrl("");
      setLoading("d-block");
      socket.emit("notifyURLandLoading", "d-block");

      // fullGameData = await axios.post("http://localhost:8000/game/pokemon", {
      //   clientGeneration,
      // });

      //需要驗通過才能執行
      let token;
      if (localStorage.getItem("user")) {
        token = JSON.parse(localStorage.getItem("user")).token;
      } else {
        token = "";
      }

      axios
        .post(
          "http://localhost:8000/game/pokemon",
          {
            clientGeneration,
          },
          {
            headers: { Authorization: token },
            signal: controller.signal,
          }
        )
        .then((response) => {
          //console.log(response.data);
          fullGameData = response;
          //避免post的過程中對方斷線, 故需再次確認對方是否存在
          socket.emit("checkOpponent");

          socket.on("opponentStatus", (m) => {
            if (m.player2IDX === "" || m.player2ID !== userPlayer2ID) {
              setMessage(
                "Oh no! Your opponent has already left the room. Please wait for next one."
              );
              setLoading("d-none");
              return;
            } else {
              //若未採用剩餘表示法複製, 則下方做洗牌的動作將會造成原先完整的資料也被洗牌, 因為物件的給值方式是傳址
              let gameData = [...fullGameData.data];

              //保存所有世代遊戲資料到陣列之中
              generationFullInfo.push({
                clientGeneration: clientGeneration,
                pokemonData: fullGameData,
              });

              //保留該世代所有資料到useEffect, 無法在同一個線程馬上取得console.log(PokemonFull)的資料, 只能印generationInfo
              //setPokemonFull(generationFullInfo);

              //使用fisherYatesShuffle演算法, 隨機亂數抽取後遊戲進行的資料
              function fisherYatesShuffle(arr) {
                for (let i = arr.length - 1; i > 0; i--) {
                  let j = Math.floor(Math.random() * (i + 1)); //random index
                  [arr[i], arr[j]] = [arr[j], arr[i]]; // swap
                }
                //測試將演算法, 改為由頭開始, 每個組合出現的機率有差異, 故不採用
                // for (let i = 0; i < arr.length - 1; i++) {
                //   let j = Math.floor(Math.random() * (arr.length - i))+1; //random index
                //   [arr[i], arr[j]] = [arr[j], arr[i]]; // swap
                // }
                return arr;
              }
              fisherYatesShuffle(gameData);

              //取前20張卡
              let partialData = gameData.filter((e, idx) => {
                return idx < gameMatchNumber;
              });

              //20張卡串自己後再丟進去隨機排列
              //let copyPartial = partialData.concat(partialData);
              //let copyPartial = [...partialData].concat([...partialData]);
              //let copyPartial = _.cloneDeep([...partialData, ...partialData]); 第一層深拷貝, 第二層淺拷貝
              //以上方式都未完全深拷貝, 如未進行深拷貝, 下方forEach改變第二次串接出來的物件值時會影響到前一個相同物件值
              let copyPartial = _.cloneDeep(partialData).concat(
                _.cloneDeep(partialData)
              );

              fisherYatesShuffle(copyPartial);

              copyPartial.forEach((x, idx, arr) => {
                arr[idx].index = idx;
              });

              setPokemonPartial(copyPartial);
              setLoading("d-none");
              socket.emit("loading", "d-none");
              setUrl(copyPartial);
              setMessage("Game start! Your turn.");

              //將遊戲資訊發送給對方
              socket.emit("copyPartial", { copyPartial, generation });
            }
          });
        })
        .catch((e) => {
          console.log(e);
          setMessage(
            "Oh no! Your opponent has already left the room. Please wait for next one."
          );
          setLoading("d-none");
        });
    };

    return (
      <div className="container py-2">
        <div className="row bg-light p-2 rounded shadow-sm">
          <div className="col col-8-sm d-flex justify-content-center align-items-center border border-info rounded bg-success text-white fw-bold mb-sm-0 mb-2">
            <div className="score1 text-shadow-black text-warning">
              {score1}
            </div>
            <span>&nbsp;&nbsp;</span>
            <div id="p1Name" className="text-shadow-black fs-7">
              {userPlayer1Name}
            </div>
            <div className="text-dark d-flex justify-content-center align-items-center">
              <i className="fas fa-hand-point-left fs-2 mx-2 point-rotate-0"></i>
            </div>
            <div id="p2Name" className="text-shadow-black fs-7">
              {userPlayer2Name}
            </div>
            <span>&nbsp;&nbsp;</span>
            <div className="score2 text-shadow-black text-warning">
              {score2}
            </div>
          </div>
          <div className="col col-sm-4 d-flex justify-content-center align-items-center">
            <select
              className="form-select me-2"
              aria-label="Default select example"
              defaultValue={"DEFAULT"}
              onChange={handleGeneration}
              disabled={controlList}
            >
              <option value="DEFAULT" disabled>
                Select a generation of Pokemon
              </option>
              <option value="1">generation-i</option>
              <option value="2">generation-ii</option>
              <option value="3">generation-iii</option>
              <option value="4">generation-iv</option>
              <option value="5">generation-v</option>
              <option value="6">generation-vi</option>
              <option value="7">generation-vii</option>
              <option value="8">generation-viii</option>
              <option value="9">generation-mix</option>
            </select>
            <button
              className="start btn btn-warning"
              onClick={handleStart}
              disabled={controlList}
            >
              Start
            </button>
          </div>
        </div>
        <div id="message" className="text-danger text-center my-3">
          {message}
        </div>
        {loading && (
          <div
            id="loadingIcon"
            className={`loadingHeight d-flex justify-content-center align-items-center ${loading}`}
          >
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);
export default Playercomponent;
