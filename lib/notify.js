// WhatsApp notification helpers
// All notifications open a pre-filled WhatsApp message
// No SMS API needed — works on every Zambian phone

export function notifyCustomerConfirmed({ customerPhone, orderId, items, total }) {
    const ref = orderId.slice(-4).toUpperCase()
    const itemLines = items.map(i =>
      `• ${i.quantity} ${i.produce?.unit} ${i.produce?.name}`
    ).join('\n')
  
    const message = [
      `✅ *Your Agrized order is confirmed!*`,
      `Order #${ref}`,
      ``,
      itemLines,
      ``,
      `💵 Total to pay on delivery: *K ${parseFloat(total).toFixed(2)}*`,
      `📱 Pay via Airtel Money / MTN MoMo`,
      ``,
      `Your order is being prepared. We'll message you when it's on the way. 🌿`
    ].join('\n')
  
    return 'https://wa.me/' + customerPhone + '?text=' + encodeURIComponent(message)
  }
  
  export function notifyCustomerInTransit({ customerPhone, orderId, driverName, driverPhone }) {
    const ref = orderId.slice(-4).toUpperCase()
  
    const message = [
      `🚚 *Your Agrized order is on the way!*`,
      `Order #${ref}`,
      ``,
      `Your driver *${driverName}* is heading to you now.`,
      `Driver contact: +${driverPhone}`,
      ``,
      `Have your mobile money ready for payment on delivery. 💵`
    ].join('\n')
  
    return 'https://wa.me/' + customerPhone + '?text=' + encodeURIComponent(message)
  }
  
  export function notifyFarmerNewOrder({ farmerPhone, orderId, items }) {
    const ref = orderId.slice(-4).toUpperCase()
    const itemLines = items.map(i =>
      `• ${i.quantity} ${i.produce?.unit} ${i.produce?.name}`
    ).join('\n')
  
    const message = [
      `🌿 *New Agrized order for your produce!*`,
      `Order #${ref}`,
      ``,
      `Items needed:`,
      itemLines,
      ``,
      `Please prepare this stock for driver pickup.`,
      `Mark as ready in your Agrized app.`
    ].join('\n')
  
    return 'https://wa.me/' + farmerPhone + '?text=' + encodeURIComponent(message)
  }
  
  export function notifyFarmerDriverComing({ farmerPhone, orderId, driverName }) {
    const ref = orderId.slice(-4).toUpperCase()
  
    const message = [
      `🚗 *Driver coming to collect your stock!*`,
      `Order #${ref}`,
      ``,
      `*${driverName}* will collect your prepared items shortly.`,
      `Please have everything packed and ready. 📦`
    ].join('\n')
  
    return 'https://wa.me/' + farmerPhone + '?text=' + encodeURIComponent(message)
  }
  
  export function notifyDriverAssigned({ driverPhone, orderId, customerName, address, total }) {
    const ref = orderId.slice(-4).toUpperCase()
  
    const message = [
      `📦 *New delivery assigned — Agrized*`,
      `Order #${ref}`,
      ``,
      `Customer: *${customerName}*`,
      `Address: ${address}`,
      `Collect: *K ${parseFloat(total).toFixed(2)}*`,
      ``,
      `Open your Agrized app to view full details.`
    ].join('\n')
  
    return 'https://wa.me/' + driverPhone + '?text=' + encodeURIComponent(message)
  }