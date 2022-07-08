import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fetch from "node-fetch";
import * as fs from "fs";
const { Parser } = require("json2csv");
const fields = [
  "adult",
  "backdrop_path",
  "belongs_to_collection",
  "budget",
  "genres",
  "homepage",
  "id",
  "genre",
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
  "credits",
];
const creditfields = [
  "adult",
  "gender",
  "id",
  "known_for_department",
  "name",
  "original_name",
  "popularity",
  "profile_path",
  "cast_id",
  "character",
  "credit_id",
  "order",
];
const Gender = ["Not specified", "Female", "Male"];
const personfield = [
  "adult",
  "also_known_as",
  "biography",
  "birthday",
  "deathday", //
  "gender",
  "homepage", //
  "id",
  "imdb_id", //
  "known_for_department", //
  "name",
  "place_of_birth",
  "popularity", //
  "profile_path",
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

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

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
  var numOfIdPerGenre = 1000;
  var numOfWordNeeded = 100;
  //Get a list of movie id that have more than a set number of words in its overview

  while (idList.length < numOfIdPerGenre && numOfPages <= 500) {
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
    try {
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
    } catch (err) {
      console.error(err);
    }
    numOfPages++;
  }
  for (let i = 0; i < idList.length; i++) {
    try {
      await fetch(
        `https://api.themoviedb.org/3/movie/${idList[i]}?api_key=ce69864d6bf2d8c310737e66f4e7a4f3`
      )
        .then((data) => data.json())
        .then(async (data) => {
          if (data) {
            //data.genres = name;
            data["genre"] = name;
            //console.log(data);
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
    } catch (err) {
      console.error(err);
    }
  }
  //console.log(idList);
  //==============TO CSV
  console.clear();
  console.log("Working On " + name + "....");
  console.log("Writing To CSV FILE");
  console.log(JSON.stringify(jsonData));
  try {
    const parser = new Parser(opts);
    const csv = parser.parse(jsonData);
    fs.writeFile(`./MovieData${name}.csv`, csv, "utf8", function (err) {
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
async function FetchLocalAPI() {
  try {
    await fetch(`http://localhost:5000/api/genres`)
      .then((data) => data.json())
      .then(async (data) => {
        if (data) {
          let json = JSON.stringify(data);
          fs.writeFileSync("./GenresData.json", json);
        }
      });
  } catch (err) {
    console.error(err);
  }
}
async function ReadCSV(path) {
  const csv = require("csvtojson");

  csv()
    .fromFile(path)
    .then((jsonObj) => {});

  return (jsonArray = await csv().fromFile(path));
}
async function SaveToJSON(path, jsonArray) {
  let data = JSON.stringify(jsonArray);
  fs.writeFileSync(path, data);
}
async function ReadSON(path) {
  let rawdata = fs.readFileSync(path);
  let json = JSON.parse(rawdata);
  return json;
}
async function SaveToCSV(jsonArray, path) {
  console.clear();
  console.log("Writing To CSV FILE");
  try {
    const parser = new Parser(opts);
    const csv = parser.parse(jsonArray);
    fs.writeFile(`${path}.csv`, csv, "utf8", function (err) {
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
}
const FetchVideo = async (idList) => {
  var jsonData = [{}];
  for (let i = 0; i < idList.length; i++) {
    try {
      await fetch(
        `https://api.themoviedb.org/3/movie/${idList[i]["id"]}/videos?api_key=ce69864d6bf2d8c310737e66f4e7a4f3`
      )
        .then((data) => data.json())
        .then(async (data) => {
          if (data) {
            jsonData = MergeJson(jsonData, data, i);
          }
          console.clear();
          console.log(
            "Loading Data... " +
              (((i + 1) / idList.length) * 100).toFixed(1) +
              "%"
          );
        });
    } catch (err) {
      console.error(err);
    }
  }
  return jsonData;
};
const FetchMoviesNCredits = async (idList) => {
  var jsonData = [{}];
  for (let i = 0; i < idList.length; i++) {
    try {
      await fetch(
        `https://api.themoviedb.org/3/movie/${idList[i]}?api_key=ce69864d6bf2d8c310737e66f4e7a4f3&append_to_response=credits`
      )
        .then((data) => data.json())
        .then(async (data) => {
          if (data) {
            jsonData = MergeJson(jsonData, data, i);
          }
          console.clear();
          console.log(
            "Loading Data... " +
              (((i + 1) / idList.length) * 100).toFixed(1) +
              "%" +
              ` of ${idList.length} item`
          );
        });
    } catch (err) {
      console.error(err);
    }
  }
  return jsonData;
};
const FetchPerson = async (idList, type) => {
  var jsonData = [{}];
  for (let i = 0; i < idList.length; i++) {
    try {
      await fetch(
        `https://api.themoviedb.org/3/person/${idList[i]["Id"]}?api_key=ce69864d6bf2d8c310737e66f4e7a4f3&language=en-US`
      )
        .then((data) => data.json())
        .then(async (data) => {
          if (data) {
            jsonData = MergeJson(jsonData, data, i);
          }
          console.clear();
          console.log("Working On " + idList[i]["Id"] + "....");
          console.log(
            "Loading Data... " +
              (((i + 1) / idList.length) * 100).toFixed(1) +
              "%"
          );
        });
    } catch (err) {
      console.error(err);
    }
  }
  return jsonData;
};
const FetchIdByYearAndGenre = async (
  year,
  id,
  name,
  DataList,
  NumPerGenre,
  MaxPerGenre
) => {
  var numOfPages = 1;
  var idList = [];
  var numOfWordNeeded = 20;
  //Get a list of movie id that have more than a set number of words in its overview
  while (
    idList.length < 100 &&
    NumPerGenre <= MaxPerGenre &&
    numOfPages <= 500
  ) {
    console.clear();
    console.log("Working On " + year + "...." + name);
    console.log(
      "Checking on Page... " +
        numOfPages +
        " Now We Have " +
        idList.length +
        " ID"
    );
    try {
      await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=ce69864d6bf2d8c310737e66f4e7a4f3&language=en-US&sort_by=popularity.desc&page=${numOfPages}&primary_release_date.lte=${year}&with_genres=${id}`
      )
        .then((movies) => movies.json())
        .then((movies) => {
          movies.results.forEach((movie) => {
            if (
              idList.length < 100 &&
              !DataList.includes(movie["id"]) &&
              JSON.stringify(movie["overview"])
                .split(" ")
                .filter((word) => word !== "").length >= numOfWordNeeded &&
              NumPerGenre <= 100
            ) {
              DataList.push(movie["id"]);
              idList.push(movie["id"]);
              NumPerGenre++;
            }
          });
        });
    } catch (err) {
      console.error(err);
    }
    numOfPages++;
  }
  return DataList;
};
async function FetchAndWriteAllGenre(GenreList) {
  for (let i = 0; i < GenreList.length; i++) {
    let DataList = [];
    let MaxPerGenre = 100;
    let NumPerGenre = 0;
    for (let y = 2018; y <= 2020; y++) {
      DataList = await FetchIdByYearAndGenre(
        y,
        GenreList[i]["id"],
        GenreList[i]["name"],
        DataList,
        NumPerGenre,
        MaxPerGenre
      );
      if (NumPerGenre >= MaxPerGenre) break;
    }
    if (NumPerGenre >= MaxPerGenre) {
      i++;
      NumPerGenre = 0;
    }
    const rs = await FetchMoviesNCredits(DataList);
    console.log(rs);
    SaveToCSV(rs, `./MovieData${GenreList[i]["name"]}`);
  }
}
function dataTranform(genresData, tranformPath) {
  tranform = ReadSON(tranformPath);
  ListData.forEach((data) => {
    data = tranform[String(data).toLowerCase()];
  });
  return ListData;
}
function CleanData() {
  let rawdata = fs.readFileSync("./OfficalMovieListRealAllGenres.json");
  let student = JSON.parse(rawdata);

  student.forEach((movie, index) => {
    if (
      movie["actorsBelongTo"] == "" ||
      movie["directorsBelongTo"] == "" ||
      movie["img"] == ""
    )
      delete student[index];
  });
  console.log("Done Cleaning");
  let data = JSON.stringify(student);
  fs.writeFileSync("./OfficalMovieListRealAllGenres2.json", data);
}
function FetchTrailerLink() {
  student1.forEach((json, index) => {
    let Trailer = student.find((el) => el.id == student1[index]["TMDBid"]);
    if (Trailer)
      try {
        student1[index]["trailer"] = `https://www.youtube.com/watch?v=${
          JSON.parse(Trailer.results.replace("]", "").replace("[", ""))["key"]
        }`;
      } catch {
        if (Trailer.results.length > 10) {
          let result = JSON.parse(Trailer.results).find(
            (el) => el["type"] == "Trailer"
          );
          if (result)
            student1[index][
              "trailer"
            ] = `https://www.youtube.com/watch?v=${result["key"]}`;
        }
      }
  });
}
function FetchGenres(todo) {
  try {
    return fetch("https://rivero-d2v-api.herokuapp.com/predict", {
      method: "POST",
      body: JSON.stringify({ overview: todo }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((json) => {
        try {
          return json.genres.replace(/[^A-Za-z,]/g, "").split(",");
        } catch {
          return [""];
        }
      });
  } catch {
    return [""];
  }
}
function CreateMovie(todo) {
  let rawdata = fs.readFileSync("./OfficalMovieListRealAllGenres2.json");
  let student = JSON.parse(rawdata);

  student.forEach(async (movie) => {
    try {
      await fetch("http://localhost:5000/api/movies", {
        method: "POST",
        body: JSON.stringify({
          title: movie["title"],
          desc: movie["desc"],
          img: movie["img"],
          imgSmall: movie["imgSmall"],
          trailer: movie["trailer"],
          year: movie["year"],
          limitAge: movie["limitAge"],
          duration: movie["duration"],
          allGenres: movie["allGenres"],
          actors: movie["actorsBelongTo"],
          directors: movie["directorsBelongTo"],
          TMDBid: movie["TMDBid"],
        }),
        headers: { "Content-Type": "application/json" },
      }).then((res) => console.log(res.json().status));
    } catch {
      console.log("error");
    }
  });
}
async function FetchGenres2(todo) {
  for (let i = 0; i < student.length; i++) {
    console.clear();
    console.log(`Working On ${i} of ${student.length}`);
    const rs = await FetchGenres(student[i].desc);
    student[i].allGenres = rs;
    let data = JSON.stringify(student);
    fs.writeFileSync("./OfficalMovieListReal.json", data);
  }
}
async function FetchYear() {
  for (let i = 0; i < student.length; i++) {
    if (student[i]["TMDBid"] == jsonArray[i]["TMDBid"])
      student[i].year = jsonArray[i]["year"].split("-")[0];
    let data = JSON.stringify(student);
    fs.writeFileSync("./OfficalMovieListReal1.json", data);
  }
}
function FetchAge(todo) {
  try {
    return fetch(
      `https://api.themoviedb.org/3/movie/${todo["TMDBid"]}/release_dates?api_key=ce69864d6bf2d8c310737e66f4e7a4f3`
    )
      .then((res) => res.json())
      .then((json) => {
        try {
          return json["results"][0]["release_dates"][0]["certification"];
        } catch {
          return 0;
        }
      });
  } catch {
    return 0;
  }
}
async function FetchAge2(todo) {
  for (let i = 0; i < student.length; i++) {
    console.log(`Working On ${i} of ${student.length}`);
    let rs = await FetchAge(student[i]);
    rs = rs.replace(/[^0-9]/g, "");
    if (rs == "") rs = 0;
    student[i]["limitAge"] = rs;
    console.log(`${rs}`);
    let data = JSON.stringify(student);
    fs.writeFileSync("./OfficalMovieListReal2.json", data);
  }
}
async function DoSthing() {
  let rawdata1 = fs.readFileSync("./DirectorsData.json");
  let directors = JSON.parse(rawdata1);
  let rawdata2 = fs.readFileSync("./ActorsData.json");
  let actors = JSON.parse(rawdata2);
  let rawdata = fs.readFileSync("./MoviesData.json");
  let movies = JSON.parse(rawdata);
  let rawdata3 = fs.readFileSync("./MovieList.json");
  let list = JSON.parse(rawdata3);

  movies.forEach((movie, index) => {
    movie["directorsBelongTo"].forEach((actor) => {
      directors.forEach((item) => {
        if (item["_id"] == actor) item["knownFor"].push(movie["_id"]);
      });
    });
  });

  console.log("Done, Importing");
  let data = JSON.stringify(directors);
  fs.writeFileSync("./DirectorTest.json", data);
}

///////////////
/////////////// CLEAN DATA
// student.forEach((json) => delete json["deathday"]);
// student.forEach((json) => delete json["adult"]);
// student.forEach((json) => delete json["popularity"]);
// student.forEach((json) => delete json["known_for_department"]);
// student.forEach((json) => delete json["homepage"]);
// student.forEach((json) => delete json["also_known_as"]);
// student.forEach((json) => delete json["imdb_id"]);
// student.forEach((json) => {
//   json["gender"] >= 0 &&
//     json["gender"] <= 2 &&
//     (json["gender"] = Gender[json["gender"]]);
// });
// student.forEach((json) => (json["tmdbID"] = json["id"]));
// student.forEach((json) => delete json["id"]);
// student.forEach(
//   (json) =>
//     (json[
//       "image"
//     ] = `https://image.tmdb.org/t/p/original/${json["profile_path"]}`)
// );
// student.forEach((json) => delete json["profile_path"]);
// student.forEach(
//   (json) =>
//     (json.biography = json.biography
//       .replace(`From Wikipedia, the free encyclopedia.\s\n`, " ")
//       .replace(`From Wikipedia, the free encyclopedia.\n`, " ")
//       .replace(`\n`, " "))
// );
// student.forEach(
//   (json, index) =>
//     (json.biography = json.biography
//       .replace(`Description above from the Wikipedia article ${json.name}`, " ")
//       .replace(
//         `licensed under CC-BY-SA, full list of contributors on Wikipedia`,
//         " "
//       ))
// );
// student.forEach((json, index) => {
//   if (json.success == "false") {
//     student.splice(index, 1);
//   }
// });
///////////////
///////////////
///////////////
