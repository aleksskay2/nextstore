import React, { useEffect } from 'react'

function ChatHeader({styles, product}) {
  useEffect(() => {
    console.log('product', product)
  },[])
  return (
    <div><h2 className={styles["chat__title"]}> Чат по товару: {product?.productName}</h2></div>
  )
}

export default ChatHeader