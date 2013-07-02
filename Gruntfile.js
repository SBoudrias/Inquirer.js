/*jshint strict:false */
module.exports = function( grunt ) {

  grunt.initConfig({

    jshint: {
      options: {
        jshintrc : ".jshintrc"
      },
      files: [ "lib/**/*.js", "test/**/*.js" ]
    },

    simplemocha: {
      options: {
        ui: "bdd",
        reporter: "spec"
      },
      all: "test/specs/**/*.js"
    }

  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-simple-mocha");
  grunt.loadNpmTasks('grunt-release');

  grunt.registerTask("default", [ "jshint", "simplemocha" ]);

};
