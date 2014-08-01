module.exports = function(grunt) {
  grunt.initConfig({
    'gh-pages': {
      options: {
        base: 'demo'
      },
      src: ['**']
    }
  });

  grunt.loadNpmTasks('grunt-gh-pages');
    
  grunt.registerTask('deploy', ['gh-pages']);
}
