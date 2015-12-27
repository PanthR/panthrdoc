var Handlebars = require('handlebars');
var fs = require('fs');
var path = require('path');
var templateFilename = path.join(process.cwd(), 'node_modules', 'panthrdoc', 'template', 'module.handlebars');
var template = Handlebars.compile(fs.readFileSync(templateFilename, 'utf8'));

Handlebars.registerHelper('makeLink', makeLink);
Handlebars.registerHelper('makeShort', makeShort);
Handlebars.registerHelper('authorLinks', authorLinks);

function makeShort(text) { return text.replace(/(\.?prototype|this)\./, '#').replace(/\(.*/, ''); };
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
      var actualModule, docletList;
      actualModule = modules[module].module;
      docletList = modules[module].contents;
      docletList.push(modules[module].module);
      docletList.forEach(function(doclet) {
         if (doclet.description == null) { return; }
         if (actualModule.hasOwnProperty('noPrefix') && doclet.fullName) {
            doclet.fullName = doclet.fullName.replace(actualModule.name + '.', '');
         }
         doclet.description = doclet.description.replace(/<code>(.*?)<\/code>/g, function(s, s1) {
            if (/^module:/.test(s1)) {
               return ['<a href = "', s1.replace(/^module:/, ''), '.html">',
                       s.replace(/module:/, ''), '</a>'].join('');
            }
            if (entries[makeShort(s1)]) {
               return ['<a href="#', makeLink(s1), '">', s, '</a>'].join('');
            }
            return s;
         });
      });
      modules[module].sortedContents = modules[module].contents.filter(
         function(entry) { return entry.fullName != null; }
      ).sort(
         function(a, b) {
            function isClass(str) { return /\.[A-Z]/.test(str); }
            function isInstance(str) { return /\#\w|\.prototype\./.test(str); }
            a = a.fullName.replace(/\(.*/, '');
            b = b.fullName.replace(/\(.*/, '');
            if (a.indexOf(b) === 0) { return 1; }
            if (b.indexOf(a) === 0) { return -1; }
            var res = a < b ? -1 : 1;
            if (isClass(a)) { res += -100; }
            if (isClass(b)) { res += 100; }
            if (isInstance(a)) { res += 50; }
            if (isInstance(b)) { res -= 50; }
            return res;
         }
      );
   });

   Object.keys(modules).forEach(function(module) {
         var fileName = path.normalize('./docs/' + module + '.html');
         fs.writeFileSync(fileName, template(modules[module]), 'utf8');
         console.log("Creating file: ", fileName);
   });
   makeTeXVersion(modules, entries);
   function processEntry(entry) {
      var targetModule;
      if (entry.kind === 'module') {
         currentModule = entry.name;
         if (!modules[currentModule]) {
            modules[currentModule] = { module: entry, contents: [], allModules: modules };
            entries[makeShort(currentModule)] = true;
         }
         if (modules[currentModule].module == null) {
            modules[currentModule].module = entry;
         }
      } else {
         targetModule = (entry.memberof || currentModule).replace('module:', '');
         if (modules[targetModule] == null) {
            modules[targetModule] = { module: null, contents: [], allModules: modules };
            console.log("Working on entry: ", entry.longname, entry.name, entry.memberof);
            console.log("Could not find entry for module: ", targetModule);
         }
         modules[targetModule].contents.push(entry);
         if (entry.fullName != null) { entries[makeShort(entry.fullName)] = true; }
      }
   }
};

function makeTeXVersion(modules, entries) {
   var templateFilename = path.join(process.cwd(), 'node_modules', 'panthrdoc', 'template', 'template.tex');
   var template = Handlebars.compile(fs.readFileSync(templateFilename, 'utf8'));
   var fileName = path.normalize('./docs/docs.tex');
   fs.writeFileSync(fileName, postProcess(template({ modules: modules })), 'utf8');
   console.log("Creating file: ", fileName);
   function postProcess(s) {
      var openTag = /^<(\w*)((?:.|\n)*?)>$/;
      var closeTag = /^<\/(\w*?)>$/;
      var stack = [], contents, currTag, currToken, m;
      s.split(/(<.*?>)/g).forEach(function(token) {
         if (closeTag.test(token)) {
            contents = [];
            currTag = token.match(closeTag)[1];
            while (true) {
               currToken = stack.pop();
               if (currToken.tag !== null) {
                  if (currToken.tag !== currTag) {
                     throw new Error('Mismatched tags: ', currToken.tag, currTag);
                  }
                  stack.push({ tag: null, contents:
                              processTag(currTag, currToken.rest, contents.join(''))
                             });
                  break;
               } else {
                  contents.unshift(currToken.contents);
               }
            }
         } else if (openTag.test(token)) {
            m = token.match(openTag);
            stack.push({ tag: m[1], rest: m[2], contents: token });
         } else {
            stack.push({ tag: null, contents: token });
         }
      });
      return stack.map(function(o) { return o.contents; }).join('')
         .replace(/\|begin\|/g, '{').replace(/\|end\|/g, '}')
         .replace(/[#_&%]/g, function(m) { return '\\' + m; });
      function processTag(tag, rest, contents) {
         switch (tag) {
            case 'p'   : return contents + '\n\n';
            case 'ul'  : return '\\begin{itemize}\n' + contents + '\\end{itemize}\n';
            case 'li'  : return '\\item ' + contents + '\n';
            case 'code': return '\\texttt{' + contents + '}';
            case 'em'  : return '\\emph{' + contents + '}';
            case 'pre': return '\\begin{lstlisting}\n' + contents +
                               '\\end{lstlisting}\n';
            case 'a':
               //TODO
               return contents;
            default: console.log('Not handling tag: ', tag);
         }
      }
   }
}

// TODO: Add plugin to sniff out entry kind
