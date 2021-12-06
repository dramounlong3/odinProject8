import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
const app = express();
// import { P } from "./api/pokeapi.js";
import { getPokemon } from "./api/pokeapi.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  //cross-origin-resource-sharing 跨來源資源分享設定
  cors: {
    origin: "http://localhost:3000", //使server sokcet.io 監聽來自此網域的request
    //methods: ["GET", "POST"],
  },
});

/**************取得各世代寶可夢*************/
//各世代數量
const generation = [
  { generation: 1, quantities: 151, offset: 0 },
  { generation: 2, quantities: 100, offset: 151 },
  { generation: 3, quantities: 135, offset: 251 },
  { generation: 4, quantities: 107, offset: 386 },
  { generation: 5, quantities: 156, offset: 493 },
  { generation: 6, quantities: 72, offset: 649 },
  { generation: 7, quantities: 88, offset: 721 },
  { generation: 8, quantities: 89, offset: 809 },
];

const generationGroup = [];

/**************取得各世代寶可夢*************/

app.get("/", (req, res) => {
  //res.sendFile(path.join(__dirname + "/index.html"));
  res.send("server");
});

app.post("/pokemon", async (req, res) => {
  let { clientGeneration } = req.body;
  if (generationGroup[clientGeneration - 1] === undefined) {
    generationGroup[clientGeneration - 1] = await getPokemon(
      generation[clientGeneration - 1].quantities,
      generation[clientGeneration - 1].offset
    );
    console.log("in the if");
  }

  res.send(generationGroup[clientGeneration - 1]);
});

app.get("*", (req, res) => {
  res.status(404).send("Not found.");
});

io.on("connection", async (socket) => {
  //確保取得資訊後才回傳

  console.log(`${socket.id} someone connected.`);
});

server.listen(8000, () => {
  console.log("the server is running on port 8000.");
});
