/*jshint strict:false */
module.exports = function( grunt ) {

  grunt.initConfig({

    jshint: {
      options: {
        jshintrc : ".jshintrc"
      },
      files: [ "lib/**/*.js", "test/**/*.js" ]
    },

    mochaTest: {
      options: {
        ui: "bdd",
        reporter: "spec",
        require: "test/before.js"
      },
      all: "test/specs/**/*.js"
    }

  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-mocha-test");

  grunt.registerTask("default", [ "jshint", "mochaTest" ]);

};
