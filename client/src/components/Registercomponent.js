import React, { useState, useEffect } from "react";
//useNavigate最主要的功能是要做redirect
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { socket } from "../services/socket.service";
import Swal from "sweetalert2";

const RegisterComponent = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.disconnect();

    return () => {};
  }, []);

  const handleChangeUsername = (e) => {
    setUsername(e.target.value);
  };
  const handleChangeEmail = (e) => {
    setEmail(e.target.value);
  };
  const handleChangePassword = (e) => {
    setPassword(e.target.value);
  };

  const handleRegister = () => {
    authService
      .register(username, email, password)
      .then(async () => {
        // alert(
        //   "Registeration succeeds. You are now redirected to the game page."
        // );
        await Swal.fire({
          title: "Registeration succeeds!",
          text: "You are now redirected to the login page.",
        });

        navigate("/login");
      })
      .catch((e) => {
        setMessage(e.response.data);
        console.log(e.response);
      });
  };

  return (
    <div className="register-container p-4 bg-light">
      <div className="form">
        <ul className="tab-group">
          <li className="tab">
            <div
              onClick={() => {
                navigate("/login");
              }}
            >
              Back to home
            </div>
          </li>
        </ul>

        <div className="tab-content">
          <div id="signup">
            <br />
            <br />
            {!message && <h1 className="register-title">Sign Up for Free</h1>}
            {message && (
              <div className="alert alert-danger" role="alert">
                {message}
              </div>
            )}
            <div>
              <div className="top-row username">
                <div className="field-wrap">
                  <input
                    type="text"
                    required
                    placeholder="User Name"
                    onChange={handleChangeUsername}
                  />
                </div>
              </div>

              <div className="field-wrap">
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  onChange={handleChangeEmail}
                />
              </div>

              <div className="field-wrap">
                <input
                  type="password"
                  required
                  placeholder="Set A Password"
                  onChange={handleChangePassword}
                />
              </div>

              <button
                type="submit"
                className="button button-block "
                onClick={handleRegister}
              >
                REGESTER
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterComponent;
