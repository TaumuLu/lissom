import React, { useState } from 'react'

export default () => {
  const [value, setValue] = useState(1)

  return (
    <div style={{ fontSize: 24 }}>
      {value}
      <div>
        <span style={{ marginRight: 10 }} onClick={() => setValue(value + 1)}>+</span>
        <span onClick={() => setValue(value - 1)}>-</span>
      </div>
    </div>
  )
}
