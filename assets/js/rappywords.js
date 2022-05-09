/*Rappy Words Beta
*  author = Amon Millner
*  contributors = The Hip Hop Transformation Project Teens, STEMcees researchers
*  date: 2021-06-16
*  version: 0.4
*
*  overview: Rappy Words is a rough beta web app of a game to be played with friends
*  where having fun with rhyming and gaining or flexing knowledge about Hip-Hop
*  artists will keep you playing
*
*/


//Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyCdVv8A9tLTrYwYsPTtNqD6j5K03ZgFE6Y",
  authDomain: "rappy-words.firebaseapp.com",
  projectId: "rappy-words",
  storageBucket: "rappy-words.appspot.com",
  messagingSenderId: "560718976930",
  appId: "1:560718976930:web:8753abc30f37270e1204fb",
  measurementId: "G-J0X9LS8NKG"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const dbRef = firebase.database().ref();
const songsRef = dbRef.child('songs');
//Legacy library of words keeping track of wordbank suggested by THHT teens
var wordBank = {
  "easyWords" : ["dog", "bars", "pen", "snack", "choose", "hat", "pear", "move", "dumb", "door", "chomp", "crazy", "school", "chop", "whack", "day", "bite", "rain", "bent", "ma"],
  "mediumWords" : ["women", "mountain", "proof", "creation", "visible", "evolution", "herbal", "ratchet", "stinky", "bullet", "cornbread", "sauce", "nibble", "glamour", "candle", "center", "teeth", "stretch", "layer", "acid"],
  "hardWords" : ["dinosaur", "orange", "immaculate", "onomatopoeia", "purple", "month", "rational", "poetry", "traction", "scientific", "vacuum", "tragedy", "paralysis", "skeptical", "measure", "anthropologist", "memory", "software", "surprise", "secret"],
  "addedEasyWords" : [""],
  "addedMediumWords" : [""],
  "addedHardWords" : [""]
};
//legacy list of song/artist pairs suggested initially by THHT teens
var triviaBank = [
  ["Jesus Walks", "Kanye West"], ["Gold Digger", "Kanye West"],
  ["Good Life", "Kanye West"],["Stronger", "Kanye West"],["Straightenin", "Migos"],
  ["Walk It Talk It", "Migos"],["Narcos", "Migos"],["Stir Fry", "Migos"],
  ["Go Crazy", "Young Thug"], ["Ski", "Young Thug"], ["Solid", "Young Thug"],
  ["The London", "Young Thug"], ["One Way Flight","Benny The Butcher"],
  ["Plug Talk", "Benny The Butcher"], ["Crowns for Kings", "Benny The Butcher"],
  ["Overall", "Benny The Butcher"],  ["Finer Things", "Polo G"],  ["Riding With it", "G Herbo"],
  ["Faneto", "Chief Keef"],  ["Movie", "Sleepy Hallow"], ["Flows", "Sheff G"],  ["Top 5", "Bizzy Banks"],
  ["Zayski", "Vory"], ["Dope House", "Dave East"],["Welcome to the Party", "Pop Smoke"], ["No Parties", "Coi Leray"]
];
//global variables to track game and player states
var nameCharacterLimit = 15;
var gameState = {};
var teamAObject = {};
var teamBObject = {};
//labels for the places we'll modify the words that show up in the game page
const currentPlayerTurn = () => `It's ${gameState.currentTeamNames[gameState.currentPlayer]}'s turn`;
const turnDisplay = document.querySelector('.turn--status');
const statusDisplay = document.querySelector('.game--status');
const rhymePromptDisplay = document.querySelector('.rhyme--prompt');
const wordToRhymeDisplay = document.querySelector('.word--to--rhyme');
const countdownDisplay = document.querySelector('.countdown');
const scoringDisplay = document.querySelector('.scoring--feedback');


