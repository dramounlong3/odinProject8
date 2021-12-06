import React, { useState } from "react";
//react-router-dom 升到v6後, Switch須以Routes代替，Route 語法有變更請參考下方，且無法在Route內直接寫html，必須都以Component回傳
import { Routes, Route } from "react-router-dom";
import io from "socket.io-client";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import Navcomponent from "./components/Navcomponent";
import Pokemoncomponent from "./components/Pokemoncomponent";
import Pokedexcomponent from "./components/Pokedexcomponent";
import Notfoundcomponent from "./components/Notfoundcomponent";
import "./styles/style.css";

const socket = io("http://localhost:8000");

const App = () => {
  const [url, setUrl] = useState("");
  const [generation, setGeneration] = useState("");

  return (
    <div>
      <Navcomponent />
      <Routes>
        <Route
          path="/"
          element={
            <Pokemoncomponent
              url={url}
              setUrl={setUrl}
              generation={generation}
              setGeneration={setGeneration}
            />
          }
        />
        <Route path="/pokedex" element={<Pokedexcomponent />} />
        <Route path="*" element={<Notfoundcomponent />} />
      </Routes>
    </div>
  );
};

export default App;
