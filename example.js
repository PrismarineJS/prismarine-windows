const windows = require('./')('1.8').windows
const Item = require('prismarine-item')('1.8')

const inv = new windows.InventoryWindow(1, 'inv', 36)

inv.updateSlot(10, new Item(256, 1))

console.log(inv.items())