//the setup and reset function to purge old data and get variables their initial values
function handleStartNewGame() {
    document.getElementById("team--A--pic").src="images/overlay.png";
    document.getElementById("team--B--pic").src="images/overlay.png";
    teamAObject = {
      "roundDifficulty" : [],
      "totalScore" : 0
    };
    teamBObject = {
      "roundDifficulty" : [],
      "totalScore" : 0
      };
    gameState = {
      "roundTime" : (document.getElementById("round--time").value * 1000),
      "countdownTimer" : 0,
      "currentPlayer" : "A",
      "currentTeamNames" : {"A" : document.getElementById("this--team").value.substring(0, nameCharacterLimit), "B" : document.getElementById("that--team").value.substring(0, nameCharacterLimit)},
      "currentWord" : "",
      "usedWords" : [""],
      "currentTriviaAnswer" : "",
      "currentTriviaOptions" : "",
      "streakCount" : 0
    };
    document.getElementById("team--A--score").value = "";
    document.getElementById("team--B--score").value = "";
    document.getElementById("overwrite--score").value = "";
    enableGetButtons();
    disablePlayerTurnButtons();
    //use random to determine which player goes first
    var coinFlip = Math.random();
    if (coinFlip < .5) {
      gameState.currentPlayer = "A";
    }
    else {
      gameState.currentPlayer = "B";
    }
    turnDisplay.innerHTML = currentPlayerTurn();
    scoringDisplay.innerHTML = "";
    //moves a microphone icon to signal to players that the next team's turn is up
    document.getElementById("team--" + gameState.currentPlayer + "--pic").src="images/mic-in-hand.png";
}


//toggles buttons that allow players to choose the type of round to PLAY
function enableGetButtons(){
  questionAskButton.disabled = false;
  easyButton.disabled = false;
  mediumButton.disabled = false;
  hardButton.disabled = false;
}


function disableGetButtons(){
  questionAskButton.disabled = true;
  easyButton.disabled = true;
  mediumButton.disabled = true;
  hardButton.disabled = true;
}


//disables buttons used to respond during a turn when not actively needed
function disablePlayerTurnButtons(){
  countRhymeButton.disabled = true;
  passButton.disabled = true;
  questionSubmitButton.disabled = true;
}


//puts the word to rhyme on the screen appropriate for the difficulty selected
function getWords(whichWords) {
  disableGetButtons();
  countRhymeButton.disabled = false;
  passButton.disabled = false;
  //questionSubmitButton.disabled = true;
  gameState.currentWord = "";
  rhymePromptDisplay.innerHTML = "the word to rhyme is: ";
  //set up variables to make sure words will be found that haven't been used
  var loopCounter = 0;
  var originalWordFound = false;
  //selects which library of words to use based on user selection in the customization area
  while (originalWordFound == false) {
    if (document.getElementById("use--builtins").checked) {
      gameState.currentWord = wordBank[whichWords][Math.floor(Math.random() * wordBank[whichWords].length)];
    }
    else if (document.getElementById("include--added--words").checked) {
      wordBank["added"+whichWords] = document.getElementById(whichWords+"--to--add").value.split(",");
      var builtInAndAdded = [...wordBank[whichWords], ...wordBank["added"+whichWords]];
      gameState.currentWord = builtInAndAdded[Math.floor(Math.random() * builtInAndAdded.length)];
    }
    else if (document.getElementById("added--words--only").checked) {
      wordBank["added"+whichWords] = document.getElementById(whichWords+"--to--add").value.split(",");
      gameState.currentWord = wordBank["added"+whichWords][Math.floor(Math.random() * wordBank["added"+whichWords].length)];
    }
    if (gameState.usedWords.includes(gameState.currentWord)) {
      loopCounter += 1;//keep looping for a new word
      if (loopCounter > 100) {
        statusDisplay.innerHTML = "sorry we have an issue";
        break; // uses an arbitrary number to stop loops from running on infinitely
      }
    }
    else {
      originalWordFound = true; //exit the loop because the word is original
    }
  } //while
  //determines the current player to record the difficulty level of a round appropriately
  var teamGettingWord = "team"+gameState.currentPlayer+"Object";
  if (whichWords === "easyWords") {
    window[teamGettingWord].roundDifficulty.push(1);
  } else if (whichWords === "mediumWords") {
    window[teamGettingWord].roundDifficulty.push(2);
  } else if (whichWords === "hardWords") {
    window[teamGettingWord].roundDifficulty.push(3);
  }
  //presents the word to rhyme for a round to a player
  wordToRhymeDisplay.innerHTML = gameState.currentWord;
  gameState.usedWords.push(gameState.currentWord); //remembers words played to avoid repeats
  //sets up timing for a round to display to a player, upon ending call for the next player
  gameState.countdownTimer = parseInt(gameState.roundTime) / 1000;
  var gameTimer = setInterval(function() {
    if(parseInt(gameState.countdownTimer) == 1) {
      clearInterval(gameTimer);
    }
    gameState.countdownTimer = parseInt(gameState.countdownTimer) - 1;
    countdownDisplay.innerHTML = gameState.countdownTimer;
  }, 1000);
  setTimeout(handlePlayerChange, gameState.roundTime);
  }


