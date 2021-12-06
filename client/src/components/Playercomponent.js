import React from "react";
import axios from "axios";

const Playercomponent = ({ url, setUrl, generation, setGeneration }) => {
  //處理select onchange 將 generation即時設定
  const handleGeneration = (e) => {
    setGeneration(e.target.value);
  };

  const handleStart = () => {
    //generation選定後才能發送post request
    if (!generation) {
      console.log("You need choose a generation before start the game.");
      return;
    } else {
      fetchData(generation);
    }
  };

  //get url of pokemon by useState
  let data;
  const fetchData = async (clientGeneration) => {
    data = { data } = await axios.post("http://localhost:8000/pokemon", {
      clientGeneration,
    });
    setUrl(data);
  };

  return (
    <div className="container py-2">
      <div className="row bg-light p-2 rounded shadow-sm">
        <div className="col-8 d-flex justify-content-center align-items-center border border-info rounded bg-success text-white fw-bold">
          <div className="score1 text-shadow-black">5</div>
          <span>&nbsp;&nbsp;</span>
          <div className="text-shadow-black">Player1</div>
          <span className="text-dark">&nbsp;VS&nbsp;</span>
          <div className="text-shadow-black">Player2</div>
          <span>&nbsp;&nbsp;</span>
          <div className="score2 text-shadow-black">9</div>
        </div>
        <div className="col-4 d-flex justify-content-center align-items-center">
          <select
            className="form-select me-2"
            aria-label="Default select example"
            defaultValue={"DEFAULT"}
            onChange={handleGeneration}
          >
            <option value="DEFAULT" disabled>
              Select a generation of Pokemon
            </option>
            <option value="1">generation-i</option>
            <option value="2">generation-ii</option>
            <option value="3">generation-iii</option>
            <option value="4">generation-iv</option>
            <option value="5">generation-v</option>
            <option value="6">generation-vi</option>
            <option value="7">generation-vii</option>
            <option value="8">generation-viii</option>
          </select>
          <button className="start btn btn-warning" onClick={handleStart}>
            Start
          </button>
        </div>
      </div>
    </div>
  );
};

export default Playercomponent;
