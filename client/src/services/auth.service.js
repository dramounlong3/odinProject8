//axios module 讓使用可以在同一台電腦透過clinet發送request到server
import axios from "axios";
const API_URL = "http://localhost:8000/api/user";
const AUTH_URL = "http://localhost:8000/game";

//class名稱開頭不一定要大寫
class AuthService {
  login(email, password) {
    //透過axios module 發送request到server端, 並將email+pwd當作參數傳過去
    //axios.request(route,{parameter});
    return axios.post(API_URL + "/login", { email, password });
  }

  googleLogin() {
    return axios.get(API_URL + "/google");
  }

  register(username, email, password) {
    return axios.post(API_URL + "/register", {
      username,
      email,
      password,
    });
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem("user"));
    //user有 success: true or false, token "jwt ...", user:{...}
  }

  logout() {
    //因為login的JWT 資料都先存到localstorage, 當刪掉時, 使用者就沒有jwt, server驗證就不會通過
    localStorage.removeItem("user");
  }

  //認證
  userAuthenticate(controller) {
    let token;
    if (localStorage.getItem("user")) {
      token = JSON.parse(localStorage.getItem("user")).token;
    } else {
      token = "";
    }
    return axios.get(AUTH_URL + "/authenticated", {
      headers: { Authorization: token },
      //signal: controller.signal,
    });
  }

  //fetch pokemon
  fetchPokemon(clientGeneration) {
    let token;
    if (localStorage.getItem("user")) {
      token = JSON.parse(localStorage.getItem("user")).token;
    } else {
      token = "";
    }
    return axios.post(
      AUTH_URL + "/pokemon",
      { clientGeneration },
      {
        headers: { Authorization: token },
      }
    );
  }
}

const authService = new AuthService();
//因為AuthService是一個calss, 所以匯出時加上new直接匯出一個instance
export { authService };
