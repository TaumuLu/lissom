import ansiHTML from 'ansi-html'

export default function ErrorDebug({
  error,
  info,
  dev,
}: {
  error: any
  info?: any
  dev: boolean
}) {
  const { name, message } = error

  let errorMessage: string
  if (dev) {
    if (name === 'ModuleBuildError' && message) {
      errorMessage = `
        <pre style=${getStyle(styles.stack)}>
          ${ansiHTML(encodeHtml(message))}
        </pre>
      `
    } else {
      errorMessage = StackTrace({ error, info })
    }
  } else {
    return '500: Internal Server Error'
  }

  return `
    <div style=${getStyle(styles.errorDebug)}>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      ${errorMessage}
    </div>
  `
}

const StackTrace = ({ error: { name, message, stack }, info }) => `
  <div>
    <div style=${getStyle(styles.heading)}>${message || name}</div>
    <pre style=${getStyle(styles.stack)}>${stack}</pre>
    ${
      info
        ? `<pre style=${getStyle(styles.stack)}>${info.componentStack}</pre>`
        : ''
    }
  </div>
`

const reg = /[A-Z]/g
const replaceName = name => {
  return name.replace(reg, match => {
    return `-${match.toLowerCase()}`
  })
}

const getStyle = (style: any): string => {
  const styleString = Object.keys(style)
    .map(key => `${replaceName(key)}: ${style[key]}`)
    .join(';')
  return `"${styleString}"`
}

export const styles: any = {
  errorDebug: {
    background: 'rgba(0, 0, 0, 0.85)',
    boxSizing: 'border-box',
    overflow: 'auto',
    padding: '24px',
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 9999,
    color: 'white',
  },

  stack: {
    fontFamily:
      'SF Mono, Roboto Mono, Fira Mono, consolas, menlo-regular, monospace',
    fontSize: '13px',
    lineHeight: '18px',
    color: 'white',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    marginTop: '16px',
  },

  heading: {
    fontFamily:
      '-apple-system, system-ui, BlinkMacSystemFont, Roboto, Segoe UI, Fira Sans, Avenir, Helvetica Neue, Lucida Grande, sans-serif',
    fontSize: '20px',
    fontWeight: '400',
    lineHeight: '28px',
    color: 'red',
    marginBottom: '0px',
    marginTop: '0px',
  },
}

const encodeHtml = str => {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// see color definitions of babel-code-frame:
// https://github.com/babel/babel/blob/master/packages/babel-code-frame/src/index.js

ansiHTML.setColors({
  reset: ['6F6767', '0e0d0d'],
  darkgrey: '6F6767',
  yellow: '6F6767',
  green: 'ebe7e5',
  magenta: 'ebe7e5',
  blue: 'ebe7e5',
  cyan: 'ebe7e5',
  red: 'ff001f',
})