//adds points to teams object and displays as teams play
function handleRhymeScoreUpdate() {
  var activeTeamName = "team"+gameState.currentPlayer+"Object";
  window[activeTeamName].totalScore = parseInt(window[activeTeamName].totalScore + window[activeTeamName].roundDifficulty[window[activeTeamName].roundDifficulty.length-1]);
  document.getElementById("team--"+gameState.currentPlayer+"--score").value = window[activeTeamName].totalScore;
  scoringDisplay.innerHTML = "points given for last rhyme";
}


//alerts players that passing on a rhyme turn cost them a streak point
function handleRhymePass() {
  gameState.streakCount = 0;
  scoringDisplay.innerHTML = "no points for last pass, streak broken";
}


//runs after each turn to make sure that the game state will record for the appropriate team
function handlePlayerChange() {
  disablePlayerTurnButtons();
  enableGetButtons();
  document.getElementById("overwrite--score").value = 0;
  statusDisplay.innerHTML = "";
  scoringDisplay.innerHTML = "";
  //keeps referring to teams how they want to be called throughout the game
  gameState.currentTeamNames["A"] = document.getElementById("this--team").value.substring(0, nameCharacterLimit);
  gameState.currentTeamNames["B"] = document.getElementById("that--team").value.substring(0, nameCharacterLimit);
  var activeTeamName = "team"+gameState.currentPlayer+"Object";
  //sets a streak to be 2 or more rhymes with no pass or correctly answered trivia questions
  if (gameState.streakCount >= 2){
    scoringDisplay.innerHTML = "good job! points added for keeping a streak";
    window[activeTeamName].totalScore = parseInt(window[activeTeamName].totalScore) + parseInt(window[activeTeamName].roundDifficulty[window[activeTeamName].roundDifficulty.length-1]);
    document.getElementById("team--"+gameState.currentPlayer+"--score").value = window[activeTeamName].totalScore;
  }
  //clears and flips data for next player's turn
  gameState.streakCount = 0;
  document.getElementById("team--" + gameState.currentPlayer + "--pic").src="images/overlay.png";
  gameState.currentPlayer = gameState.currentPlayer === "A" ? "B" : "A";
  document.getElementById("team--" + gameState.currentPlayer + "--pic").src="images/mic-in-hand.png";
  turnDisplay.innerHTML = currentPlayerTurn();
  statusDisplay.innerHTML = "";
  wordToRhymeDisplay.innerHTML = "";
  rhymePromptDisplay.innerHTML = "";
  countdownDisplay.innerHTML = "";
  scoringDisplay.innerHTML = "";
  checkForGameOver();
}


//takes the score that a player types in and overwrites the gameState's score, to fix mistakes etc
function handleScoreOverwrite(team) {
  document.getElementById("team--" + team + "--score").value = document.getElementById("overwrite--score");
}


//registers which team is starting a trivia round and calls for questions
function startTriviaRound() {
  disableGetButtons();
  var teamDoingTrivia = "team"+gameState.currentPlayer+"Object";
  window[teamDoingTrivia].roundDifficulty.push(2); //each triva answer is 2 point
  askQuestions(true); //indicates that this is the first call to askQuestions function
  questionSubmitButton.disabled = false;
}


