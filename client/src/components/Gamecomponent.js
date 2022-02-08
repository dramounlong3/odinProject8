import React, { useState, useEffect, useCallback, useMemo } from "react";
import Playercomponent from "./Playercomponent";
import Pokemoncomponent from "./Pokemoncomponent";
import Navcomponent from "./Navcomponent";
import { socket } from "../services/socket.service";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import Cookies from "universal-cookie";
import axios from "axios";
//import { useStateIfMounted } from "use-state-if-mounted";

const Gamecomponent = ({
  roomNum,
  setRoomNum,
  currentUser,
  setCurrentUser,
}) => {
  const navigate = useNavigate();
  const [score1, setScore1] = useState(0); //玩家1配對成功的數量
  const [score2, setScore2] = useState(0); //玩家2配對成功的數量

  const [url, setUrl] = useState(""); //每一張card的src url
  const [generation, setGeneration] = useState(""); //使用者選擇的世代
  const [message, setMessage] = useState(""); //給玩家的提示訊息
  const [pokemonFull, setPokemonFull] = useState([]); //寶可夢世代完整物件資訊
  const [pokemonPartial, setPokemonPartial] = useState([]); //寶可夢隨機排列抽取後物件資訊
  const [roomQuan, setRoomQuan] = useState(0); //玩家所在房間人數
  const [userName, setUserName] = useState(""); //記錄玩家位置
  const [userPlayer1Name, setUserPlayer1Name] = useState(""); //玩家1名稱
  const [userPlayer2Name, setUserPlayer2Name] = useState(""); //玩家2名稱
  const [userPlayer1ID, setUserPlayer1ID] = useState(""); //玩家1 ID
  const [userPlayer2ID, setUserPlayer2ID] = useState(""); //玩家2 ID
  const [controlList, setControlList] = useState(true); //控制select & button disabled status
  //const isUnMounted = useRef(false);

  //effect just for tracking mounted state
  // useEffect(() => {
  //   isUnMounted.current = true;
  //   return () => {
  //     isUnMounted.current = false;
  //   };
  // }, []);

  // const emitPlayerName = useCallback(() => {
  //   if (!currentUser.user.username)

  // }, [currentUser.user.username]);

  const controller = useMemo(() => {
    const reqController = new AbortController();
    return reqController;
  }, []);

  const getCookies = useCallback(() => {
    const cookies = new Cookies();
    return cookies;
  }, []);

  useEffect(() => {
    //判斷使用者是否有登入
    async function inputName() {
      let cookies = getCookies();
      let context = cookies.get("context");
      console.log(context);
      if (context) {
        localStorage.setItem("user", JSON.stringify(context));
        //使用者登入後必須立刻設定currentUser, 否則跳轉到profile頁面時會因為currentUser沒有變化導致, profile直到重新整理或切換頁面之前, 還是會先顯示需要登入的訊息, 當然也可以在profile頁面透過useEffect 載入currentUser
        setCurrentUser(authService.getCurrentUser());
        cookies.remove("context");
      }

      //驗證jwt
      // authService
      //   .userAuthenticate(controller)
      //   .then(async (response) => {
      //     if (response.data.authResult === true) {
      //   if (isUnMounted.current) {
      let token;
      if (localStorage.getItem("user")) {
        token = JSON.parse(localStorage.getItem("user")).token;
      } else {
        token = "";
      }

      let authResult;
      try {
        //若此處用currentUser來判斷，會造成登出時, currentUser被改為空，導致跳轉到登入頁面時因為此處有dependencise currentUser，造成在登入頁面時又跳出此swal
        //驗證jwt, 此處未採用authService內提供的驗證方法, 因為若於此處關閉useAuthenticate, 會造成跳回去game component也會是關閉的狀態, 造成未登入的錯誤狀況
        authResult = await axios.get(
          "http://localhost:8000/game/authenticated",
          {
            headers: { Authorization: token },
            signal: controller.signal,
          }
        );

        if (authResult) {
          /*const { value: name } = await Swal.fire({
            title: "Welcome!",
            input: "text",
            inputLabel: "Please input your name.",
            inputValue: "", //default input on the screen
            showCancelButton: false, //不顯示取消button
            allowOutsideClick: false, //禁止點彈跳視窗外面取消
            //user input validator
            inputValidator: (value) => {
              if (!value || value.length > 12) {
                return "You need to input 1~12 characters!";
              }
            },
          });

          if (name) {
            Swal.fire(`Hi, ${name}`);
            //發送玩家名稱給server
            socket.emit("playerName", { name });
          }*/
          //改為註冊的名稱 ==> 若以註冊名稱顯示, 需考慮限制一位玩家只能開啟一次遊戲畫面, 目前沒卡控
          let name = authService.getCurrentUser();
          socket.emit("playerName", { name: name.user.username });
        } else {
          const handleRedirect = async () => {
            await Swal.fire({
              title: "Oh! no...",
              text: "You must login first.",
            });
            navigate("/login");
          };
          handleRedirect();
        }
      } catch (e) {
        if (e.response !== undefined) {
          const handleRedirect = async () => {
            await Swal.fire({
              title: "Oh! no...",
              text: "You must login first.",
            });
            navigate("/login");
          };
          handleRedirect();
        }
      }
      /* if (authResult) {
        const { value: name } = await Swal.fire({
          title: "Welcome!",
          input: "text",
          inputLabel: "Please input your name.",
          inputValue: "", //default input on the screen
          showCancelButton: false, //不顯示取消button
          allowOutsideClick: false, //禁止點彈跳視窗外面取消
          //user input validator
          inputValidator: (value) => {
            if (!value || value.length > 12) {
              return "You need to input 1~12 characters!";
            }
          },
        });

        if (name) {
          Swal.fire(`Hi, ${name}`);
          //發送玩家名稱給server
          socket.emit("playerName", { name });
        }
        //改為註冊的名稱 ==> 若以註冊名稱顯示, 需另外控制同一個帳號不能再次進入遊戲頁面, 否則會變成兩個名稱都相同再進行遊戲
        // let name = authService.getCurrentUser();
        // socket.emit("playerName", { name: name.user.username });
      } else {
        const handleRedirect = async () => {
          await Swal.fire({
            title: "Oh! no...",
            text: "You must login first.",
          });
          navigate("/login");
        };
        handleRedirect();
      }*/
      // })
      // .catch((e) => {
      //   if (e.response !== undefined) {
      //     const handleRedirect = async () => {
      //       await Swal.fire({
      //         title: "Oh! no...",
      //         text: "You must login first.",
      //       });
      //       navigate("/login");
      //     };
      //     handleRedirect();
      //   }
      // });
      //}
    }
    inputName();

    return () => {
      //使該component useEffect於卸載時, 必須關閉該component socket 避免以下錯誤訊息發生
      //Can't perform a React state update on an unmounted component
      socket.off();
      socket.disconnect();
      controller.abort();
    };
  }, [navigate, getCookies, setCurrentUser, controller]);

  useEffect(() => {
    const openSocket = async () => {
      //驗證jwt
      // await authService
      //   .userAuthenticate(controller)
      //   .then(async (response) => {
      //     if (response.data.authResult) {
      //接收玩家資訊(房間號碼, 房間人數);
      socket.on("playerInfo", (m) => {
        setRoomNum(m.playerRoomNum);
        setRoomQuan(m.playerRoomQuan);
      });

      //接收server傳來的使用者名稱用以判斷應該要顯示於Player1 or Player2
      socket.on("playerNP", (m) => {
        // console.log(m, socket.id);
        setUserPlayer1Name(m.player1Name);

        socket.emit("checkP2ID");
        socket.on("returnP2ID", (p) => {
          if (p.player1ID !== "") {
            setUserPlayer1ID(p.player1ID);
          }
          if (p.player2ID !== "") {
            setUserPlayer2ID(p.player2ID);
          }
        });
        if (m.roomQuan === 1 && m.playerID === socket.id) {
          setUserName(m.player1IDX);
          socket.emit("checkP2Name");
          socket.on("returnP2Name", (x) => {
            if (x.player2Name) {
              setMessage(
                `${x.player2Name} has joined the room. Please start this game.`
              );
            } else {
              setMessage("Waiting for an opponent.");
            }
          });
        } else if (m.roomQuan === 1 && m.playerID !== socket.id) {
          setMessage(`Waiting for ${m.player1Name} starting the game.`);
        } else if (socket.id === m.player1ID && m.roomQuan === 2) {
          //即使上面有宣告, 仍得重新宣告, 否則找不到該物件
          // let startButton = document.querySelector(".start");
          // let selectItem = document.querySelector(".form-select");
          // //因為上面預設disabled = true, 只能透過此方式 或 element.removeAttribute("disabled"); 來取消元素的disabled狀態
          // startButton.disabled = false;
          // selectItem.disabled = false;
          if (m.player2Name !== "") {
            setUserName(m.player1IDX);
            setUserPlayer2Name(m.player2Name);
            setControlList(false);
            setMessage(
              `${m.player2Name} has joined the room. Please start this game.`
            );
          } else {
            setMessage("Waiting for a opponent.");
          }
        } else if (socket.id === m.player2ID && m.roomQuan === 2) {
          setUserName(m.player2IDX);
          setUserPlayer1Name(m.player1Name);
          setUserPlayer2Name(m.player2Name);
          setMessage(`Waiting for ${m.player1Name} starting the game.`);
        }
      });

      //接收server傳來的斷線使用者資訊，透過idx判斷要清空哪一個名字
      socket.on("leaveRoom", (m) => {
        if (m.playerName === "") {
          return;
        }
        setMessage(
          `${m.playerName} left the room, please waiting for next player.`
        );
        //m.playerIDX ? setUserPlayer2Name("") : setUserPlayer1Name("");
        if (m.playerIDX) {
          setUserPlayer2Name("");
          setUserPlayer2ID("");
        } else {
          setUserPlayer1Name("");
        }

        setUrl("");
        setControlList(true);
        let pokedexLink = document.querySelector("#pokedex");
        pokedexLink.classList.remove("d-none");

        let loadingIcon = document.querySelector("#loadingIcon");
        loadingIcon.classList.add("d-none");
      });
      //   } else {
      //     socket.disconnect();
      //   }
      // })
      // .catch((e) => {
      //   console.log(e);
      //   socket.disconnect();
      // });
    };

    openSocket();
    return () => {
      //使該component useEffect於卸載時, 必須關閉該component socket 避免以下錯誤訊息發生
      //Can't perform a React state update on an unmounted component
      socket.off("playerInfo");
      socket.off("playerNP");
      socket.off("leaveRoom");
      //isUnMounted = true;
      //當使用者離開gamecomponent, 斷開socket,
      //controller.abort();
      socket.disconnect();
    };
  }, [setRoomNum]);

  //改由登入模式後, 無須判斷socket是否有連接, 否則會造成多連
  // useEffect(() => {
  //   console.log(socket.connect());
  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);

  //每當重新載入此畫面, 皆須重新連載socket, 因放在useEffect會造成有兩份socket id, 故改在外層
  // if (!socket.disconnected) {
  //   socket.connect();
  // }

  return (
    <div>
      <Navcomponent
        roomNum={roomNum}
        setRoomNum={setRoomNum}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />
      {currentUser && (
        <Playercomponent
          url={url}
          setUrl={setUrl}
          generation={generation}
          setGeneration={setGeneration}
          message={message}
          setMessage={setMessage}
          userName={userName}
          setUserName={setUserName}
          roomNum={roomNum}
          setRoomNum={setRoomNum}
          roomQuan={roomQuan}
          setRoomQuan={setRoomQuan}
          userPlayer1Name={userPlayer1Name}
          setUserPlayer1Name={setUserPlayer1Name}
          userPlayer2Name={userPlayer2Name}
          setUserPlayer2Name={setUserPlayer2Name}
          userPlayer2ID={userPlayer2ID}
          pokemonFull={pokemonFull}
          setPokemonFull={setPokemonFull}
          pokemonPartial={pokemonPartial}
          setPokemonPartial={setPokemonPartial}
          controlList={controlList}
          setControlList={setControlList}
          score1={score1}
          setScore1={setScore1}
          score2={score2}
          setScore2={setScore2}
        />
      )}
      {currentUser && (
        <Pokemoncomponent
          url={url}
          setMessage={setMessage}
          userName={userName}
          setControlList={setControlList}
          setScore1={setScore1}
          setScore2={setScore2}
          generation={generation}
          userPlayer1ID={userPlayer1ID}
          userPlayer2ID={userPlayer2ID}
        />
      )}
    </div>
  );
};

export default Gamecomponent;
