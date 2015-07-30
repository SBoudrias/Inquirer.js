/**
 * List prompt example
 */

"use strict";
var inquirer = require("../lib/inquirer");
var Promise = require('promise');


var states = [
  "Alabama",
  "Alaska",
  "American Samoa",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District Of Columbia",
  "Federated States Of Micronesia",
  "Florida",
  "Georgia",
  "Guam",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Marshall Islands",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Northern Mariana Islands",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Palau",
  "Pennsylvania",
  "Puerto Rico",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virgin Islands",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming"
];

function searchStates(answers) {
  return function(input) {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {

        resolve(states.filter(function(state) {
          return new RegExp(input, 'i').exec(state) !== null;
        }).map(function(state) {
          return state;
        }));
      }, 400);
    });
  };
}

inquirer.prompt([{
  type: "autocomplete",
  name: "from",
  message: "Select a state to travel from",
  choices: searchStates,
  validate: function(state) {
    return 'error not valid';
    return state.length > 10;
  }
}, {
  type: "autocomplete",
  name: "to",
  message: "Select a state to travel to",
  choices: searchStates,
  filter: function(val) {
    return val.toLowerCase();
  }
}], function(answers) {
  console.log(JSON.stringify(answers, null, "  "));
});
