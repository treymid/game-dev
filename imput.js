const prompt = require('prompt-sync')();

// Get user input for character name and game
let characterName = prompt("What is your name? ");
let gameName = prompt("What's your favorite game? ");

// Combine the inputs into a greeting
let greeting = "Welcome to " + gameName + ", " + characterName + "! Prepare for your adventure!";

console.log(greeting);