//the function that pulls data from the realtime database to present trivia questions
function askQuestions(initialRun) {
  questionSubmitButton.disabled = false;
  //pulls songs from the firebase realtime db
  var songsFromDB;
  var randomSong = "";
  let randomSong2 = "";
  let otherArtists = [];
  let songsGoingBack = [];
  var emergencyLoopBreaker = 0;
    dbRef.child("songs").get().then((snapshot) => {
      if (snapshot.exists()) {
        songsFromDB = snapshot.val();
        randomSong = songsFromDB[Math.floor(Math.random() * songsFromDB.length)];
        while (otherArtists.length < 3){
          randomSong2 = songsFromDB[Math.floor(Math.random() * songsFromDB.length)];
          if ((randomSong2["artist"] != randomSong["artist"]) && (otherArtists.includes(randomSong2["artist"]) == false)) {
            otherArtists.push(randomSong2["artist"]);
          }
          emergencyLoopBreaker += 1;
          if (emergencyLoopBreaker > 100) {
            statusDisplay.innerHTML = "there's been an error retrieving questions";
            break; //give up after an arbitrary number of attempts to populate a list of artists
          }
        }
        otherArtists.push(randomSong["artist"]);
        //makes sure that artists are shuffled before being assigned to options A - D
        otherArtists = otherArtists.sort(() => Math.random() - 0.5);
        statusDisplay.innerHTML = "Which artist sang the song below? ";
        rhymePromptDisplay.innerHTML = "(A)" + otherArtists[0] + ", (B)" + otherArtists[1] + ", (C)" + otherArtists[2] + ", (D)" + otherArtists[3];
        wordToRhymeDisplay.innerHTML = randomSong["title"];
        gameState.currentTriviaAnswer = randomSong["artist"];
        gameState.currentTriviaOptions = otherArtists;
      } else {
        statusDisplay.innerHTML = "Database not available, so using built-ins";
        //makes sure that we shuffle to get random artists
        triviaBank = triviaBank.sort(() => Math.random() - 0.5);
        randomSong = triviaBank.pop(Math.floor(Math.random() * triviaBank.length));
        while (otherArtists.length < 3){
          randomSong2 = triviaBank.pop(Math.floor(Math.random() * triviaBank.length));
          if ((randomSong2[1] != randomSong[1]) && (otherArtists.includes(randomSong2[1]) == false)) {
            otherArtists.push(randomSong2[1]);
          }
          songsGoingBack.push(randomSong2);
          emergencyLoopBreaker += 1;
          if (emergencyLoopBreaker > 100) {
            statusDisplay.innerHTML = "there's been an error retrieving questions";
            break; //give up after an arbitrary number of attempts to populate a list of artists
          }
        }
        triviaBank = [...triviaBank, ...songsGoingBack];
        otherArtists.push(randomSong[1]);
        otherArtists = otherArtists.sort(() => Math.random() - 0.5);
      }
    }).catch((error) => {
      console.error(error);
    });
  if (initialRun == true) { //this makes sure that there's only one counter per turn
    gameState.countdownTimer = parseInt(gameState.roundTime) / 1000;
    var gameTimer = setInterval(function() {
      if(parseInt(gameState.countdownTimer) <= 1) {
        clearInterval(gameTimer);
      }
      gameState.countdownTimer = parseInt(gameState.countdownTimer) - 1;
      countdownDisplay.innerHTML = gameState.countdownTimer;
    }, 1000);
    setTimeout(handlePlayerChange, gameState.roundTime);
  }
}


