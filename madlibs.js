const prompt = require("prompt-sync")(); // Ask for user inputs
let gameCharacter = prompt("Enter a game character: ");
let weapon = prompt("Enter a weapon: ");
let age = prompt("enter character age " )
let gameCharactermiddelname = prompt("enter character middel name ")
let gameCharacterlastname = prompt("enter character last name ")
let job = prompt("enter character job ")
let story = "Once upon a time " + gameCharacter + gameCharactermiddelname + gameCharactermiddelname + "a" +age+job+ " was on a mission to ..."
console.log(story);
