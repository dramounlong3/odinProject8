import io from "socket.io-client";
export const socket = io("http://localhost:8000"); //socket以一般變數的方式傳到其他component使用
