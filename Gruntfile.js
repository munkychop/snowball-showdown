module.exports = function(grunt) {

	"use strict";

	var util = require("util");
	var jsSrcDir = "public/src/js/";
	var jsAppSrcDir = jsSrcDir + "app/";
	var jsLibsSrcDir = jsSrcDir + "libs/";
	var jsSrcFile = "app.js";
	var jsDistDir = "public/dist/js/";
	var jsDistFile = jsSrcFile;

	var scssSrcDir = "public/src/scss/";
	var scssSrcFile = "app.scss";
	var cssDistDir = "public/dist/css/";
	var cssDistFile = "app.css";

	var jadeSrcDir = "app/views/";

	var imgSrcDir = "public/src/img/";
	var imgDistDir = "public/dist/img/";

	// a variable to alias all js files in the app directory, allowing them to be
	// require'd without any complicated relative filepaths.
	var browserifyAliasAppFilesArray = aliasMappingsToAliasArray({
		
		cwd: jsAppSrcDir,
		src: ["**/*.js"],
		dest: ""
	});

	// Takes grunt-browserify aliasMappings config and converts it into an alias array
	function aliasMappingsToAliasArray(aliasMappings)
	{
		var aliasArray = [],
			aliases = util.isArray(aliasMappings) ? aliasMappings : [aliasMappings];

		aliases.forEach(function (alias) {

			grunt.file.expandMapping(alias.src, alias.dest, {cwd: alias.cwd}).forEach(function(file) {
				
				var expose = file.dest.substr(0, file.dest.lastIndexOf("."));
				aliasArray.push("./" + file.src[0] + ":" + expose);
			});
		});

		return aliasArray;
	}

	grunt.initConfig({

		browserify: {

			dev: {

				options : {
					browserifyOptions: {
						debug: true,
					},
					alias: browserifyAliasAppFilesArray,
					
				},

				src: jsAppSrcDir + jsSrcFile,
				dest: jsDistDir + jsDistFile,
			},

			dist: {

				options : {
					alias: browserifyAliasAppFilesArray
				},

				src: jsAppSrcDir + jsSrcFile,
				dest: jsDistDir + jsDistFile
			}
		},

		uglify: {

			dist: {

				options: {
					compress: true,
					mangle: true,
					preserveComments: false
				},

				src: jsDistDir + jsDistFile,
				dest: jsDistDir + jsDistFile
			}
		},

		sass: {

			dev: {
				options: {
					unixNewlines: true,
					style: "expanded",
					lineNumbers: false,
					debugInfo: false,
					precision: 8,
					sourcemap: true
				},

				src: scssSrcDir + scssSrcFile,
				dest: cssDistDir + cssDistFile
			},

			dist: {
				options: {
					style: "compressed",
					precision: 8,
					sourcemap : false
				},

				src: scssSrcDir + scssSrcFile,
				dest: cssDistDir + cssDistFile
			}
		},

		csso: {
			dist: {
				
				options: {
					restructure: false
				},

				src: cssDistDir + cssDistFile,
				dest: cssDistDir + cssDistFile
			}
		},

		connect: {

			server : {
				options: {
					open: true
				}
			}
		},

		watch: {

			options: {
				livereload: true,
			},

			jade: {
				files: [jadeSrcDir + "**/*.jade"],
				options: {
					livereload: true
				}
			},
			
			js: {
				files: [jsSrcDir + "**/*.js"],
				tasks: ["browserify:dev"]
			},

			scss: {
				files: [scssSrcDir + "**/*.scss"],
				tasks: ["sass:dev"]
			},

			img: {
				files: [imgSrcDir + "**/*.*"],
				tasks: ["copy:img"]
			}
		},

		copy: {
			img: {
				expand: true,
				cwd: imgSrcDir,
				src: "**/*.*",
				dest: imgDistDir
			}
		}
	});

	require("load-grunt-tasks")(grunt);

	grunt.registerTask("dev", ["sass:dev", "browserify:dev", "copy"]);
	grunt.registerTask("start", ["sass:dev", "browserify:dev", "copy", "connect:server", "watch"]);
};