/*jshint strict:false */
module.exports = function( grunt ) {

  grunt.initConfig({

    jshint: {
      options: {
        jshintrc : ".jshintrc"
      },
      files: [ "libs/**/*.js" ]
    },

    simplemocha: {
      options: {
        ui: "bdd",
        reporter: "spec"
      },
      all: "test/**/*.js"
    }

  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-simple-mocha");

  grunt.registerTask("default", [ "jshint", "simplemocha" ]);

};
