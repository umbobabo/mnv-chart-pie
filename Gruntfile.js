module.exports = function(grunt) {
  var fs = require('fs');
  //Capturing the name project folder
  var re = /^(.+\/)(.{0,})/;
  var projectFolder = re.exec(__dirname)[2];
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bundle: grunt.file.readJSON('config.json').bundle,
    useminPrepare: {
      html: 'partials/widgethead.handlebars'
    },
    githooks: {
      all: {
        'pre-commit': 'jshint'
      }
    },
    shell: {
      listFolders: {
        options: {
          stdout: true
        },
        command: 'git init'
      }
    },
    watch: {
      scripts: {
        files: 'js/*.js'
      },
      sass: {
        files: ['css/sass/**/*.{scss,sass}',  '../../css/editorial.scss'],
        tasks: ['sass:dev']
      },
      handlebars: {
        files: ['js/tpl/handlebars/*.handlebars'],
        tasks: ['handlebars']
      },
      KeepConfigAligned: {
        files: ['config.json','package.json'],
        tasks: ['KeepConfigAligned']
      },
      KeepDataAligned: {
        files: ['data/data.json'],
        tasks: ['KeepDataAligned']
      },
      BundleVariation: {
        files: ['config.json'],
        tasks: ['BundleVariation']
      }       
    },
    concat: {
      dist: {
        src: ['js/css.js', 'dist/init.min.js'],
        dest: 'dist/init.min.js',
      },
      template: {
        src: ['css/inlineStyle.html', 'js/tpl/handlebars/*.*'],
        dest: 'dist/<%= pkg.ns.folder %>-complete.handlebars',
      },
      css: {
        src: ['../../pattern-library/css/components.css', '../../pattern-library/css/app.css', '../../pattern-library/css/fonts.css', '../../pattern-library/css/social-icons.css', 'css/style.css'],
        dest: 'tmp/concat-critical.css',
      }
    },
    uglify: {
      options: {
        mangle: {
          except: ['mnv']
        }
      }
    },
    sass: {
      dist: {
        options: {
          outputStyle: [
            'compressed'
          ],
          includePaths: [
            './bower_components/sass-list-maps'
          ]
        },
        files: {
          'css/style.css': 'css/sass/style.scss'
        }
      },
      dev: {
        files: {
          'css/style.css': 'css/sass/style.scss'
        }
      }
    },
    browserSync: {
        dev: {
            bsFiles: {
              src : ['css/style.css', 'js/*.*', 'public/*.*', 'partials/*.*', 'js/tpl/template.js', 'data/inbundle.js', 'sites/default/files/external/minerva_data/<%= pkg.ns.folder %>/<%= pkg.version %>/*.*' ]
            },
            options: {
              watchTask: true // < VERY important
            }
        }
    },
    jshint: {
      //files: ['js/**/*.js', '!dist/init.min.js', '!js/tests/*.js', '!js/tpl/template.js'],
      files: ['js/init.js'],
      options: {
        camelcase: true,
        curly:   true,
        eqeqeq:  true,
        forin: true,
        immed:   true,
        latedef: true,
        newcap:  true,
        noarg:   true,
        sub:     true,
        undef:   true,
        boss:    true,
        eqnull:  true,
        browser: true,
        strict: true,
        trailing: true,

        globals: {
          // AMD
          module:     true,
          require:    true,
          requirejs:  true,
          define:     true,
          Handlebars: true,
          mnv: true,

          // Environments
          console:    true,

          // General Purpose Libraries
          $:          true,
          jQuery:     true,
          sinon:      true,
          describe:   true,
          it:         true,
          expect:     true,
          beforeEach: true,
          afterEach:  true
        }
      }
    },
    handlebars: {
      all: {
        files: {
            'js/tpl/template.js': 'js/tpl/handlebars/*.handlebars'
        }
      }
    },
    jasmine: {
      src: ['js/*.js', '../../js/*.js', '!dist/init.min.js'],
      options: {
        specs: ['js/tests/*tests.js', '../../js/tests/*tests.js'],
        vendor: ['https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js']
      }
    },
    csstojs: {
      target: ['css/style.css', 'js/css.js']
    },
    robFix: {
      target: ['dist/init.min.js']
    },
    inlineCSS: {
      target: ['dist/critical.css']
    },
    KeepConfigAligned: {
      //TODO review this part with dest and src
      target: ['config.json', 'package.json', 'js/config.js']
    },
    KeepDataAligned: {
      //TODO review this part with dest and src
      //TODO create folder URL dynamically
      target: ['data/data.json', 'sites/default/files/external/minerva_data/<%= pkg.ns.folder %>/<%= bundle.assets.version %>/data.json' ,'sites/default/files/external/minerva_data/<%= pkg.ns.folder %>/<%= bundle.assets.version %>/data-jsonp.json', 'data/inbundle.js']
    },
    BundleVariation: {
      target: ['partials/widgethead.handlebars']
    },
    criticalcss: {
        custom: {
            options: {
                url: "http://localhost:3000/projects/" + projectFolder + "/critical.html",
                width: 1200,
                height: 3000,
                outputfile: "dist/critical.css",
                filename: "tmp/concat-critical.css", // Using path.resolve( path.join( ... ) ) is a good idea here
                buffer: 800*2024,
                ignoreConsole: true
            }
        }
    },
  });

  // Convert css into js
  grunt.registerMultiTask('csstojs', 'Convert CSS to JS.', function() {
    var cssPath = this.data[0];
    jsPath = this.data[1];

    grunt.log.writeln("Starting conversion...");
    var css = fs.readFileSync(cssPath).toString();

    if(!css) {
      grunt.log.writeln("The css file is empty, nothing to convert.");
      return false;
    }
    var cssStr = css.split("\n").map(function(l){return '"' + l + '\\n"';}).join(" + \n");
    var js = "(function() { var css = " + cssStr + ", head = document.getElementsByTagName('head')[0], style = document.createElement('style'); style.setAttribute('type', 'text/css'); var nodeStyle = document.createTextNode(css); if(style.styleSheet){ style.styleSheet.cssText = nodeStyle.toString();}else{ style.appendChild(nodeStyle); }; head.appendChild(style);})();";

    grunt.log.writeln("Conversion completed, js file created.");
    fs.writeFileSync(jsPath, js);
    return true;
  });

  // Rob fix
  // This check prevent a problem verified on IE with the minified file
  // Check for this string "c.styleSheet?c.styleSheet.cssText=d.toString():c.appendChild(d)," on the init.min.js
  // and replace with this "c.styleSheet?c.styleSheet.cssText=a:c.appendChild(d),"
  grunt.registerMultiTask('robFix', 'Apply Rob Fix for IE issue on uglified file', function() {
    var target = this.data[0];

    grunt.log.writeln("Starting fix file " + target + "...");
    try {
      var initMin = fs.readFileSync(target).toString();
    } catch (err) {
      grunt.log.writeln("An error occured on reading the file " + target + ": " + err);
      return false;
    }
    
    grunt.log.writeln("File readed...");
    //grunt.log.writeln(initMin);
    
    var before = initMin;
    initMin.replace('c.styleSheet?c.styleSheet.cssText=d.toString():c.appendChild(d),', 'c.styleSheet?c.styleSheet.cssText=a:c.appendChild(d),');
    if(initMin===before){
      grunt.log.writeln("No string replaced, nothing changed.");
    } else {
      grunt.log.writeln("String replaced");
      try {
        fs.writeFileSync(target, initMin);
      } catch (err) {
          grunt.log.writeln("An error occured on saving file:" + err);
          return false;
      }
      grunt.log.writeln("Rob Fix applied with success.");
    }    
    return true;
  });

  // Inline CSS
  // Put the css style inside a tag <style><style>
  grunt.registerMultiTask('inlineCSS', 'Creating an inline style tag with css insider', function() {
    var target = this.data[0];

    grunt.log.writeln("Starting file reading " + target + "...");
    try {
      var initMin = fs.readFileSync(target).toString();
    } catch (err) {
      grunt.log.writeln("An error occured on reading the file " + target + ": " + err);
      return false;
    }
    
    grunt.log.writeln("File readed...");
    //grunt.log.writeln(initMin);
    
    try {
        fs.writeFileSync('css/inlineStyle.html', '<style>' + initMin + '</style>');
    } catch (err) {
        grunt.log.writeln("An error occured on saving file:" + err);
        return false;
    }  
    return true;
  });

  // KeepConfigAligned
  // Keep aligned config.js file with config.json and package.json
  grunt.registerMultiTask('KeepConfigAligned', 'Recreating data derivated files', function() {
    var configFile = this.data[0];
    var minervaFile = this.data[1];
    var target = this.data[2];

    grunt.log.writeln("Starting file reading " + target + "...");
    try {
      var targetFile = fs.readFileSync(target).toString();
    } catch (err) {
      grunt.log.writeln("An error occured on reading the file " + target + ": " + err);
      return false;
    }

    grunt.log.writeln("Starting file reading " + configFile + "...");
    try {
      var config = fs.readFileSync(configFile).toString();
    } catch (err) {
      grunt.log.writeln("An error occured on reading the file " + configFile + ": " + err);
      return false;
    }

    grunt.log.writeln("Starting file reading " + minervaFile + "...");
    try {
      var minerva = fs.readFileSync(minervaFile).toString();
    } catch (err) {
      grunt.log.writeln("An error occured on reading the file " + minervaFile + ": " + err);
      return false;
    }
    
    grunt.log.writeln("Files readed...");
    var match = targetFile.match(/^var.{0,}=/i)[0];
    var newJSConfig = match + ' {\n "config" : ' + config + ',\n "minerva" :' + minerva + ' };';
    
    try {
        grunt.log.writeln("New config.js created.");
        fs.writeFileSync(target, newJSConfig);
    } catch (err) {
        grunt.log.writeln("An error occured on saving file:" + target + " " + err);
        return false;
    }  
    return true;
  });

  // KeepDataAligned
  // Keep aligned different version of data with the data/data.json files
  // Different data are needed to test different data-provider
  // json --> 'sites/default/files/external/minerva_data/<%= pkg.ns.folder %>/<%= bundle.assets.version %>/data.json'
  // jsonp --> 'sites/default/files/external/minerva_data/<%= pkg.ns.folder %>/<%= bundle.assets.version %>/data-jsonp.json'
  // inbundle --> 'data/inbundle.js'
  grunt.registerMultiTask('KeepDataAligned', 'Recreating data derivated files', function() {
    var dataFile = this.data[0];
    this.data.shift();
    var targetFiles = this.data;
    
    grunt.log.writeln("Starting file reading " + dataFile + "...");
    try {
      var data = fs.readFileSync(dataFile).toString();
    } catch (err) {
      grunt.log.writeln("An error occured on reading the file " + dataFile + ": " + err);
      return false;
    }

    for (var i = 0; i < targetFiles.length; i++) {
      var file = targetFiles[i];
      console.log('Working on ' + file);
      var newData;
      // TODO Review this part
      switch(i){
        //json
        case 0:
          newData = data;
        break;
        //jsonp
        case 1:
          grunt.log.writeln("Starting file reading " + file + "...");
          //Reading the name of the callback in the jsonp file
          try {
            var jsonpFile = fs.readFileSync(file).toString();
          } catch (err) {
            grunt.log.writeln("An error occured on reading the file " + file + ": " + err);
            return false;
          }
          var match = jsonpFile.match(/.{0,}\(/i)[0];
          newData = match + data + ');';
        break;
        //inbundle
        case 2:
          grunt.log.writeln("Starting file reading " + file + "...");
          //Reading the name of the callback in the jsonp file
          try {
            var inbundleFile = fs.readFileSync(file).toString();
          } catch (err) {
            grunt.log.writeln("An error occured on reading the file " + file + ": " + err);
            return false;
          }
          var match = inbundleFile.match(/^var.{0,}=/i)[0];
          newData = match + data + ';';
        break;
      }      

      grunt.log.writeln("Try writing " + file);
      try {
        fs.writeFileSync(file, newData);
        grunt.log.writeln("Writed " + file);
      } catch (err) {
          grunt.log.writeln("An error occured on saving file:" + file + " " + err);
          return false;
      } 
    };

    return true;
  });

  // Change bundle composition if a config has changed
  grunt.registerMultiTask('BundleVariation', 'Change bundle elements', function() {
    var bundlePipe = this.data[0];
    var provider =  grunt.file.readJSON('config.json').bundle.data.provider;

    //Reading the bundle pipeline from head
    try {
      var bundle = fs.readFileSync(bundlePipe).toString();
      bundle = bundle.replace('<script src="data/inbundle.js"></script>\n','').replace('<script src="data/inbundle.js"></script>','');
      // TODO Review this part
      console.log(provider);
      switch(provider){
        //inbundle
        case 'inbundle':
          grunt.log.writeln("Changing in inbundle ...");
          bundle = bundle.replace('<script src="js/init.js"></script>', '<script src="data/inbundle.js"></script>\n<script src="js/init.js"></script>');
        break;
      }
      grunt.log.writeln("Try writing " + bundlePipe);
      try {
        fs.writeFileSync(bundlePipe, bundle);
        grunt.log.writeln("Writed " + bundlePipe);
      } catch (err) {
          grunt.log.writeln("An error occured on saving file:" + bundlePipe + " " + err);
          return false;
      }
    } catch (err) {
      grunt.log.writeln("An error occured on reading the file " + bundlePipe + ": " + err);
      return false;
    }

    return true;
  });

  grunt.loadNpmTasks('grunt-browser-sync');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-githooks');
  grunt.loadNpmTasks('grunt-handlebars-compiler');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-criticalcss');

  // Compile sass and handlebars on the fly.
  grunt.registerTask('default', ['sass:dev', 'handlebars', 'BundleVariation', 'KeepConfigAligned',  'KeepDataAligned', 'browserSync', 'watch']);

   // Unit tests.
  grunt.registerTask('test', ['jasmine']);

  // Unit tests.
  //'jasmine',
  grunt.registerTask('getready', ['jshint']);

  // Git tasks.
  grunt.registerTask('git', ['shell', 'githooks']);

  // Run this task when the code is ready for production.
  grunt.registerTask('production', ['sass:dist',  'csstojs', 'useminPrepare', 'concat', 'concat:dist', 'uglify', 'robFix']);
  //'criticalcss:custom',
  grunt.registerTask('template', [ 'inlineCSS', 'concat:template']);
  //Get the critical css for the widget
  grunt.registerTask('csscritical', ['concat:css', 'criticalcss:custom']);
};