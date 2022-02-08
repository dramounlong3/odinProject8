import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../services/socket.service";
import Navcomponent from "./Navcomponent";
import Swal from "sweetalert2";
import axios from "axios";

const Pokedexcomponent = ({
  roomNum,
  setRoomNum,
  currentUser,
  setCurrentUser,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState("d-block");
  //避免controller變數放到useEffect dependecies內會造成每次render複渲染
  const controller = useMemo(() => {
    const reqController = new AbortController();
    return reqController;
  }, []);

  const fetchPokedex = useCallback((e, controller) => {
    const colors = {
      fire: "#FB6C6C",
      grass: "#48D0B0",
      electric: "#FFD86F",
      water: "#609FB5",
      ground: "#B1736C",
      rock: "#a6aab6",
      fairy: "#f469a9",
      poison: "#BAB0D5", //"#7C538C",
      bug: "#C3CE75",
      dragon: "#F9BE00",
      psychic: "#9B7FA6",
      flying: "#98d7a5", //"#BAB0D5",
      ghost: "#735797",
      dark: "#797171",
      steel: "#CCCCDE",
      fighting: "#d6b591",
      ice: "#7FCCEC",
      normal: "#C2C2A1",
    };

    const main_types = Object.keys(colors);

    let poke_container;

    const genList = [
      { generation: 1, quantities: 151, offset: 0 },
      { generation: 2, quantities: 100, offset: 151 },
      { generation: 3, quantities: 135, offset: 251 },
      { generation: 4, quantities: 107, offset: 386 },
      { generation: 5, quantities: 156, offset: 493 },
      { generation: 6, quantities: 72, offset: 649 },
      { generation: 7, quantities: 88, offset: 721 },
      { generation: 8, quantities: 89, offset: 809 },
    ];

    function fetchPokedexing(e, controller) {
      setLoading("d-block");
      const dataGen = document.querySelectorAll("button[data-gen]");

      dataGen.forEach((button) => {
        button.style.opacity = 0.5;
        button.disabled = true;
      });

      poke_container = document.querySelector("#poke_container");
      let gen;
      if (e.target !== undefined) {
        gen = e.target.getAttribute("data-gen");
        while (poke_container.firstChild) {
          poke_container.removeChild(poke_container.firstChild);
        }
      } else {
        gen = 0;
        while (poke_container.firstChild) {
          poke_container.removeChild(poke_container.firstChild);
        }
      }

      const fetchPokemons = async (gen, controller) => {
        let pokemonPromise = [];
        let pokemonInfo = [];

        try {
          let group = await fetch(
            `https://pokeapi.co/api/v2/pokemon?limit=${genList[gen].quantities}&offset=${genList[gen].offset}`,
            { signal: controller.signal }
          );
          let groupJson = await group.json();
          //results為每一隻寶可夢的url
          let groupInfo = groupJson.results;

          //使用forEach全部一起fetch, 並裝到陣列內(裡面會得到promise=> 因為下面的promise.all)
          groupInfo.forEach((x) => {
            pokemonPromise.push(fetch(x.url, { signal: controller.signal }));
          });

          //透過await Promise.all，會使該變數全部接收完promise才繼續往下執行
          //此段搜尋寶可夢的id和png
          await Promise.all(pokemonPromise)
            .then(async (response) => {
              //使用forEach無法await，故改採for loop await裡面的項目
              for (let i = 0; i < response.length; i++) {
                await response[i].text().then((t) => {
                  //因t為字串格式的json,需再採用JSON.parse解析為JSON格式
                  let pokemonJSON = JSON.parse(t);
                  let tempJson = {
                    id: pokemonJSON.id,
                    types: pokemonJSON.types,
                    name: pokemonJSON.name,
                    hp: pokemonJSON.stats[0].stat.name,
                    hpValue: pokemonJSON.stats[0].base_stat,
                    attack: pokemonJSON.stats[1].stat.name,
                    attackValue: pokemonJSON.stats[1].base_stat,
                    defense: pokemonJSON.stats[2].stat.name,
                    defenseValue: pokemonJSON.stats[2].base_stat,
                  };
                  pokemonInfo.push(tempJson);
                });
              }

              //經測試後, 即使上方fetch被中斷, 此處仍然會呼叫function create element, 故改以signal在false時才能執行
              //最後整理時發現，其實是迴圈在執行的fetch忘記+第二個參數signal，才會有上面的問題，增加後此處不需要用aborted額外判斷
              //if (!controller.signal.aborted) {
              createPokemonCard(pokemonInfo);
              //}
            })
            .catch(function handleError(error) {
              console.log(error);
            });

          dataGen.forEach((button) => {
            button.style.opacity = 1;
            button.disabled = false;
          });

          if (e.target !== undefined) {
            e.target.disabled = true;
            e.target.style.opacity = 0.5;
          } else {
            dataGen[0].disabled = true;
            dataGen[0].style.opacity = 0.5;
          }
        } catch (e) {
          console.log(e);
        }

        function createPokemonCard([...pokemonInfo]) {
          setLoading("d-none");
          pokemonInfo.forEach((pokemon) => {
            const pokemonEl = document.createElement("div");
            pokemonEl.classList.add("pokemon");
            const poke_types = pokemon.types.map((type) => type.type.name);
            const type = main_types.find(
              (type) => poke_types.indexOf(type) > -1
            );
            const name = pokemon.name[0].toUpperCase() + pokemon.name.slice(1);
            const color = colors[type];
            pokemonEl.style.backgroundColor = color;

            /*增加血量、攻擊、防禦屬性值*/
            const hp = pokemon.hp[0].toUpperCase() + pokemon.hp.slice(1);
            const hpValue = pokemon.hpValue;
            const attack =
              pokemon.attack[0].toUpperCase() + pokemon.attack.slice(1);
            const attackValue = pokemon.attackValue;
            const defense =
              pokemon.defense[0].toUpperCase() + pokemon.defense.slice(1);
            const defenseValue = pokemon.defenseValue;

            const pokeInnerHTML = `
                <span class="number">#${pokemon.id.toString().padStart(3, "0")}
                </span>
                <div class="img-container">
                    <img class="pokedexImg" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${
                      pokemon.id
                    }.png" alt="${name}" />
                </div>
                <div class="info">
                    <h5 class="name fw-bold">${name}</h5>
                    <small class="type">Type: <span>${type}</span></small>
                </div>

                <div class="stats" style="background-color:${color}">
                <h2>Stats</h2>
                <div class="stats-box">
                  <ul class="fw-bold me-3">
                    <li>${hp}</li>
                    <li>${attack}</li>
                    <li>${defense}</li>
                  </ul>
                  <ul>
                    <li>${hpValue}</li>
                    <li>${attackValue}</li>
                    <li>${defenseValue}</li>
                  </ul>
                </div>
              </div>
            `;

            pokemonEl.innerHTML = pokeInnerHTML;
            poke_container.appendChild(pokemonEl);
          });
        }
      };
      fetchPokemons(gen, controller);
    }
    fetchPokedexing(e, controller);
  }, []);

  useEffect(() => {
    //避免p1發送emit過來會造成socket又被開啟
    socket.close();
    socket.disconnect();

    const displayPokedex = async () => {
      let token;
      if (localStorage.getItem("user")) {
        token = JSON.parse(localStorage.getItem("user")).token;
      } else {
        token = "";
      }

      let authResult;
      try {
        //若此處用currentUser來判斷，會造成登出時, currentUser被改為空，導致跳轉到登入頁面時因為此處有dependencise currentUser，造成在登入頁面時又跳出此swal
        //驗證jwt, 此處未採用authService內提供的驗證方法, 因為若於此處關閉useAuthenticate, 會造成跳回去game component也會是關閉的狀態, 造成未登入的錯誤狀況
        authResult = await axios.get(
          "http://localhost:8000/game/authenticated",
          {
            headers: { Authorization: token },
            signal: controller.signal,
          }
        );
      } catch (e) {
        console.log(e);
      }

      if (authResult) {
        fetchPokedex(1, controller);
      } else {
        const handleRedirect = async () => {
          await Swal.fire({
            title: "Oh! no...",
            text: "You must login first.",
          });
          navigate("/login");
        };

        handleRedirect();
      }
    };
    displayPokedex();
    return () => {
      //當pokedex component卸載時, 終止async請求
      controller.abort();
      socket.connect();
    };
  }, [fetchPokedex, controller, navigate]);

  return (
    <div>
      <Navcomponent
        roomNum={roomNum}
        setRoomNum={setRoomNum}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />

      {currentUser && (
        <div className="pokedexContainer">
          <div className="d-flex justify-content-center align-items-center">
            <div className="input-group my-3 d-flex justify-content-center">
              <button
                data-gen="0"
                className="btn btn-outline-secondary bg-light text-dark text-shadow-black gen-shadow border"
                type="button"
                onClick={(e) => {
                  fetchPokedex(e, controller);
                }}
              >
                Gen1
              </button>
              <button
                data-gen="1"
                className="btn btn-outline-secondary bg-light text-dark text-shadow-black gen-shadow border"
                type="button"
                onClick={(e) => {
                  fetchPokedex(e, controller);
                }}
              >
                Gen2
              </button>
              <button
                data-gen="2"
                className="btn btn-outline-secondary bg-light text-dark text-shadow-black gen-shadow border"
                type="button"
                onClick={(e) => {
                  fetchPokedex(e, controller);
                }}
              >
                Gen3
              </button>
              <button
                data-gen="3"
                className="btn btn-outline-secondary bg-light text-dark text-shadow-black gen-shadow border"
                type="button"
                onClick={(e) => {
                  fetchPokedex(e, controller);
                }}
              >
                Gen4
              </button>
              <button
                data-gen="4"
                className="btn btn-outline-secondary bg-light text-dark text-shadow-black gen-shadow border"
                type="button"
                onClick={(e) => {
                  fetchPokedex(e, controller);
                }}
              >
                Gen5
              </button>
              <button
                data-gen="5"
                className="btn btn-outline-secondary bg-light text-dark text-shadow-black gen-shadow border"
                type="button"
                onClick={(e) => {
                  fetchPokedex(e, controller);
                }}
              >
                Gen6
              </button>
              <button
                data-gen="6"
                className="btn btn-outline-secondary bg-light text-dark text-shadow-black gen-shadow border"
                type="button"
                onClick={(e) => {
                  fetchPokedex(e, controller);
                }}
              >
                Gen7
              </button>
              <button
                data-gen="7"
                className="btn btn-outline-secondary bg-light text-dark text-shadow-black gen-shadow border"
                type="button"
                onClick={(e) => {
                  fetchPokedex(e, controller);
                }}
              >
                Gen8
              </button>
            </div>
          </div>
          {loading && (
            <div
              className={`loadingHeight d-flex justify-content-center align-items-center ${loading}`}
            >
              <div className="spinner-border text-dark" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          <div id="poke_container" className="container poke-container"></div>
          <div
            className="my-4 text-drak text-decoration-underline text-center cursor-pointer backToTop"
            onClick={() => window.scrollTo(0, 0)}
          >
            Back
          </div>
        </div>
      )}
    </div>
  );
};
export default Pokedexcomponent;
