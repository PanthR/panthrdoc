var Handlebars = require('handlebars');
var fs = require('fs');
var path = require('path');
var templateFilename = path.join(process.cwd(), 'node_modules', 'panthrdoc', 'template', 'module.handlebars');
var template = Handlebars.compile(fs.readFileSync(templateFilename, 'utf8'));

Handlebars.registerHelper('makeLink', makeLink);
Handlebars.registerHelper('makeText', makeText);
Handlebars.registerHelper('makeShort', makeShort);
Handlebars.registerHelper('authorLinks', authorLinks);

function makeText(text) { return text.replace(/(\.prototype|this)\./, '#'); };
function makeShort(text) { return makeText(text).replace(/\(.*/, ''); };
function makeLink(text) { return makeShort(text).replace(/#/, '%25'); };
function authorLinks(text) {
   if (text == null) { return "unknown"; }
   var authors = text[0].match(/((\w.*?)\s*\<(.*?)\>)/g);
   return authors.map(function(author) {
      var match = author.match(/((\w.*?)\s*\<(.*?)\>)/);
      return '<a class="author" href="mailto:' + match[3] + '">' + match[2] + '</a>';
   }).join(', ');
}

exports.publish = function(data, opts) {
   var modules = {};
   var entries = {};
   var currentModule;
   data(function() { return this.comment !== ''; })
   .each(processEntry);
   Object.keys(modules).forEach(function(module) {
      modules[module].contents.forEach(function(doclet) {
         if (doclet.description == null) { return; }
         doclet.description = doclet.description.replace(/<code>(.*?)<\/code>/g, function(s, s1) {
            if (entries[makeShort(s1)]) {
               return ['<a href="#', makeLink(s1), '">', s, '</a>'].join('');
            }
            return s;
         });
      });
   });
   
   Object.keys(modules).forEach(function(module) {
         var fileName = path.normalize('./docs/' + module + '.html');
         fs.writeFileSync(fileName, template(modules[module]), 'utf8');
         console.log("Creating file: ", fileName);
   });
   function processEntry(entry) {
      var targetModule;
      if (entry.kind === 'module') {
         currentModule = entry.name;
         if (!modules[currentModule]) {
            modules[currentModule] = { module: entry, contents: [], allModules: modules };
            entries[makeShort(currentModule)] = true;
         }
      } else {
         targetModule = (entry.memberof || currentModule).replace('module:', '');
         if (modules[targetModule] == null) {
            console.log("Working on entry: ", entry.longname, entry.name, entry.memberof);
            console.log("Could not find entry for module: ", targetModule);
         } else {
            modules[targetModule].contents.push(entry);
            if (entry.fullName != null) { entries[makeShort(entry.fullName)] = true; }
         }
      }
   }
};

// TODO: Add plugin to sniff out entry kind