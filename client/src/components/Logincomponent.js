import React, { useState, useEffect } from "react";
import googleIcon from "../img/google.jpg";
import { socket } from "../services/socket.service";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import Swal from "sweetalert2";

const Logincomponent = ({ currentUser, setCurrentUser }) => {
  useEffect(() => {
    socket.disconnect();
    return () => {
      socket.connect();
    };
  }, []);

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleKeyDownLogin = (event) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  };

  const handleChangeEmail = (e) => {
    setEmail(e.target.value);
  };

  const handleChangePassword = (e) => {
    setPassword(e.target.value);
  };

  const handleLogin = () => {
    //AuthService會回傳promise, 所以可以使用tehn catch接成功和失敗的promise物件
    authService
      .login(email, password)
      .then(async (response) => {
        if (response.data) {
          //因為儲存到localstorage的data是json格式, 存進去又會變字串, 所以要先將他以字串型態的josn存進去, 提領出來在解析才會是原本的JSON格式
          localStorage.setItem("user", JSON.stringify(response.data));
          //使用者登入後必須立刻設定currentUser, 否則跳轉到profile頁面時會因為currentUser沒有變化導致, profile直到重新整理或切換頁面之前, 還是會先顯示需要登入的訊息, 當然也可以在profile頁面透過useEffect 載入currentUser
          setCurrentUser(authService.getCurrentUser());
          // alert(
          //   "Login successfully, you are now redirect to the profile page."
          // );
          await Swal.fire({
            title: "Login successfully!",
            text: "You are now redirect to the gmae page.",
          });
        }
        navigate("/");
      })
      .catch((e) => {
        console.log(e.response);
        setMessage(e.response.data);
      });
  };

  const handleGoogleLogin = () => {
    // AuthService.googleLogin()
    //   .then((response) => {
    //     console.log(response);
    //   })
    //   .catch((e) => {
    //     console.log(e);
    //   });
    window.open("http://localhost:8000/api/user/google", "_self");
  };

  return (
    <div
      className="bg-light login-body d-flex align-items-center"
      onKeyDown={handleKeyDownLogin}
    >
      <div className="container p-5">
        <div className="row g-3">
          <div className="col-md-7 d-sm-block d-none border border-sm-dark  rounded-3 p-5 me-2">
            <h3 className="fw-bold  bg-dark text-white p-3 text-center rounded-3">
              Welcome to pokemon memory game.
            </h3>
            <div className="fs-5 d-md-block d-none">
              <p>
                This is a game you can play it with others, and test your
                memory. After you login, you will be matched randomly by server.
              </p>
              <p>
                Also, you can see the game record on the profile page. It
                provides some details about the game you played, and you can
                know each one of game result by generation 1~8 or mix version.
              </p>
              <p>
                If you would like to check a pokemon detail information, you can
                redirect to the pokedex page. The page displays every generation
                from 1 to 8. When your mouse move over on the card, and it will
                show you extra information.
              </p>
              <p className="fs-5 text-center fw-bold text-decoration-underline">
                Enjoy the game, have a nice day!
              </p>
            </div>
          </div>
          <div className="col-md-4 py-5 px-4 d-flex flex-column justify-content-center rounded-3 login-container">
            <div className="mb-3 row">
              {message && (
                <div className="alert alert-danger" role="alert">
                  {message}
                </div>
              )}
              <h2 className="d-sm-none d-block fw-bold  bg-dark text-white p-3 text-center rounded-3 mb-4">
                Welcome
              </h2>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-info fs-6">Login to play</span>
                <span className="text-info fs-6">Pokemon</span>
              </div>

              {/* <div className="col">
                <input
                  type="text"
                  name="playerName"
                  className="form-control bg-skyblue border"
                  id="playerName"
                  placeholder="playerName"
                  onChange={handleChangePlayerName}
                />
              </div> */}
            </div>
            <div className="mb-3 row">
              <div className="col">
                <input
                  type="text"
                  name="email"
                  className="form-control bg-skyblue border"
                  id="staticEmail"
                  placeholder="email"
                  onChange={handleChangeEmail}
                />
              </div>
            </div>
            <div className="mb-3 row">
              <div className="col">
                <input
                  type="password"
                  name="password"
                  className="form-control bg-skyblue border"
                  id="inputPassword"
                  placeholder="password"
                  onChange={handleChangePassword}
                />
              </div>
            </div>
            <div className="mb-3 row">
              <div className="col">
                <button
                  className="btn btn-primary w-100 gen-shadow"
                  onClick={handleLogin}
                >
                  Login
                </button>
              </div>
            </div>
            <div className="mb-3 row">
              <div className="col">
                <button
                  className="btn btn-info w-100 gen-shadow text-light"
                  onClick={() => {
                    navigate("/register");
                  }}
                >
                  Sign up
                </button>
              </div>
            </div>
            <div className="position-relative m-3">
              <div className="progress" style={{ height: "1px" }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: "0%" }}
                  aria-valuenow="50"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <div
                className="
                  position-absolute
                  top-0
                  start-50
                  translate-middle
                  px-sm-2 px-1
                "
              >
                <span className="text-dark">or</span>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <button
                  onClick={handleGoogleLogin}
                  //href="http://localhost:8000/api/user/google"
                  className="btn btn-white w-100 gen-shadow d-flex justify-content-around align-items-center text-secondary"
                >
                  <img
                    src={googleIcon}
                    alt="Google"
                    className="google-icon rounded-3"
                  />
                  <span>Login with google</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logincomponent;
