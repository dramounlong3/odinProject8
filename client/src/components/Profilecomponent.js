import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../services/socket.service";
import Navcomponent from "./Navcomponent";
import axios from "axios";
import Swal from "sweetalert2";
import * as d3 from "d3";
import { authService } from "../services/auth.service.js";

const Profilecomponent = ({
  roomNum,
  setRoomNum,
  currentUser,
  setCurrentUser,
}) => {
  const navigate = useNavigate();

  const controller = useMemo(() => {
    const reqController = new AbortController();
    return reqController;
  }, []);

  const [profile, setProfile] = useState(null);
  const [editUsername, setEditUsername] = useState(true);
  const [editPassword, setEditPassword] = useState(true);
  const [editUsernameText, setEditUsernameText] = useState("Edit");
  const [editPasswordText, setEditPasswordText] = useState("Edit");
  const [usernameValue, setUsernameValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [authResult, setAuthResult] = useState("");

  const handleEditUsername = (event) => {
    event.preventDefault();

    if (editUsernameText === "Edit") {
      setEditUsername(false);
      setEditUsernameText("Cancel");
    } else {
      setEditUsername(true);
      setEditUsernameText("Edit");
      setUsernameValue("");
    }
  };

  const handleEditPassword = (event) => {
    event.preventDefault();

    if (editPasswordText === "Edit") {
      setEditPassword(false);
      setEditPasswordText("Cancel");
    } else {
      setEditPassword(true);
      setEditPasswordText("Edit");
      setPasswordValue("");
    }
  };

  const handleChangeUsername = (e) => {
    setUsernameValue(e.target.value);
  };

  const handleChangePassword = (e) => {
    setPasswordValue(e.target.value);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    let result = await Swal.fire({
      title: "Are you sure?",
      text: "Change profile.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "OK",
    });

    if (result.isConfirmed) {
      let token;
      let _id;
      if (localStorage.getItem("user")) {
        token = JSON.parse(localStorage.getItem("user")).token;
        _id = JSON.parse(localStorage.getItem("user")).user._id;
      } else {
        token = "";
        _id = "";
      }

      //送出修改資訊
      await axios
        .patch(
          `http://localhost:8000/game/profile/${_id}`,
          {
            username: usernameValue,
            password: passwordValue,
          },
          {
            headers: { Authorization: token },
            signal: controller.signal,
          }
        )
        .then(async (response) => {
          console.log(response.data);
          await Swal.fire({
            title: "Change profile successfully!",
            text: "Your data will be re-loaded.",
          });

          //重新取得toke & user data
          await axios
            .get(`http://localhost:8000/game/profile/reloaded/${_id}`, {
              headers: { Authorization: token },
              signal: controller.signal,
            })
            .then((r) => {
              localStorage.removeItem("user");
              localStorage.setItem("user", JSON.stringify(r.data));
              setCurrentUser(authService.getCurrentUser());
              setErrorMessage(response.data);
              setEditUsernameText("Edit");
              setUsernameValue("");
              setEditUsername(true);
              setEditPasswordText("Edit");
              setPasswordValue("");
              setEditPassword(true);
              //window.location.reload();
            })
            .catch((e) => {
              setErrorMessage(e.response.data);
            });
        })
        .catch((e) => {
          setErrorMessage(e.response.data);
        });
    }
  };

  useEffect(() => {
    socket.disconnect();

    const getProfile = async () => {
      let token;
      let _id;
      if (localStorage.getItem("user")) {
        token = JSON.parse(localStorage.getItem("user")).token;
        _id =
          JSON.parse(localStorage.getItem("user")).user &&
          JSON.parse(localStorage.getItem("user")).user._id;
        //setCurrentUser(JSON.parse(localStorage.getItem("user")).user.username);
      } else {
        token = "";
        _id = "";
      }
      //let authResult;
      let getAuthResult;
      try {
        //若此處用currentUser來判斷，會造成登出時, currentUser被改為空，導致跳轉到登入頁面時因為此處有dependencise currentUser，造成在登入頁面時又跳出此swal
        //驗證jwt, 此處未採用authService內提供的驗證方法, 因為若於此處關閉useAuthenticate, 會造成跳回去game component也會是關閉的狀態, 造成未登入的錯誤狀況
        getAuthResult = await axios.get(
          "http://localhost:8000/game/authenticated",
          {
            headers: { Authorization: token },
            signal: controller.signal,
          }
        );

        setAuthResult(getAuthResult);

        if (getAuthResult.data.authResult) {
          //讀取該玩家的遊戲紀錄
          await axios
            .get(`http://localhost:8000/game/profile/${_id}`, {
              headers: { Authorization: token },
              signal: controller.signal,
            })
            .then((response) => {
              setProfile(response.data);

              if (Array.isArray(response.data)) {
                let gen = 9;
                let preData = [];
                for (let i = 0; i < gen; i++) {
                  preData[i] = {
                    game_generation: `${i + 1}`,
                    game_win: 0,
                    game_lose: 0,
                    game_draw: 0,
                  }; //8代 + mix
                  if (i === 8) {
                    preData[i].game_generation = "mix";
                  }
                }

                response.data.forEach((x) => {
                  switch (x.game_generation) {
                    case "1":
                      x.game_result === "win"
                        ? preData[0].game_win++
                        : x.game_result === "lose"
                        ? preData[0].game_lose++
                        : preData[0].game_draw++;
                      break;
                    case "2":
                      x.game_result === "win"
                        ? preData[1].game_win++
                        : x.game_result === "lose"
                        ? preData[1].game_lose++
                        : preData[1].game_draw++;
                      break;
                    case "3":
                      x.game_result === "win"
                        ? preData[2].game_win++
                        : x.game_result === "lose"
                        ? preData[2].game_lose++
                        : preData[2].game_draw++;
                      break;
                    case "4":
                      x.game_result === "win"
                        ? preData[3].game_win++
                        : x.game_result === "lose"
                        ? preData[3].game_lose++
                        : preData[3].game_draw++;
                      break;
                    case "5":
                      x.game_result === "win"
                        ? preData[4].game_win++
                        : x.game_result === "lose"
                        ? preData[4].game_lose++
                        : preData[4].game_draw++;
                      break;
                    case "6":
                      x.game_result === "win"
                        ? preData[5].game_win++
                        : x.game_result === "lose"
                        ? preData[5].game_lose++
                        : preData[5].game_draw++;
                      break;
                    case "7":
                      x.game_result === "win"
                        ? preData[6].game_win++
                        : x.game_result === "lose"
                        ? preData[6].game_lose++
                        : preData[6].game_draw++;
                      break;
                    case "8":
                      x.game_result === "win"
                        ? preData[7].game_win++
                        : x.game_result === "lose"
                        ? preData[7].game_lose++
                        : preData[7].game_draw++;
                      break;
                    case "mix":
                      x.game_result === "win"
                        ? preData[8].game_win++
                        : x.game_result === "lose"
                        ? preData[8].game_lose++
                        : preData[8].game_draw++;
                      break;
                    default:
                      return;
                  }
                });

                let maxCount = [
                  Math.max(
                    ...preData.map(
                      (p) => p.game_win + p.game_lose + p.game_draw
                    )
                  ),
                ];

                /*d3 畫圖 */
                // 台南勞動人口資料  https://data.gov.tw/dataset/140152
                let data = [];
                async function getData() {
                  // 取資料
                  // let dataGet = await d3.csv(
                  //   "https://raw.githubusercontent.com/vezona/D3.js_iTHome/main/app/data/tainan_labor_force_population.csv"
                  // );

                  let dataGet = preData;

                  data = dataGet;
                  drawBarChart();
                }
                getData();

                // RWD
                function drawBarChart() {
                  // 刪除原本的svg.charts，重新渲染改變寬度的svg
                  d3.select(".chart svg").remove();

                  // RWD 的svg 寬高
                  const rwdSvgWidth = parseInt(
                      d3.select(".chart").style("width")
                    ),
                    //rwdSvgHeight = rwdSvgWidth,
                    rwdSvgHeight = rwdSvgWidth > 650 ? 650 : rwdSvgWidth,
                    margin = 20,
                    marginBottom = 100;

                  const svg = d3
                    .select(".chart")
                    .append("svg")
                    .attr("width", rwdSvgWidth)
                    .attr("height", rwdSvgHeight);
                  //.style("background", "white");

                  // map 資料集
                  const xData = data.map((i) => i["game_generation"]);
                  const subgroups = Object.keys(data[0]).slice(1);

                  // 設定要給 X 軸用的 scale 跟 axis
                  const xScale = d3
                    .scaleBand()
                    .domain(xData)
                    .range([margin * 2, rwdSvgWidth - margin]) // 寬度
                    .padding(0.3);

                  const xAxis = d3.axisBottom(xScale);

                  //y軸說明
                  svg
                    .append("svg")
                    .append("text")
                    .text("Count")
                    .attr("transform", "rotate(-90)")
                    .attr("x", (rwdSvgHeight / 2) * -1)
                    .attr("y", 20)
                    .attr("fill", "darkOrange")
                    .attr("font-size", "20px")
                    .attr("font-weight", "bold");

                  //x軸說明
                  svg
                    .append("svg")
                    .append("text")
                    .text("Generation")
                    .attr("transform", "rotate(0)")
                    .attr("x", rwdSvgWidth * 0.8)
                    .attr("y", 600)
                    .attr("fill", "darkOrange")
                    .attr("font-size", "20px")
                    .attr("font-weight", "bold");

                  // 呼叫繪製x軸、調整x軸位置
                  //const xAxisGroup =
                  svg
                    .append("g")
                    .call(xAxis)
                    .attr(
                      "transform",
                      `translate(0,${rwdSvgHeight - marginBottom})`
                    );

                  // 設定要給 Y 軸用的 scale 跟 axis
                  const yScale = d3
                    .scaleLinear()
                    .domain([
                      0,
                      Math.ceil(maxCount * 1.5) < 4
                        ? 4
                        : Math.ceil(maxCount * 1.5, 0), //避免小數點
                    ])
                    .range([rwdSvgHeight - marginBottom, margin])
                    .nice(); // 補上終點值

                  const yAxis = d3.axisLeft(yScale).ticks(5).tickSize(3);

                  // 呼叫繪製y軸、調整y軸位置
                  //const yAxisGroup =
                  svg
                    .append("g")
                    .call(yAxis)
                    .attr("transform", `translate(${margin * 2},0)`);

                  // 用 d3.stack() 把資料堆疊起來
                  const stackedData = d3.stack().keys(subgroups)(data);
                  // console.log(stackedData)

                  // 設定不同 subgorup bar的顏色
                  const color = d3
                    .scaleOrdinal()
                    .domain(subgroups)
                    .range(["#45ac1c", "#9c2c2c", "#c0b845", "#ffda6b"]);

                  // 開始建立長條圖
                  //const bar =
                  svg
                    .append("g")
                    .selectAll("g")
                    .data(stackedData)
                    .join("g")
                    .attr("fill", (d) => color(d.key))
                    .selectAll("rect")
                    .data((d) => d)
                    .join("rect")
                    .attr("x", (d) => xScale(d.data["game_generation"]))
                    .attr("y", (d) => yScale(d[1]))
                    .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
                    .attr("width", xScale.bandwidth())
                    .style("cursor", "pointer")
                    .on("mouseover", handleMouseOver)
                    .on("mouseleave", handleMouseLeave);

                  // 設定文字標籤
                  const textTag = svg
                    .append("text")
                    .attr("className", "infoText")
                    .style("fill", "#000")
                    .style("font-size", "18px")
                    .style("font-weight", "bold")
                    .style("text-anchor", "middle")
                    .style("opacity", "0");

                  function handleMouseOver(event, i) {
                    const pt = d3.pointer(event, svg.node());

                    d3.select(this).style("opacity", "0.5");

                    // 加上文字標籤
                    textTag
                      .style("opacity", "1")
                      .attr("x", pt[0])
                      .attr("y", pt[1] - 10)
                      .text(
                        event.target.__data__[1] - event.target.__data__[0]
                      );
                  }

                  function handleMouseLeave() {
                    d3.select(this).style("opacity", "1");

                    textTag.style("opacity", "0");
                  }

                  // 加上辨識標籤
                  const tagsWrap = svg
                    .append("g")
                    .selectAll("g")
                    .attr("className", "tags")
                    .data(subgroups)
                    .enter()
                    .append("g");

                  if (window.innerWidth < 780) {
                    tagsWrap.attr("transform", "translate(-70,0)");
                  }

                  tagsWrap
                    .append("rect")
                    .attr("x", (d, i) => (i + 1) * marginBottom * 1)
                    .attr("y", rwdSvgHeight - marginBottom / 2)
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("fill", (d) => color(d));

                  tagsWrap
                    .append("text")
                    .attr("x", (d, i) => (i + 1) * marginBottom * 1)
                    .attr("y", rwdSvgHeight - 10)
                    .style("fill", "#000")
                    .style("font-size", "12px")
                    .style("font-weight", "bold")
                    .style("text-anchor", "middle")
                    .text((d) => d);
                }

                d3.select(window).on("resize", drawBarChart);
              }
              /*d3 畫圖 */
            })
            .catch((e) => {
              console.log(e);
            });
        } else {
          console.log("else");
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
    };

    getProfile();

    return () => {
      controller.abort();
      socket.connect();
    };
  }, [controller, navigate]);

  return (
    <div>
      <Navcomponent
        roomNum={roomNum}
        setRoomNum={setRoomNum}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />
      <div className="container py-3">
        <div className="row gy-5">
          <div className="col-md-5 d-flex justify-content-center align-items-center">
            <form className="well form-horizontal" id="contact_form">
              <div className="container border rounded-3 bg-dark bg-opacity-25 pb-3">
                {errorMessage && (
                  <div className="m-2 text-danger fs-6">{errorMessage}</div>
                )}
                <div className="m-2 text-white fs-6">
                  Change username or password.
                </div>
                <fieldset className="p-2 border rounded-3 bg-light">
                  <div className="form-group mb-2">
                    <label className="control-label text-secondary">
                      E-Mail
                    </label>
                    <div className="inputGroupContainer">
                      <div className="input-group">
                        <span className="input-group-addon">
                          <i className="glyphicon glyphicon-envelope"></i>
                        </span>
                        <input
                          name="email"
                          placeholder={
                            authResult && currentUser && currentUser.user.email
                          }
                          disabled={true}
                          className="form-control"
                          type="text"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-2">
                    <label className=" control-label text-secondary">
                      User Name
                    </label>
                    <div className="inputGroupContainer">
                      <div className="input-group">
                        <input
                          name="Username"
                          value={authResult && usernameValue && usernameValue}
                          placeholder={
                            authResult &&
                            currentUser &&
                            currentUser.user.username
                          }
                          disabled={editUsername}
                          className="form-control"
                          type="text"
                          onChange={handleChangeUsername}
                        />
                        <button
                          className="btn"
                          onClick={(event) => {
                            handleEditUsername(event);
                          }}
                        >
                          {editUsernameText}
                        </button>
                      </div>
                    </div>
                  </div>
                  {authResult && currentUser && !currentUser.user.googleID && (
                    <div className="form-group mb-2">
                      <label className="control-label text-secondary">
                        Password
                      </label>
                      <div className="inputGroupContainer">
                        <div className="input-group">
                          <input
                            name="Password"
                            value={passwordValue}
                            placeholder="Password"
                            disabled={editPassword}
                            className="form-control"
                            type="password"
                            onChange={handleChangePassword}
                          />
                          <button
                            className="btn"
                            onClick={(event) => {
                              handleEditPassword(event);
                            }}
                          >
                            {editPasswordText}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-group mt-4 mb-2">
                    <div className="d-flex justify-content-evenly">
                      <button
                        className="btn btn-warning w-50"
                        onClick={(event) => {
                          handleSend(event);
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </fieldset>
              </div>
            </form>
          </div>

          <div className="col-md-7">
            <h2 className="text-center fw-bold text-dark">
              {authResult && currentUser && currentUser.user.username}{" "}
              <div className="fs-6 text-success">Game records</div>
            </h2>
            {profile && Array.isArray(profile) && (
              <div className="chart border bg-light"></div>
            )}
            {profile && !Array.isArray(profile) && (
              <div className="text-dark rounded-3 fs-4 p-3 text-center">
                {profile}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profilecomponent;
