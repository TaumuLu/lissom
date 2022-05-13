import React from 'react'

import './index.scss'
import './icons'

export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

const SvgIcon = props => {
  const { icon, className } = props
  const iconName = `#react-svg-${icon}`
  const classNames = `icon svg-icon', svg-${icon} ${className}`

  if (isExternal(icon)) {
    return (
      <div
        style={{
          mask: `url(${icon}) no-repeat 50% 50%`,
        }}
        className={classNames}
      />
    )
  }

  return (
    <svg className={classNames} aria-hidden="true">
      <use xlinkHref={iconName} />
    </svg>
  )
}

export default SvgIcon
