/* eslint-env jest */

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

describe('mode 0 | normal click', () => {
  test('mouseButton 0 | pickup item', () => {
    chest.acceptClick(createClick(0, 0, 0))
    expect(!chest.slots[0] && chest.selectedItem?.count === 64 && chest.selectedItem.type === 1).toBe(true)
  })

  test('mouseButton 1 | drop one of selected Item into a slot (same item)', () => {
    chest.acceptClick(createClick(0, 1, 1))
    expect(chest.selectedItem?.count === 63 && chest.slots[1]?.count === 2).toBe(true)
  })

  test('mouseButton 1 | drop one of selected Item into a slot (empty slot)', () => {
    chest.acceptClick(createClick(0, 1, 2))
    expect(chest.selectedItem?.count === 62 && chest.slots[2]?.count === 1 && chest.slots[2].type === 1).toBe(true)
  })

  test('mouseButton 0 | drop all of selected Item into a slot (almost full with same item)', () => {
    chest.acceptClick(createClick(0, 0, 3))
    expect(chest.selectedItem?.count === 61 && chest.slots[3]?.count === 64 && chest.slots[3].type === 1).toBe(true)
  })

  test('mouseButton 0 | drop selected Item into empty slot', () => {
    chest.acceptClick(createClick(0, 0, 0))
    expect(Boolean(!chest.selectedItem && chest.slots[0])).toBe(true)
  })
})

describe('mode 1 | shift click', () => {
  test('mouseButton 0 | shift out of chest into inventory', () => {
    chest.acceptClick(createClick(1, 0, 0))
    expect(chest.slots[chest.inventoryEnd - 1]?.count === 64 && chest.slots[chest.inventoryEnd - 2]?.count === 64 && chest.slots[chest.inventoryEnd - 3]?.count === 64 && chest.slots[chest.inventoryEnd - 4]?.count === 1).toBe(true)
  })

  test('mouseButton 0 | shift out of inventory into chest', () => {
    chest.acceptClick(createClick(1, 0, chest.inventoryEnd - 1))
    expect(!chest.slots[0] && chest.slots[1]?.count === 64 && chest.slots[2]?.count === 3).toBe(true)
  })

  test('mouseButton 0 | shift out of inventory into chest #2', () => {
    chest.acceptClick(createClick(1, 0, chest.inventoryEnd - 2))
    expect(!chest.slots[chest.inventoryEnd - 2] && chest.slots[2]?.count === 64 && chest.slots[0]?.count === 3).toBe(true)
  })

  test.skip('mouseButton 0 | shift out of inventory into armor slot - leather boots', () => {
    // isn't even implemented, so it would naturally fail.
    inv.acceptClick(createClick(1, 0, 44, true))
    expect(!inv.slots[44] && inv.slots[8]).toBe(true)
  })
})

describe('mode 2 | number click', () => {
  test('mouseButton 0 | number click from full slot into empty slot', () => {
    chest.acceptClick(createClick(2, 0, 3))
    expect(!chest.slots[3] && chest.slots[54]?.count === 64).toBe(true)
  })

  test('mouseButton 0 | number click from empty slot into full slot', () => {
    chest.acceptClick(createClick(2, 0, 3))
    expect(!chest.slots[54] && chest.slots[3]?.count === 64).toBe(true)
  })

  test('mouseButton 5 | number click from slot with item to slot with same item', () => {
    chest.acceptClick(createClick(2, 5, 0))
    expect(!chest.slots[0] && chest.slots[59]?.count === 4).toBe(true)
  })

  test('mouseButton 5 | number click from slot with item to slot with different item', () => {
    chest.acceptClick(createClick(2, 5, 5))
    expect(!chest.slots[5] && chest.slots[59].type === 2 && chest.slots[59]?.count === 3 && chest.slots[54]?.count === 4 && chest.slots[54].type === 1).toBe(true)
  })
})

describe('mode 4 | drop click', () => {
  test('mouseButton 0 | drop 1 of stack', () => {
    chest.acceptClick(createClick(4, 0, 1))
    expect(chest.slots[1]?.count === 63).toBe(true)
  })

  test('mouseButton 1 | drop full stack', () => {
    chest.acceptClick(createClick(4, 1, 1))
    expect(!chest.slots[1]).toBe(true)
  })
})
