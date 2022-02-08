import React, { useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid"; //載入uuid模組, 生成unique key
import Swal from "sweetalert2";
import { socket } from "../services/socket.service.js";
import axios from "axios";

//記錄點擊的兩張牌
let cardStatus = [];
//記錄目前點的兩張卡id
let click1 = "";
let click2 = "";
//記錄前一張卡DOM
let card1 = "";
//初始化雙方分數, 避免和player component採用共同的state, 導致父元件Gameponent重新渲染, 造成子元件也都跟著重新渲染
let tempScore1 = 0;
let tempScore2 = 0;
//傳送給對方點擊卡片的index
let card1Index = "";
let card2Index = "";
//兩張卡是否match
let match = false;
//判斷遊戲是否結束
let gameIsOver = false;
let winner = "";

const Pokemoncomponent = React.memo(
  ({
    //socket,
    url,
    setMessage,
    userName,
    setControlList,
    setScore1,
    setScore2,
    generation,
    userPlayer1ID,
    userPlayer2ID,
  }) => {
    const controller = useMemo(() => {
      const reqController = new AbortController();
      return reqController;
    }, []);

    const gameOver = useCallback(
      (result, activeName) => {
        const gameOvering = (result, activeName) => {
          setTimeout(() => {
            Swal.fire({
              title: result === "win" ? "Congratulation!" : "Oh! oh! ",
              text: result === "draw" ? `It's a draw` : `You ${result}`,
            });

            //因為被呼叫的那一方 無法取得當下的 userName, 故改為由對方的toUserName來反向判斷
            if (userName === "") {
              if (activeName) {
                setMessage("Game over. Press start to restart a game.");
              } else {
                setMessage("Waiting for opponent restart a game.");
              }
            } else {
              if (userName) {
                setMessage("Waiting for opponent restart a game.");
              } else {
                setMessage("Game over. Press start to restart a game.");
              }
            }

            //儲存遊戲結果到DB
            let token;
            let _id;
            if (localStorage.getItem("user")) {
              token = JSON.parse(localStorage.getItem("user")).token;
              _id = JSON.parse(localStorage.getItem("user")).user._id;
            } else {
              token = "";
              _id = "";
            }

            //console.log("send_generation= ", send_generation);
            //若此處用currentUser來判斷，會造成登出時, currentUser被改為空，導致跳轉到登入頁面時因為此處有dependencise currentUser，造成在登入頁面時又跳出此swal
            //驗證jwt, 此處未採用authService內提供的驗證方法, 因為若於此處關閉useAuthenticate, 會造成跳回去game component也會是關閉的狀態, 造成未登入的錯誤狀況
            axios
              .post(
                `http://localhost:8000/game/profile/${_id}`,
                {
                  game_generation: generation,
                  game_result: result,
                },
                {
                  headers: { Authorization: token },
                  signal: controller.signal,
                }
              )
              .then((response) => {
                console.log(response.data);
              })
              .catch((e) => {
                if (e.response !== undefined) {
                  console.log(e);
                }
              });
          }, 1000);
        };

        gameOvering(result, activeName);
      },
      [setMessage, userName, controller, generation]
    );

    //處理玩家點擊卡牌
    const handleFlip = (e) => {
      //所有卡DOM
      const allCards = document.querySelectorAll("div[data-num]");

      //處理玩家點擊卡片的資訊
      if (!click1) {
        click1 = e.target.parentElement.getAttribute("data-num");
        card1 = e.target;

        card1Index = e.target.parentElement.getAttribute("data-index");

        //傳送第一次點擊卡片資訊給對方
        socket.emit("clickStatus", {
          toUserName: userName,
          toClick1: click1,
          toClick2: "",
          toCard1Index: card1Index,
          toCard2Index: "",
          toTempScore1: "",
          toTempScore2: "",
          toMatch: false,
          toGameIsOver: false,
          toWinner: "",
        });
      } else {
        //當玩家按下第二張牌的瞬間, 所有牌都不能按
        allCards.forEach((cards) => {
          cards.style.pointerEvents = "none";
        });

        click2 = e.target.parentElement.getAttribute("data-num");
        card2Index = e.target.parentElement.getAttribute("data-index");
      }

      //翻牌, 花1秒
      e.target.classList.toggle("cover-flip");
      e.target.nextElementSibling.classList.toggle("back-flip");
      e.target.parentElement.style.pointerEvents = "none";
      //console.log(e.target.parentElement);

      //比較兩者是否相同
      if (click2 && click1 === click2) {
        // //此刻userName透過App.js socket.on("playerNP") 設定為0 or 1的位置, 非初始姓名
        if (!userName) {
          setScore1(tempScore1 + 1);
          tempScore1++;
        } else {
          setScore2(tempScore2 + 1);
          tempScore2++;
        }

        e.target.parentElement.setAttribute("data-match", "true");
        card1.parentElement.setAttribute("data-match", "true");
        match = true;

        const matchNumber = document.querySelectorAll("div[data-match]").length;

        //在發送資訊給對方之前判斷遊戲是否已結束
        if (matchNumber === allCards.length) {
          gameIsOver = true;
          if (!userName) {
            winner =
              tempScore1 > tempScore2
                ? userName
                : tempScore1 < tempScore2
                ? !userName
                : "";
          } else {
            winner =
              tempScore1 > tempScore2
                ? !userName
                : tempScore1 < tempScore2
                ? userName
                : "";
          }
          winner === ""
            ? gameOver("draw", userName)
            : winner === userName
            ? gameOver("win", userName)
            : gameOver("lose", userName);
        }

        //若相同, 僅保持配對的卡不能再按
        allCards.forEach((cards) => {
          if (cards.getAttribute("data-match")) {
            cards.style.pointerEvents = "none";
          }
        });

        cardStatus.push({
          toUserName: userName,
          toClick1: click1,
          toClick2: click2,
          toCard1Index: card1Index,
          toCard2Index: card2Index,
          toTempScore1: tempScore1,
          toTempScore2: tempScore2,
          toMatch: match,
          toGameIsOver: gameIsOver,
          toWinner: winner,
        });
        //傳送第二次點擊卡片資訊給對方
        //socket.emit("clickStatus", cardStatus.at(-1)); //網頁瀏覽器無法辨識at function
        socket.emit("clickStatus", cardStatus[cardStatus.length - 1]);

        // //點擊卡片恢復預設值, 太早清空會導致上面的card1無DOM
        setTimeout(() => {
          //未配對的卡片需要等待翻牌後1秒後才能按, 否則會造成配對成功可以連按三張的問題
          allCards.forEach((cards) => {
            if (!cards.getAttribute("data-match")) {
              cards.style.pointerEvents = "visible";
            }
          });

          click1 = "";
          click2 = "";
          card1 = "";
          if (gameIsOver) {
            gameIsOver = false;
            winner = "";
            if (!userName) {
              setControlList(false);
            }
            //通知對方遊戲重新開始
            socket.emit("restart", "restart");
            initialGameVariable();
            //結束後不能再按卡牌
            allCards.forEach((cards) => {
              cards.style.pointerEvents = "none";
            });
          }
        }, 1000);
      } else if (click2 && click1 !== click2) {
        //蓋牌, 若兩張不相同, 因為翻牌需1秒, +0.5秒才蓋牌讓使用者有時間記牌
        match = false;
        cardStatus.push({
          toUserName: userName,
          toClick1: click1,
          toClick2: click2,
          toCard1Index: card1Index,
          toCard2Index: card2Index,
          toTempScore1: tempScore1,
          toTempScore2: tempScore2,
          toMatch: match,
          toGameIsOver: gameIsOver,
          toWinner: winner,
        });

        //傳送第二次點擊卡片資訊給對方
        //socket.emit("clickStatus", cardStatus.at(-1)); //網頁瀏覽器無法辨識at function
        socket.emit("clickStatus", cardStatus[cardStatus.length - 1]);

        setTimeout(() => {
          if (e.target && card1) {
            e.target.classList.toggle("cover-flip");
            e.target.nextElementSibling.classList.remove("back-flip");

            //前一張牌也需蓋牌
            card1.classList.toggle("cover-flip");
            card1.nextElementSibling.classList.remove("back-flip");
          }
        }, 1500);

        setTimeout(() => {
          //測時時, 可以先以同個玩家按錯後, 待蓋牌結束就使未配對的牌可以按
          // allCards.forEach((cards) => {
          //   if (!cards.getAttribute("data-match")) {
          //     cards.style.pointerEvents = "visible";
          //   }
          // });
          socket.emit("checkActiveOpponent");
          socket.on("opponentActiveStatus", (m) => {
            //若p1斷線後續不須執行
            if (
              m.player1IDX === "" ||
              m.player1ID !== userPlayer1ID ||
              m.player2IDX === "" ||
              m.player2ID !== userPlayer2ID
            ) {
              return;
            } else {
              //旋轉箭頭
              let point = document.querySelector(".fa-hand-point-left");

              if (point) {
                point.classList.toggle("point-rotate-180");

                setMessage("Your opponent's turn.");

                //點擊卡片恢復預設值, 太早清空會導致上面的card1無DOM
                click1 = "";
                click2 = "";
                card1 = "";
              }
            }
            //若未關閉, 會造成此事件多次被呼叫
            socket.off("opponentActiveStatus");
          });
        }, 2500);
      }
    };

    const handleOpponentCard = useCallback(
      (
        toUserName,
        toClick1,
        toClick2,
        toCard1Index,
        toCard2Index,
        toTempScore1,
        toTempScore2,
        toMatch,
        toGameIsOver,
        toWinner
      ) => {
        const handleOpponentCarding = (
          toUserName,
          toClick1,
          toClick2,
          toCard1Index,
          toCard2Index,
          toTempScore1,
          toTempScore2,
          toMatch,
          toGameIsOver,
          toWinner
        ) => {
          const allCards = document.querySelectorAll("div[data-num]");
          let opponentCard;
          //同步翻牌
          if (toClick2 === "") {
            //因為nodelist為array-like, 並非array, 無法使用map or find methods, 可參考MDN 目前只有少量array method可以使用
            allCards.forEach((x, idx, arr) => {
              if (x.getAttribute("data-index") === toCard1Index) {
                opponentCard = arr[idx];
              }
            });
          } else {
            allCards.forEach((x, idx, arr) => {
              if (x.getAttribute("data-index") === toCard2Index) {
                opponentCard = arr[idx];
              }
            });
          }

          //翻牌, 花1秒
          opponentCard.childNodes[0].classList.toggle("cover-flip");
          opponentCard.childNodes[1].classList.toggle("back-flip");
          opponentCard.style.pointerEvents = "none";

          //比較兩者是否相同
          if (toClick2 !== "" && toClick1 === toClick2) {
            //接收端需顯示對方的分數, 跟設定對方的分數, 才能於主動方點及卡片時判斷勝負
            if (!toUserName) {
              setScore1(toTempScore1);
              tempScore1 = toTempScore1;
            } else {
              setScore2(toTempScore2);
              tempScore2 = toTempScore2;
            }

            let tempOpponentCard1 = allCards[toCard1Index];
            let tempOpponentCard2 = allCards[toCard2Index];
            tempOpponentCard1.setAttribute("data-match", "true");
            tempOpponentCard2.setAttribute("data-match", "true");

            //判斷遊戲是否結束
            if (toGameIsOver && toWinner === "") {
              gameOver("draw", toUserName);
              //useStae 若透過他人呼叫, 都是預設值, 故將userName的比較改為toUserName反向判斷
            } else if (toGameIsOver && toWinner === !toUserName) {
              gameOver("win", toUserName);
            } else if (toGameIsOver && toWinner === toUserName) {
              gameOver("lose", toUserName);
            }

            //判斷被呼叫方是否為房主, 只有房主可以再次選擇遊戲內容
            if (toGameIsOver && toUserName) {
              setControlList(false);
              initialGameVariable();
            }
          } else if (toClick2 !== "" && toClick1 !== toClick2) {
            //蓋牌, 若兩張不相同, 因為翻牌需1秒, +0.5秒才蓋牌讓使用者有時間記牌
            setTimeout(() => {
              let tempOpponentCard1 = allCards[toCard1Index];
              let tempOpponentCard2 = allCards[toCard2Index];
              tempOpponentCard1.childNodes[0].classList.toggle("cover-flip");
              tempOpponentCard1.childNodes[0].nextElementSibling.classList.remove(
                "back-flip"
              );

              tempOpponentCard2.childNodes[0].classList.toggle("cover-flip");
              tempOpponentCard2.childNodes[0].nextElementSibling.classList.remove(
                "back-flip"
              );
            }, 1500);

            setTimeout(() => {
              socket.emit("checkUnactiveOpponent");

              socket.on("opponentUnactiveStatus", (m) => {
                //若p1斷線後續不須執行
                if (
                  m.player1IDX === "" ||
                  m.player1ID !== userPlayer1ID ||
                  m.player2IDX === "" ||
                  m.player2ID !== userPlayer2ID
                ) {
                  return;
                } else {
                  //旋轉箭頭
                  let point = document.querySelector(".fa-hand-point-left");
                  if (point) {
                    point.classList.toggle("point-rotate-180");
                  } else {
                    return;
                  }
                  setMessage("Your turn.");

                  //換我對方時, 須將未配對的牌設成visible
                  allCards.forEach((cards) => {
                    if (!cards.getAttribute("data-match")) {
                      cards.style.pointerEvents = "visible";
                    }
                  });
                }
                //若未關閉, 會造成此事件多次被呼叫
                socket.off("opponentUnactiveStatus");
              });
            }, 2500);
          }
        };

        handleOpponentCarding(
          toUserName,
          toClick1,
          toClick2,
          toCard1Index,
          toCard2Index,
          toTempScore1,
          toTempScore2,
          toMatch,
          toGameIsOver,
          toWinner
        );
      },
      [
        gameOver,
        setControlList,
        setMessage,
        setScore1,
        setScore2,
        userPlayer1ID,
        userPlayer2ID,
      ]
    );

    //初始化變數
    const initialGameVariable = () => {
      cardStatus = [];
      click1 = "";
      click2 = "";
      card1 = "";
      tempScore1 = 0;
      tempScore2 = 0;
      card1Index = "";
      card2Index = "";
      match = false;
      gameIsOver = false;
      winner = "";
      let point = document.querySelector(".fa-hand-point-left");
      let pokedexLink = document.querySelector("#pokedex");
      if (point && pokedexLink) {
        point.classList.remove("point-rotate-180");
        pokedexLink.classList.remove("d-none");
      }
    };

    initialGameVariable();

    useEffect(() => {
      //接收對方點擊卡片的資訊
      socket.on("clickStatus", (m) => {
        handleOpponentCard(
          m.toUserName,
          m.toClick1,
          m.toClick2,
          m.toCard1Index,
          m.toCard2Index,
          m.toTempScore1,
          m.toTempScore2,
          m.toMatch,
          m.toGameIsOver,
          m.toWinner
        );
      });

      //對方斷線需要將變數初始化
      socket.on("leaveRoom", (m) => {
        initialGameVariable();
      });

      //遊戲重新開始需初始化變數
      socket.on("toRestart", (m) => {
        initialGameVariable();
      });

      // unsubscribe from event for preventing memory leaks
      return () => {
        socket.off("clickStatus");
        //socket.off("leaveRoom");
        socket.off("toRestart");
        socket.off("opponentUnactiveStatus");
        socket.off("opponentActiveStatus");
      };
    }, [handleOpponentCard]);

    return (
      <div className="container">
        <div className="d-flex flex-wrap justify-content-center align-items-center">
          {url &&
            url.map((x) => {
              return (
                <div
                  className="card-container"
                  data-num={x.id}
                  data-index={x.index}
                  key={uuidv4()}
                  onClick={handleFlip}
                >
                  <div className="cover"></div>
                  <div className="back">
                    <img
                      src={x.photo}
                      alt="pokemon"
                      className="shadow-sm pokemon-card"
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  }
);

export default Pokemoncomponent;
