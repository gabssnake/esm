import {
  // Comment
  strictEqual
}
from "assert"

export

function check()

{
  const error = new Error // Line 12.
  const line = error.stack.match(/\.js:(\d+)/)[1]
  strictEqual(line, '12')
}
