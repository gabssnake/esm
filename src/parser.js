import "./vendor/acorn/src/expression.js"
import "./vendor/acorn/src/location.js"
import "./vendor/acorn/src/lval.js"
import "./vendor/acorn/src/node.js"
import "./vendor/acorn/src/scope.js"
import "./vendor/acorn/src/statement.js"
import "./vendor/acorn/src/tokencontext.js"
import "./vendor/acorn/src/tokenize.js"
import { Parser as AcornParser } from "./vendor/acorn/src/state.js"

import assign from "./util/assign.js"
import createOptions from "./util/create-options.js"
import { enable as enableAwaitAnywhere } from "./acorn-ext/await-anywhere.js"
import { enable as enableDynamicImport } from "./acorn-ext/dynamic-import.js"
import { enable as enableExport } from "./acorn-ext/export.js"
import { enable as enableImport } from "./acorn-ext/import.js"
import { enable as enableTolerance } from "./acorn-ext/tolerance.js"

const defaultOptions = createOptions({
  allowReturnOutsideFunction: false,
  ecmaVersion: 9,
  enableExportExtensions: false,
  enableImportExtensions: false,
  sourceType: "module"
})

const acornParser = new AcornParser
const acornRaise = acornParser.raise

const literalRegExp = /^(?:'((?:\\.|[^'])*?)'|"((?:\\.|[^"])*?)"|;)/
const skipWhiteSpaceRegExp = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g

class Parser {
  static getNamesFromPattern(pattern) {
    let i = -1
    const names = []
    const queue = [pattern]

    while (++i < queue.length) {
      const pattern = queue[i]
      if (pattern === null) {
        // The ArrayPattern .elements array can contain null to indicate that
        // the position is a hole.
        continue
      }

      // Cases are ordered from most to least likely to encounter.
      switch (pattern.type) {
      case "Identifier":
        names.push(pattern.name)
        break
      case "Property":
      case "ObjectProperty":
        queue.push(pattern.value)
        break
      case "AssignmentPattern":
        queue.push(pattern.left)
        break
      case "ObjectPattern":
        queue.push(...pattern.properties)
        break
      case "ArrayPattern":
        queue.push(...pattern.elements)
        break
      case "RestElement":
        queue.push(pattern.argument)
        break
      }
    }

    return names
  }

  // Based on Acorn's Parser.prototype.strictDirective parser utility.
  // Copyright Marijn Haverbeke. Released under MIT license:
  // https://github.com/ternjs/acorn/blob/5.1.1/src/parseutil.js#L9-L19
  static hasPragma(code, pragma, pos) {
    if (pos == null) {
      pos = 0
    }

    while (true) {
      skipWhiteSpaceRegExp.lastIndex = pos
      pos += skipWhiteSpaceRegExp.exec(code)[0].length

      const match = literalRegExp.exec(code.slice(pos))

      if (match === null) {
        return false
      }

      if ((match[1] || match[2]) === pragma) {
        return true
      }

      pos += match[0].length
    }
  }

  static lookahead(parser) {
    acornParser.input = parser.input
    acornParser.pos = parser.pos
    acornParser.nextToken()
    return acornParser
  }

  static parse(code, options) {
    options = createOptions(options, defaultOptions)
    return extend(new AcornParser(options, code), options).parse()
  }

  static raise(parser, pos, message, ErrorCtor) {
    if (typeof ErrorCtor !== "function") {
      acornRaise.call(parser, pos, message)
    }

    try {
      acornRaise.call(parser, pos, message)
    } catch (e) {
      throw assign(new ErrorCtor(e.message), e)
    }
  }

  static unexpected(parser, pos) {
    if (typeof pos !== "number") {
      pos = parser.start
    }
    Parser.raise(parser, pos, "Unexpected token")
  }
}

function extend(parser, options) {
  enableAwaitAnywhere(parser)
  enableDynamicImport(parser)
  enableTolerance(parser)

  if (options.enableExportExtensions) {
    enableExport(parser)
  }

  if (options.enableImportExtensions) {
    enableImport(parser)
  }

  return parser
}

Object.setPrototypeOf(Parser.prototype, null)

export default Parser