//checks whether a player answered a trivia question correctly and assigns points
function handleAnswer() {
  questionSubmitButton.disabled = true;
  var activeTeamName = "team"+gameState.currentPlayer+"Object";
  //compares each letter selected to what the gameState is storing as the expected answer
  if (document.getElementById("trivia--A").checked) {
    if (gameState.currentTriviaOptions[0] == gameState.currentTriviaAnswer) {
      window[activeTeamName].totalScore += 2;
      scoringDisplay.innerHTML = "+2 points for last correct answer"
    } else {
      if (window[activeTeamName].totalScore > 0) {
        window[activeTeamName].totalScore -= 1;
        scoringDisplay.innerHTML = "-1 point for last incorrect answer";
        gameState.streakCount = 0;
      }
    }
  } else if (document.getElementById("trivia--B").checked) {
      if (gameState.currentTriviaOptions[1] == gameState.currentTriviaAnswer) {
        window[activeTeamName].totalScore += 2;
      } else {
        if (window[activeTeamName].totalScore > 0) {
          window[activeTeamName].totalScore -= 1;
        }
      }
    } else if (document.getElementById("trivia--C").checked) {
        if (gameState.currentTriviaOptions[2] == gameState.currentTriviaAnswer) {
          window[activeTeamName].totalScore += 2;
        } else {
          if (window[activeTeamName].totalScore > 0) {
            window[activeTeamName].totalScore -= 1;
          }
        }
    } else if (document.getElementById("trivia--D").checked) {
        if (gameState.currentTriviaOptions[3] == gameState.currentTriviaAnswer) {
          window[activeTeamName].totalScore += 2;
        } else {
          if (window[activeTeamName].totalScore > 0) {
            window[activeTeamName].totalScore -= 1;
          }
        }
      }
  askQuestions(false); //continue asking questions while there's still time
  document.getElementById("team--"+gameState.currentPlayer+"--score").value = window[activeTeamName].totalScore;
  if (gameState.countdownTimer <=1) {
    enableGetButtons();
    disablePlayerTurnButtons();
    turnDisplay.innerHTML = "";
    wordToRhymeDisplay.innerHTML = "";
    countdownDisplay.innerHTML = "";
    rhymePromptDisplay.innerHTML = "";
    handlePlayerChange();
  }
}


//determines when the game should calculate a winner - currently it's after 3 rounds
function checkForGameOver() {
  if (teamAObject.roundDifficulty.length >= 3 && teamBObject.roundDifficulty.length >= 3) {
    handleGameEnd();
  }
}


//compares scores to display the winner and ask players to start a new game
function handleGameEnd() {
  if (teamAObject.totalScore > teamBObject.totalScore ) {
    turnDisplay.innerHTML = gameState.currentTeamNames["A"] + " Wins!";
  } else if (teamAObject.totalScore < teamBObject.totalScore ) {
    turnDisplay.innerHTML = gameState.currentTeamNames["B"] + " Wins!";
  } else if (teamAObject.totalScore == teamBObject.totalScore ) {
    turnDisplay.innerHTML = "It's a tie!";
  } else {
    turnDisplay.innerHTML = "No more rounds. Reset to play again";
  }
  statusDisplay.innerHTML = "press reset to play again";
  wordToRhymeDisplay.innerHTML = "";
  countdownDisplay.innerHTML = "";
  scoringDisplay.innerHTML = "";
  rhymePromptDisplay.innerHTML = "";
  disablePlayerTurnButtons();
  disableGetButtons();
}


//gives names to buttons referred to multiple times throughout the code
var updateAScoreButton = document.querySelector('.update--A--score');
updateAScoreButton.addEventListener('click', handleScoreOverwrite.bind(null, "A"), false);
var updateBScoreButton = document.querySelector('.update--B--score');
updateBScoreButton.addEventListener('click', handleScoreOverwrite.bind(null, "B"), false);
var easyButton = document.querySelector('.random--easy--word');
easyButton.addEventListener('click', getWords.bind(null, "easyWords"), false);
var mediumButton = document.querySelector('.random--medium--word');
mediumButton.addEventListener('click', getWords.bind(null, "mediumWords"), false);
var hardButton = document.querySelector('.random--hard--word');
hardButton.addEventListener('click', getWords.bind(null, "hardWords"), false);
var questionAskButton = document.querySelector('.ask--questions');
questionAskButton.addEventListener('click', startTriviaRound);
var questionSubmitButton = document.querySelector('.submit--question--answer');
questionSubmitButton.addEventListener('click', handleAnswer);
var countRhymeButton = document.querySelector('.add--to--score');
countRhymeButton.addEventListener('click', handleRhymeScoreUpdate);
var passButton = document.querySelector('.pass--turn');
passButton.addEventListener('click', handleRhymePass);
document.querySelector('.set--time').addEventListener('click', handleStartNewGame);
document.querySelector('.reset').addEventListener('click', handleStartNewGame);
//sets up the first game upon launch
handleStartNewGame();
