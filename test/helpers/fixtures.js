module.exports = {

  input: {
    message: "message",
    name: "name"
  },

  confirm: {
    message: "message",
    name: "name"
  },

  list: {
    message: "message",
    name: "name",
    choices: [ "foo", "bar", "bum" ]
  },

  rawlist: {
    message: "message",
    name: "name",
    choices: [ "foo", "bar", "bum" ]
  },

  expand: {
    message: "message",
    name: "name",
    choices: [
      { key: "a", name: "acab"  },
      { key: "b", name: "bar"   },
      { key: "c", name: "chile" }
    ]
  }

};
