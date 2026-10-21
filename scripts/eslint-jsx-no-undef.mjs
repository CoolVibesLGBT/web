/** TypeScript's no-undef replacement does not check JSX at runtime. */
export default {
  meta: {
    type: 'problem',
    schema: [],
    messages: { undefined: 'JSX component {{name}} is not defined or imported.' },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        let name = node.name
        const member = name.type === 'JSXMemberExpression'
        while (name.type === 'JSXMemberExpression') name = name.object
        if (name.type !== 'JSXIdentifier' || name.name === 'this') return
        if (!member && !/^[A-Z]/.test(name.name)) return
        let scope = context.sourceCode.getScope(node)
        while (scope) {
          if (scope.set.has(name.name)) return
          scope = scope.upper
        }
        context.report({ node: name, messageId: 'undefined', data: { name: name.name } })
      },
    }
  },
}
