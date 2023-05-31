/* eslint-env mocha */

const { describe, it } = require('mocha')
const assert = require('assert')

const mcVersion = '1.8'
const windows = require('..')(mcVersion)
const Item = require('prismarine-item')(mcVersion)
const registry = require('prismarine-registry')(mcVersion)

function getAssertFunctions (slot) {
  return {
    empty: function () {
      assert.equal(slot, null)
      return this
    },
    notEmpty: function () {
      assert.notEqual(slot, null)
      return this
    },
    count: function (count) {
      assert.equal(slot.count, count)
      return this
    },
    hasMaxCount: function () {
      assert.equal(slot.count, slot.stackSize)
      return this
    },
    type: function (type) {
      assert.equal(slot.type, type)
      return this
    }
  }
}

function getSlot (slotShorthand, inventoryEnd) {
  // negative values start from the end of the inventory
  return slotShorthand < 0 ? inventoryEnd + slotShorthand : slotShorthand
}

function createTestWindow (type, slotCount = undefined) {
  const testWindow = windows.createWindow(1, 'minecraft:' + type, type, slotCount ?? (type === 'chest' ? 27 : undefined))

  testWindow.prepareSlot = function (slotShorthand, count, type) {
    testWindow.updateSlot(getSlot(slotShorthand, testWindow.inventoryEnd), new Item(type, count))

    return testWindow
  }

  testWindow.prepareSelectedItem = function (count, type) {
    testWindow.selectedItem = new Item(type, count)

    return testWindow
  }

  testWindow.executeClick = function (mode, mouseButton, slotShorthand, gamemode) {
    const slot = getSlot(slotShorthand, testWindow.inventoryEnd)
    const click = {
      slot,
      mouseButton,
      mode,
      windowId: testWindow.id,
      item: slot === -999 ? null : testWindow.slots[slot]
    }

    testWindow.updatedSlots = []
    testWindow.assertedSlots = []
    const onSlotUpdate = (slot) => {
      slot = +slot
      if (!testWindow.updatedSlots.includes(slot)) {
        testWindow.updatedSlots.push(slot)
      }
    }

    testWindow.on('updateSlot', onSlotUpdate)

    testWindow.acceptClick(click, gamemode)

    testWindow.removeListener('updateSlot', onSlotUpdate)
  }

  testWindow.assertSlot = function (slotShorthand) {
    let slot = getSlot(slotShorthand, testWindow.inventoryEnd)
    if (!testWindow.assertedSlots.includes(slot)) {
      testWindow.assertedSlots.push(slot)
    }
    slot = testWindow.slots[slot]
    return getAssertFunctions(slot)
  }

  testWindow.assertSelectedItem = function () {
    return getAssertFunctions(testWindow.selectedItem)
  }

  return testWindow
}

// item ids
const firstItem = 1
const secondItem = 2

let testWindow = null

afterEach(function () {
  testWindow.updatedSlots.forEach((slot) => {
    if (!testWindow.assertedSlots.includes(slot)) {
      assert.fail(`slot ${slot} updated, but it has not been asserted`)
    }
  })
})

describe('mode 0 | normal click', () => {
  describe('mouseButton 0', () => {
    it('pickup item', () => {
      testWindow = createTestWindow('chest').prepareSlot(0, 64, firstItem)

      testWindow.executeClick(0, 0, 0)

      testWindow.assertSlot(0).empty()
      testWindow.assertSelectedItem().count(64).type(firstItem)
    })
  })

  describe('mouseButton 1', () => {
    it('drop one of selected Item into a slot (same item)', () => {
      testWindow = createTestWindow('chest')
        .prepareSelectedItem(64, firstItem)
        .prepareSlot(0, 1, firstItem)

      testWindow.executeClick(0, 1, 0)

      testWindow.assertSelectedItem().count(63)
      testWindow.assertSlot(0).count(2)
    })

    it('drop one of selected Item into a slot (empty slot)', () => {
      testWindow = createTestWindow('chest')
        .prepareSelectedItem(64, firstItem)

      testWindow.executeClick(0, 1, 0)

      testWindow.assertSelectedItem().count(63)
      testWindow.assertSlot(0).count(1)
    })

    it('drop selected Item into a slot (empty slot)', () => {
      testWindow = createTestWindow('chest')
        .prepareSelectedItem(1, firstItem)

      testWindow.executeClick(0, 1, 0)

      testWindow.assertSelectedItem().empty()
      testWindow.assertSlot(0).count(1)
    })
  })

  describe('mouseButton 0', () => {
    it('drop all of selected Item into a slot (almost full with same item)', () => {
      testWindow = createTestWindow('chest')
        .prepareSelectedItem(64, firstItem)
        .prepareSlot(0, 60, firstItem)

      testWindow.executeClick(0, 0, 0)

      testWindow.assertSelectedItem().count(60)
      testWindow.assertSlot(0).count(64)
    })

    it('drop selected Item into empty slot', () => {
      testWindow = createTestWindow('chest')
        .prepareSelectedItem(1, firstItem)

      testWindow.executeClick(0, 0, 0)

      testWindow.assertSelectedItem().empty()
      testWindow.assertSlot(0).notEmpty().count(1).type(firstItem)
    })
  })
})

