// import Pokedex from "pokeapi-js-wrapper";
// const P = new Pokedex.Pokedex();

// const idUrl = "https://pokeapi.co/api/v2/pokemon/";
// const limitUrl = "https://pokeapi.co/api/v2/pokemon?limit=";

//此demo測試如何先同時fetch發送request取得寶可夢資訊，但等全部資料都回傳後才執行後續的程式碼
//如果不先同時發送fetch, 每次發送都要等到接到資訊才繼續下一次的request, 會非常久
//解法參考此篇文章, https://nicolakacha.coderbridge.io/2020/09/11/sync-async/   段落: ReadableStream
import fetch from "node-fetch";

const getPokemon = async (limit, offset) => {
  let pokemonPromise = [];
  let pokemonPromise2 = [];
  let pokemonInfo = [];
  // let limit = 10;
  // let offset = 0;

  //先fetch所有的寶可夢by limit數量和offset位移
  let group = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
  );
  let groupJson = await group.json();
  //results為每一隻寶可夢的url
  let groupInfo = groupJson.results;

  //使用forEach全部一起fetch, 並裝到陣列內(裡面會得到promise=> 因為下面的promise.all)
  groupInfo.forEach((x) => {
    pokemonPromise.push(fetch(x.url));
  });

  //透過await Promise.all，會使該變數全部接收完promise才繼續往下執行
  //此段搜尋寶可夢的id和png
  await Promise.all(pokemonPromise)
    .then(async (response) => {
      //使用forEach無法await，故改採for loop await裡面的項目
      for (let i = 0; i < response.length; i++) {
        //response上面fetch後的promise陣列，需透過.text().then()繼續解析promise獲取回傳的值
        await response[i].text().then((t) => {
          //因t為字串格式的json,需再採用JSON.parse解析為JSON格式
          let pokemonJSON = JSON.parse(t);
          pokemonInfo.push({
            id: pokemonJSON.id,
            photo: pokemonJSON.sprites.front_default,
          });
        });
      }
    })
    .catch(function handleError(error) {
      console.log(error);
    });

  //於上面取得的id後, 再根據id取得desc放入pokemonInfo.desc
  pokemonInfo.forEach((x) => {
    pokemonPromise2.push(
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${x.id}`)
    );
  });

  //等desc所有promise取得後, 存於pokemonInfo.desc
  await Promise.all(pokemonPromise2)
    .then(async (response) => {
      for (let i = offset; i < limit; i++) {
        await response[i].text().then((t) => {
          let descriptionJSON = JSON.parse(t);
          //因為flavor_text_entries[0]有遇到部分是中文, 故改[1]
          pokemonInfo[i].desc =
            descriptionJSON.flavor_text_entries[1].flavor_text.replace(
              /\r\n|\n/g,
              " "
            );
        });
      }
    })
    .catch(function handleError(error) {
      console.log(error);
    });

  //console.log(pokemonInfo);
  return pokemonInfo;
};

//因為必須包在async內才能使用await
// (async () => {
//   let pokemon = await handlePokemon();
//   console.log(pokemon);
// })();

export { getPokemon };
