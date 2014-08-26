# Panthrdoc

This is a simple documentation generator intended for internal use in the PanthR project.

To use: `npm install panthrdoc --save-dev` then add something like:

```
"doc": "node ./node_modules/panthrdoc/run.js ."
```

in the scripts section of your `package.json`. You can then create the documentation by running `npm run doc`.

The first time you run this, a `docs` folder will be created if it doesn't exist and populated with a `doc.css`.

The folder name is hard-coded for now.

## Assumptions

Panthrdoc makes a number of assumptions about how the comments look like, to minimize the amount of extra information that needs to be inserted, and to determine the look of the resulting html pages.

- Comments that should end up in the documentation need to be comments that jsdoc would parse (i.e. starting with /\*).
- Panthrdoc understands only a limited number of jsdoc tags, mostly those identifying what kind a symbol is, and whether it would be instance, static etc. Tags like `@param`, `@see`, `@alias` will be ignored.
- Each `@module` will go into its own file.
- If scope status and/or kind tags are missing, panthrdoc will try to fill those in based on the format of the next line of code after the comment. In particular, comments must immediately precede the code they refer to. This should make scope and kind tags largely redundant, and they should be omitted when possible.
- Comments are processed through Markdown. In particular, the `@example` tags are completely ignored. Instead, prepend code snippets with 4 extra whitespace marks.
- Code sections like \`Vector.each\` will turn into links if the corresponding symbol has a documentation.
- Panthrdoc expects to find an `@author` tag with each module. It will then process this author tag looking for one or more entries like "John Doe <john@doe.com>". How those entries are separated from each other is irrelevant.
- If a `@version` tag is found in the `@module` section, it will be added to the page heading. Typically you should reserve this for the main "module".
- A navigation bar with all entries will be formed on the left side of the page. These entries are shorted as follows:
    * The module/class constructor will be first.
    * Any subclasses like `Vector.DenseV`, identified by a capital letter following the dot, will follow, in alphabetical order.
    * Static methods follow, in alphabetical order.
    * Prototype methods follow, in alphabetical order.
