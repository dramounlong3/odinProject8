import React from "react";
import Playercomponent from "./Playercomponent";

const Pokemoncomponent = ({ url, setUrl, generation, setGeneration }) => {
  const handleFlip = (e) => {
    e.target.classList.toggle("cover-flip");
    e.target.nextElementSibling.classList.toggle("back-flip");
    e.target.parentElement.style.pointerEvents = "none";
    //翻盤花1秒, 等0.5秒後才關牌
    setTimeout(() => {
      e.target.classList.toggle("cover-flip");
      e.target.nextElementSibling.classList.remove("back-flip");
    }, 1500);
    //翻盤+等待+關牌 共花2.5秒
    setTimeout(() => {
      e.target.parentElement.style.pointerEvents = "visible";
    }, 2500);
  };

  return (
    <div className="container">
      <Playercomponent
        url={url}
        setUrl={setUrl}
        generation={generation}
        setGeneration={setGeneration}
      />
      <div className="d-flex flex-wrap justify-content-center align-items-center">
        {url &&
          url.data.map((x) => {
            return (
              <div className="card-container" key={x.id} onClick={handleFlip}>
                <div className="cover">Cover</div>
                <div className="back">
                  <img src={x.photo} alt="pokemon" className="shadow-sm" />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Pokemoncomponent;
