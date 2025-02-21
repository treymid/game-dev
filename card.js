const prompt = require('prompt-sync')();

// Get user input for character name and game
let card = prompt("pick a card ");
let color = prompt("pick a color ");

// Combine the inputs into a greeting
let greeting = "you picked " + card + ", " + color + " is your favriote color ";

console.log(greeting);