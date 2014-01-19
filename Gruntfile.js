module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/* <%= pkg.name %> - A scratch card library based on canvas\n * @author kikoshoung (kikoshoung@gmail.com)\n * last modified at <%= grunt.template.today("yyyy-mm-dd hh:MM:ss") %>\n */\n',
                beautify: {
                    ascii_only: true
                }
            },
            dist: {
                files: {
                    'js/scratchcard.min.js': 'js/scratchcard.js'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', 'uglify');
}; 