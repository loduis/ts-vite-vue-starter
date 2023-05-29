import matter from 'gray-matter'
import { unified } from 'unified'
import parse from 'remark-parse'
import rehypeRaw from 'rehype-raw'
import remark2rehype from 'remark-rehype'

const ext = /\.md$/

export default function markdown(opts = {}) {
  return {
    name: 'markdown',
    async transform(content, id) {
      if (!ext.test(id)) {
        return null
      }
      const result = await compile(content)
      const code = 'let data = ' + JSON.stringify(result) + ';'
      return {
        code: code + `export default data;`,
        map: { mappings: '' }
      }
    }
  }
}

async function compile(contents) {
  const { data, content, ...rest } = matter(contents, {
    excerpt: true,
    excerpt_separator: '<!--more-->'
  })
  const entries = await getBody(content, data)
  if (rest.excerpt) {
    data.excerpt = await getBody(rest.excerpt, data)
  }
  const title = (data.title || '').trim()
  const description = (data.description || '').trim()
  let type = data.type || 'website'
  const body = data.body || {}
  delete data.title
  delete data.description
  delete data.body
  delete data.type
  if (!data.body) {
    for (const key in data) {
      body[key] = data[key]
    }
  }

  return {
    title,
    type,
    description,
    main: { ...body, markdown: entries }
  }
}

function getBody(content, data = {}) {
  return new Promise((resolve, reject) => {
    // Generate toc from body
    unified()
      .use(parse)
      .use(remark2rehype, {
        allowDangerousHtml: true
      })
      .use(rehypeRaw)
      .use(jsonCompiler)
      .process({ data, value: content }, (error, file) => {
        /* istanbul ignore if */
        if (error) {
          return reject(error)
        }
        resolve(file.result.children)
      })
  })
}

/**
 * JSON compiler
 */
function jsonCompiler() {
  this.Compiler = function (root) {
    /**
     * We do not use `map` operation, since each node can be expanded to multiple top level
     * nodes. Instead, we need a array to fill in as many elements inside a single
     * iteration
     */
    return {
      type: 'root',
      children: parseAsJSON(root.children || [])
    }
  }
}

/**
 * Parses nodes for JSON structure. Attempts to drop
 * unwanted properties.
 */
function parseAsJSON(node) {
  if (Array.isArray(node)) {
    return node.map(parseAsJSON).filter(Boolean)
  }
  /**
   * Element node creates an isolated children array to
   * allow nested elements
   */
  if (node.type === 'element') {
    /*
    if (node.tagName === 'li') {
      // unwrap unwanted paragraphs around `<li>` children
      let hasPreviousParagraph = false
      node.children = node.children.flatMap((child) => {
        if (child.tagName === 'p') {
          if (hasPreviousParagraph) {
            // Insert line break before new paragraph
            child.children.unshift({
              type: 'element',
              tagName: 'br',
              properties: {}
            })
          }

          hasPreviousParagraph = true
          return child.children
        }
        return child
      })
    }*/

    /**
     * Rename component slots tags name
     */
    if (node.tagName === 'component-slot') {
      node.tagName = 'template'
    }
    const props = node.properties
    if (props.className) {
      props.class = props.className.join(' ')
      delete props.classNamel
    }
    return {
      type: 'element',
      tag: node.tagName,
      props: props,
      children: parseAsJSON(node.children || [])
    }
  }

  /**
   * Text node
   */
  if (node.type === 'text') {
    // Remove new line nodes
    if (node.value === '\n' || node.value == '') {
      return null
    }
    return {
      type: 'text',
      value: node.value
    }
  }

  // Remove comment nodes from AST tree
  if (node.type === 'comment') {
    return null
  }

  node.children = parseAsJSON(node.children || [])

  return node
}