describe('mode 1 | shift click', () => {
  describe('mouseButton 0', () => {
    it('shift out of chest into inventory', () => {
      testWindow = createTestWindow('chest')
        .prepareSlot(0, 64, firstItem)

      testWindow.executeClick(1, 0, 0)

      testWindow.assertSlot(0).empty()
      testWindow.assertSlot(-1).notEmpty().count(64).type(firstItem)
    })

    it('shift out of inventory into chest', () => {
      testWindow = createTestWindow('chest')
        .prepareSlot(-1, 64, firstItem)

      testWindow.executeClick(1, 0, -1)

      testWindow.assertSlot(0).notEmpty().count(64).type(firstItem)
      testWindow.assertSlot(-1).empty()
    })

    it.skip('shift out of inventory into armor slot (unimplemented)', () => {
      const someBoots = registry.itemsByName.leather_boots.id
      testWindow = createTestWindow('inventory')
        .prepareSlot(-1, 1, someBoots)

      testWindow.executeClick(1, 0, -1)

      testWindow.assertSlot(-1).empty()
      // 8 is the slot for boots
      testWindow.assertSlot(8).notEmpty().type(someBoots).count(1)
    })
  })
})

describe('mode 2 | number click', () => {
  describe('mouseButton 0', () => {
    it('from full slot into empty slot', () => {
      testWindow = createTestWindow('chest')
        .prepareSlot(0, 64, firstItem)

      // mouseButton 0 = hotbarStart
      // slot 0 = windowStart
      testWindow.executeClick(2, 0, 0)

      testWindow.assertSlot(-9).notEmpty().count(64).type(firstItem)
      testWindow.assertSlot(0).empty()
    })

    it('from empty slot into full slot', () => {
      testWindow = createTestWindow('chest')
        // -9 = hotbarStart
        .prepareSlot(-9, 64, firstItem)

      // mouseButton 0 = hotbarStart
      // slot 0 = windowStart
      testWindow.executeClick(2, 0, 0)

      testWindow.assertSlot(-9).empty()
      testWindow.assertSlot(0).notEmpty().count(64).type(firstItem)
    })

    it('from slot with item to slot with same item', () => {
      testWindow = createTestWindow('chest')
        .prepareSlot(-9, 32, firstItem)
        .prepareSlot(0, 32, firstItem)

      testWindow.executeClick(2, 0, 0)

      if (registry.version['>=']('1.9')) {
        // expect nothing to happen
      } else {
        testWindow.assertSlot(0).empty()
        testWindow.assertSlot(-9).notEmpty().count(64).type(firstItem)
        testWindow.assertSlot(-8).empty()
      }
    })

    it('from slot with item to slot with different item', () => {
      testWindow = createTestWindow('chest')
        .prepareSlot(0, 64, firstItem)
        .prepareSlot(-1, 64, secondItem)

      // mouseButton 8 = hotbarEnd
      // slot 0 = windowStart
      testWindow.executeClick(2, 8, 0)

      if (registry.version['>=']('1.9')) {
        testWindow.assertSlot(0).notEmpty().count(64).type(secondItem)
        testWindow.assertSlot(-1).notEmpty().count(64).type(firstItem)
      } else {
        testWindow.assertSlot(0).empty()
        testWindow.assertSlot(-1).notEmpty().count(64).type(firstItem)
        testWindow.assertSlot(-9).notEmpty().count(64).type(secondItem)
      }
    })
  })
})

describe('mode 3 | middle click', () => {
  describe('mouseButton 2', () => {
    it('get stack into selectedItem (gamemode 0)', () => {
      testWindow = createTestWindow('chest')
        .prepareSlot(0, 1, firstItem)

      testWindow.executeClick(3, 2, 0)

      // expect no change
      testWindow.assertSelectedItem().empty()
    })

    it('get stack into selectedItem (gamemode 1)', () => {
      testWindow = createTestWindow('chest')
        .prepareSlot(0, 1, firstItem)

      testWindow.executeClick(3, 2, 0, /* gamemode = */1)

      testWindow.assertSelectedItem().notEmpty().count(64).type(firstItem)
    })
  })
})

describe('mode 4 | drop click', () => {
  describe('mouseButton 0', () => {
    it('drop 1 of stack', () => {
      testWindow = createTestWindow('chest')
        .prepareSlot(0, 64, firstItem)

      testWindow.executeClick(4, 0, 0)

      testWindow.assertSlot(0).notEmpty().count(64 - 1).type(firstItem)
    })
  })

  describe('mouseButton 1', () => {
    it('drop full stack', () => {
      testWindow = createTestWindow('chest')
        .prepareSlot(0, 64, firstItem)

      testWindow.executeClick(4, 1, 0)

      testWindow.assertSlot(0).empty()
    })
  })
})
