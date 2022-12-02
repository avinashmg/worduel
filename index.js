const WebSocketServer = require("ws").WebSocketServer;
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

//READ THE WORDLIST INTO AN ARRAY
let words = [];
let word = "";

fs.readFile("words.txt", "utf8", function (err, data) {
  words = data.split("\n");
  console.log(words.length);
  word = randomWord();
  console.log(word);
});

function randomWord() {
  let random = Math.floor(Math.random() * (words.length + 1));
  return words[random].toUpperCase();
}

const wss = new WebSocketServer({ port: 58000 });
const connections = {};
const scoreboard = {};

//Broadcast messages
function broadcast(message) {
  for (const key in connections) {
    connections[key].send(JSON.stringify(message));
  }
}
//End of broadcast messages
wss.on("connection", function connection(ws) {
  const id = uuidv4();
  connections[id] = ws;
  ws.send(
    JSON.stringify({ type: "online", online: Object.keys(connections).length })
  );
  console.log("Connections: ", Object.keys(connections).length);
  ws.on("close", function close() {
    delete connections[id];
    console.log("Connections: ", Object.keys(connections).length);
  });

  ws.on("message", function message(data) {
    console.log(JSON.parse(data));
    let r_word = JSON.parse(data).word;
    let nickname = JSON.parse(data).nickname;
    let line_score = 0;
    let response = ["x", "x", "x", "x", "x"];
    for (let i = 0; i < 5; i++) {
      if (r_word[i] === word[i]) {
        response[i] = "g";
        line_score++;
      } else {
        if (word.indexOf(r_word[i]) !== -1) {
          response[i] = "y";
        }
      }
    }
    if (line_score === 5) {
      if (scoreboard[nickname] == null) {
        scoreboard[nickname] = Object.keys(connections).length + 10;
      } else {
        scoreboard[nickname] += Object.keys(connections).length + 10;
        console.log(scoreboard);
      }
      ws.send(JSON.stringify({ type: "score", score: scoreboard[nickname] }));
      broadcast({ type: "broadcast", winner: nickname, solution: word });
      word = randomWord();
    } else {
      if (scoreboard[nickname] == null) {
        scoreboard[nickname] = 0;
      } else {
        scoreboard[nickname] -= 1;
        console.log(scoreboard);
      }
    }
    ws.send(JSON.stringify(response));
    ws.send(
      JSON.stringify({
        type: "online",
        online: Object.keys(connections).length,
      })
    );
  });
});
