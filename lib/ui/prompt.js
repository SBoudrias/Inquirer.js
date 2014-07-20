/**
 * Base interface class other can inherits from
 */

var _ = require("lodash");
var rx = require("rx");
var util = require("util");
var utils = require("../utils/utils");
var Base = require("./baseUI");

var inquirer = require("../inquirer");


/**
 * Module exports
 */

module.exports = PromptUI;


/**
 * Constructor
 */

function PromptUI( questions, allDone ) {
  Base.call(this);

  // Keep global reference to the answers
  this.answers = {};
  this.completed = allDone;

  // Make sure questions is an array.
  if ( !_.isArray(questions) ) {
    questions = [questions];
  }

  // Start running the questions
  var flow = rx.Observable.fromArray( questions ).concatMap( this.processQuestion.bind(this) );

  flow.forEach(
    function() {},
    function( err ) {
      throw err;
    },
    this.onCompletion.bind(this)
  );

  // TODO: return the flow (not from constructor, so need to add a run method)
}
util.inherits( PromptUI, Base );


/**
 * Once all prompt are over
 */

PromptUI.prototype.onCompletion = function() {
  this.close();

  if ( _.isFunction(this.completed) ) {
    this.completed( this.answers );
  }
};

PromptUI.prototype.processQuestion = function( question ) {
  return rx.Observable.defer(function() {
    var obs = rx.Observable.create(function(obs) {
      obs.onNext( question );
      obs.onCompleted();
    });

    return obs
      .concatMap( this.setDefaultType )
      .concatMap( this.filterIfRunnable.bind(this) )
      .concatMap( this.getDefault.bind(this) )
      .concatMap( this.getChoices.bind(this) )
      .concatMap( this.fetchAnswer.bind(this) );
  }.bind(this));
};

PromptUI.prototype.fetchAnswer = function( question ) {
  var prompt = new inquirer.prompts[question.type]( question, this.rl, this.answers );
  var answers = this.answers;
  return utils.createObservableFromAsync(function() {
    var done = this.async();
    prompt.run(function( answer ) {
      answers[question.name] = answer;
      done({ name: question.name, answer: answer });
    });
  });
};

PromptUI.prototype.setDefaultType = function( question ) {
  // Default type to input
  if ( !inquirer.prompts[question.type] ) {
    question.type = "input";
  }
  return rx.Observable.defer(function() {
    return rx.Observable.return( question );
  });
};

PromptUI.prototype.getDefault = function( question ) {
  if ( !_.isFunction(question.default) ) return rx.Observable.return(question);

  var answers = this.answers;
  return utils.createObservableFromAsync(function() {
    var done = this.async();
    utils.runAsync( question.default, function( value ) {
      question.default = value;
      done( question );
    }, answers );
  });
};

PromptUI.prototype.getChoices = function( question ) {
  if ( !_.isFunction(question.choices) ) return rx.Observable.return(question);

  var answers = this.answers;
  return utils.createObservableFromAsync(function() {
    var done = this.async();
    utils.runAsync( question.choices, function( value ) {
      question.choices = value;
      done( question );
    }, answers );
  });
};

PromptUI.prototype.filterIfRunnable = function( question ) {
  if ( !_.isFunction(question.when) ) return rx.Observable.return(question);

  var answers = this.answers;
  return rx.Observable.defer(function() {
    return rx.Observable.create(function( obs ) {
      utils.runAsync( question.when, function( shouldRun ) {
        if ( shouldRun ) {
          obs.onNext( question );
        }
        obs.onCompleted();
      }, answers );
    });
  });
};
