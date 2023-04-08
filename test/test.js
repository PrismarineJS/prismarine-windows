const { describe, it } = require('mocha')

const assert = require('assert')

const windows = require('..')('1.8')
const Item = require('prismarine-item')('1.8')

const chest = windows.createWindow(1, 'minecraft:chest', 'chest', 27)
const inv = windows.createWindow(2, 'minecraft:inventory', 'inventory')

const createClick = (mode, mouseButton, slot, useInv = false) => ({
  slot,
  mouseButton,
  mode,
  windowId: useInv ? inv.id : chest.id,
  item: slot === -999 ? null : useInv ? inv.slots[slot] : chest.slots[slot]
})

chest.updateSlot(0, new Item(1, 64))
chest.updateSlot(1, new Item(1, 1))
chest.updateSlot(3, new Item(1, 63))
chest.updateSlot(5, new Item(2, 3))
chest.updateSlot(chest.inventoryEnd - 1, new Item(1, 44))
chest.updateSlot(chest.inventoryEnd - 2, new Item(1, 44))
chest.updateSlot(chest.inventoryEnd - 3, new Item(1, 44))

inv.updateSlot(inv.inventoryEnd - 1, new Item(301, 1))
inv.updateSlot(inv.inventoryEnd - 2, new Item(1, 1))

describe('mode 0 | normal click', () => {
  describe('mouseButton 0', () => {
    it('pickup item', () => {
      chest.acceptClick(createClick(0, 0, 0))
      assert(!chest.slots[0] && chest.selectedItem?.count === 64 && chest.selectedItem.type === 1)
    })
  })

  describe('mouseButton 1', () => {
    it('drop one of selected Item into a slot (same item)', () => {
      chest.acceptClick(createClick(0, 1, 1))
      assert(chest.selectedItem?.count === 63 && chest.slots[1]?.count === 2)
    })
    it('drop one of selected Item into a slot (empty slot)', () => {
      chest.acceptClick(createClick(0, 1, 2))
      assert(chest.selectedItem?.count === 62 && chest.slots[2]?.count === 1 && chest.slots[2].type === 1)
    })
  })

  describe('mouseButton 0', () => {
    it('drop all of selected Item into a slot (almost full with same item)', () => {
      chest.acceptClick(createClick(0, 0, 3))
      assert(chest.selectedItem?.count === 61 && chest.slots[3]?.count === 64 && chest.slots[3].type === 1)
    })
    it('drop selected Item into empty slot', () => {
      chest.acceptClick(createClick(0, 0, 0))
      assert(Boolean(!chest.selectedItem && chest.slots[0]))
    })
  })
})

describe('mode 1 | shift click', () => {
  describe('mouseButton 0', () => {
    it('shift out of chest into inventory', () => {
      chest.acceptClick(createClick(1, 0, 0))
      assert(chest.slots[chest.inventoryEnd - 1]?.count === 64 && chest.slots[chest.inventoryEnd - 2]?.count === 64 && chest.slots[chest.inventoryEnd - 3]?.count === 64 && chest.slots[chest.inventoryEnd - 4]?.count === 1)
    })

    it('shift out of inventory into chest', () => {
      chest.acceptClick(createClick(1, 0, chest.inventoryEnd - 1))
      assert(!chest.slots[0] && chest.slots[1]?.count === 64 && chest.slots[2]?.count === 3)
    })

    it('shift out of inventory into chest #2', () => {
      chest.acceptClick(createClick(1, 0, chest.inventoryEnd - 2))
      assert(!chest.slots[chest.inventoryEnd - 2] && chest.slots[2]?.count === 64 && chest.slots[0]?.count === 3)
    })

    it.skip('shift out of inventory into armor slot - leather boots', () => {
      // isn't even implemented, so it would naturally fail.
      inv.acceptClick(createClick(1, 0, 44, true))
      assert(!inv.slots[44] && inv.slots[8])
    })
  })
})

describe('mode 2 | number click', () => {
  describe('mouseButton 0', () => {
    it('number click from full slot into empty slot', () => {
      chest.acceptClick(createClick(2, 0, 3))
      assert(!chest.slots[3] && chest.slots[54]?.count === 64)
    })

    it('number click from empty slot into full slot', () => {
      chest.acceptClick(createClick(2, 0, 3))
      assert(!chest.slots[54] && chest.slots[3]?.count === 64)
    })
  })

  describe('mouseButton 5', () => {
    it('number click from slot with item to slot with same item', () => {
      chest.acceptClick(createClick(2, 5, 0))
      assert(!chest.slots[0] && chest.slots[59]?.count === 4)
    })

    it('number click from slot with item to slot with different item', () => {
      chest.acceptClick(createClick(2, 5, 5))
      assert(!chest.slots[5] && chest.slots[59].type === 2 && chest.slots[59]?.count === 3 && chest.slots[54]?.count === 4 && chest.slots[54].type === 1)
    })
  })
})

describe('mode 3 | middle click', () => {
  describe('mouseButton 2', () => {
    it('get stack into selectedItem (gamemode 0)', () => {
      inv.acceptClick(createClick(3, 2, inv.inventoryEnd - 2, true), 0)
      assert(!inv.selectedItem)
    })

    it('get stack into selectedItem (gamemode 1)', () => {
      inv.acceptClick(createClick(3, 2, inv.inventoryEnd - 2, true), 1)
      assert(Item.equal(inv.selectedItem, new Item(1, inv.slots[inv.inventoryEnd - 2].stackSize)))
    })
  })
})

describe('mode 4 | drop click', () => {
  describe('mouseButton 0', () => {
    it('drop 1 of stack', () => {
      chest.acceptClick(createClick(4, 0, 1))
      assert(chest.slots[1]?.count === 63)
    })
  })

  describe('mouseButton 1', () => {
    it('drop full stack', () => {
      chest.acceptClick(createClick(4, 1, 1))
      assert(!chest.slots[1])
    })
  })
})
