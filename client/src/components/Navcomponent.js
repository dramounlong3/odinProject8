import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import Swal from "sweetalert2";

const Navcomponent = React.memo(
  ({ roomNum, setRoomNum, currentUser, setCurrentUser }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
      let result = await Swal.fire({
        title: "Are you sure?",
        text: "You will logout.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "OK",
      });

      if (result.isConfirmed) {
        //清空localStorage
        authService.logout();
        setCurrentUser(null); //或重新取得setCurrentUser(AuthService.getCurrentUser()); 也可以
        //alert("Logout successfully, now you redirect to the homepage.");
        await Swal.fire({
          title: "Logout successfully!",
          text: "Now you redirect to the homepage.",
        });

        //登出時即清空currentUser

        navigate("/login");
      }
    };

    return (
      <div className="d-flex bg-dark justify-content-evenly align-items-center py-sm-3 py-0 flex-wrap">
        <div className="d-flex justify-content-center align-items-center flex-wrap">
          <h1 className="d-sm-flex d-none align-items-center text-center fst-italic text-white text-shadow-yellow fw-bold me-3 mb-2 title-spacing">
            P<i className="iball mx-1"></i>kemon
          </h1>
          <h2 className="d-flex justify-content-center">
            <span className="text-info fw-bold">Room:</span>
            <span className="text-info fw-bold">{roomNum}</span>
          </h2>
        </div>
        <div className="d-flex justify-content-center align-items-center">
          <ul className="d-flex flex-column list-unstyled ">
            <li>
              <Link className="text-warning" to="/">
                Game
              </Link>
            </li>
            <li id="pokedex">
              <Link className="text-warning" to="/pokedex">
                Pokedex
              </Link>
            </li>
            <li id="profile">
              <Link className="text-warning" to="/profile">
                Profile
              </Link>
            </li>
            {!currentUser && (
              <li>
                <Link className="text-warning" to="/login">
                  Login
                </Link>
              </li>
            )}
            {currentUser && (
              <li>
                <Link onClick={handleLogout} className="text-warning" to="#">
                  Logout
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  }
);

export default Navcomponent;
