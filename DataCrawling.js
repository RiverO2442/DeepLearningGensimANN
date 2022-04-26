const fetch = require("node-fetch");
const fs = require("fs");
const { stringify } = require("querystring");
const { Parser } = require("json2csv");
const fields = [
  "adult",
  "backdrop_path",
  "belongs_to_collection",
  "budget",
  "genres",
  "homepage",
  "id",
  "imdb_id",
  "original_language",
  "original_title",
  "overview",
  "popularity",
  "poster_path",
  "production_companies",
  "production_countries",
  "release_date",
  "revenue",
  "runtime",
  "spoken_languages",
  "status",
  "tagline",
  "title",
  "video",
  "vote_average",
  "vote_count",
];
const GenreList = [
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
];
const opts = { fields };
const MergeJson = (json1, json2, i) => {
  var tmp1 = JSON.stringify(json1).split(""); // convert to an array
  tmp1.splice(0, 1); // remove 1 element from the array
  var tmp2 = JSON.stringify(json2).split(""); // convert to an array
  tmp1 = tmp1.join(""); // reconstruct the string
  tmp2 = tmp2.join(""); // reconstruct the string
  var tmp = "[" + tmp2 + "," + tmp1;
  return JSON.parse(tmp);
};

const FetchAndWriteByGenreId = async (id, name) => {
  var jsonData = [{}];
  //console.log(jsonData);
  var numOfPages = 1;
  var idList = [];
  var numOfIdPerGenre = 100;
  var numOfWordNeeded = 100;
  //Get a list of movie id that have more than a set number of words in its overview

  while (idList.length < numOfIdPerGenre) {
    console.clear();
    console.log("Working On " + name + "....");
    console.log(
      "Checking on Page... " +
        numOfPages +
        " Now We Have " +
        idList.length +
        "/" +
        numOfIdPerGenre +
        " ID"
    );
    await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=ce69864d6bf2d8c310737e66f4e7a4f3&with_genres=${id}&page=${numOfPages}`
    )
      .then((movies) => movies.json())
      .then(async (movies) => {
        await movies.results.forEach((movie) => {
          if (
            JSON.stringify(movie["overview"])
              .split(" ")
              .filter((word) => word !== "").length >= numOfWordNeeded
          ) {
            if (idList.length < numOfIdPerGenre) {
              idList.push(movie["id"]);
            }
          }
        });
      });
    numOfPages++;
  }
  for (let i = 0; i < idList.length; i++) {
    await fetch(
      `https://api.themoviedb.org/3/movie/${idList[i]}?api_key=ce69864d6bf2d8c310737e66f4e7a4f3`
    )
      .then((data) => data.json())
      .then(async (data) => {
        if (data) {
          data.genres = name;
          jsonData = MergeJson(jsonData, data, i);
        }
        console.clear();
        console.log("Working On " + name + "....");
        console.log(
          "Loading Data... " +
            (((i + 1) / idList.length) * 100).toFixed(1) +
            "%"
        );
      });
  }
  console.log(idList);

  //==============TO CSV
  console.clear();
  console.log("Working On " + name + "....");
  console.log("Writing To CSV FILE");
  try {
    const parser = new Parser(opts);
    const csv = parser.parse(jsonData);
    fs.writeFile(`./MovieData/${name}.csv`, csv, "utf8", function (err) {
      if (err) {
        console.log(
          "Some error occured - file either not saved or corrupted file saved."
        );
      } else {
        console.log("CSV saved!");
      }
    });
  } catch (err) {
    console.error(err);
  }
};

async function FetchAndWriteAllGenre(GenreList) {
  await Promise.all(
    GenreList.map(async (genre) => {
      const contents = await FetchAndWriteByGenreId(genre.id, genre.name);
    })
  );
}

FetchAndWriteAllGenre(GenreList);
