const request = require('request');
const WebSocket = require('ws');

const CFUs = require("./cfus");
const channelDiscussion = "G2DLWFK0B";
const channelTest = "C2GL041LM";

const RESPONSE_TIME = 5000;

const instructorIDs = []

let url = "https://slack.com/api/rtm.start?token=" + process.env.token;

console.log(url);

let classResponses = resetClassResponses();

request( url, function( err, response, body ){
  var websocketUrl = JSON.parse( body ).url;
  console.log(websocketUrl)
  var ws = new WebSocket(websocketUrl);
  ws.on("message", function(response){
    response = JSON.parse(response);
    if (response.text){
      tallyScores(response);
      parseMessage(response);
      console.log(classResponses);
    }
  })
});

function tallyScores(response){
  if ( /^[a-c]{1}$/.test( response.text.toLowerCase() ) ){
    classResponses[response.text.toLowerCase()] += 1;
  }
}

function getCfu(cfu){
  return CFUs.find(function(cfuObj){
    return (cfuObj.name == cfu);
  });
}

function parseMessage(response){
  let cfu = checkCFU(response.text);
  if (cfu){
    //posts question to chat (channelTest)
    console.log("getCfu return: ", getCfu(cfu) );
    let selectedCfu = getCfu(cfu);
    let message = `${selectedCfu.question}\n${selectedCfu.answers.join("\n")}`;
    sendMessage(message, channelTest);
  }
  console.log(response);
}

function checkCFU(message){
  let msgArray = message.split(" ");
  let command = msgArray.shift();
  let cfu = msgArray.join(" ");

  if (command == "cfu"){
    classResponses = resetClassResponses();
    sendResults();
    return cfu;
  } else {
    return false;
  }
}


function sendMessage(message, channel){
  //resets tally/score object
  var url = "https://slack.com/api/chat.postMessage?token=" + process.env.token + "&text=" + encodeURIComponent(message) + "&channel=" + channel;
  request(url, function(err, res, body){
    console.log("Checky's postin!: ", body);
  })
}

function resetClassResponses(){

  return {
    a: 0,
    b: 0,
    c: 0
  };
}

function sendResults(){
  // add offset time to compensate for latency
  setTimeout( function(){
    let a = classResponses.a, b = classResponses.b, c = classResponses.c;
    let message = `A: ${a}\nB: ${b}\nC: ${c}`
    sendMessage(message, channelTest);
  }, RESPONSE_TIME);
}
