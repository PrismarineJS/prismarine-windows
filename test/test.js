const { describe, it } = require('mocha')
const assert = require('assert')

const mcVersion = '1.8'
const windows = require('..')(mcVersion)
const Item = require('prismarine-item')(mcVersion)
const registry = require('prismarine-registry')(mcVersion)

function generateAssertFunctions (stack) {
  return {
    empty: function () {
      assert.equal(stack, null)
      return this
    },
    notEmpty: function () {
      assert.notEqual(stack, null)
      return this
    },
    count: function (count) {
      assert.equal(stack.count, count)
      return this
    },
    hasMaxCount: function () {
      assert.equal(stack.count, stack.stackSize)
      return this
    },
    type: function (type) {
      assert.equal(stack.type, type)
      return this
    }
  }
}

function getSlot (slotShorthand, inventoryEnd) {
  // negative values start from the end of the inventory
  return slotShorthand < 0 ? inventoryEnd + slotShorthand : slotShorthand
}

function createMockWindow (type, slotCount = undefined) {
  const mockWindow = windows.createWindow(1, 'minecraft:' + type, type, slotCount ?? (type === 'chest' ? 27 : undefined))

  mockWindow.prepareSlot = function (slotShorthand, count, type) {
    mockWindow.updateSlot(getSlot(slotShorthand, mockWindow.inventoryEnd), new Item(type, count))

    return mockWindow
  }

  mockWindow.prepareSelectedItem = function (count, type) {
    mockWindow.selectedItem = new Item(type, count)

    return mockWindow
  }

  mockWindow.executeClick = function (mode, mouseButton, slotShorthand, gamemode) {
    const slot = getSlot(slotShorthand, mockWindow.inventoryEnd)
    const click = {
      slot,
      mouseButton,
      mode,
      windowId: mockWindow.id,
      item: slot === -999 ? null : mockWindow.slots[slot]
    }

    mockWindow.acceptClick(click, gamemode)
  }

  mockWindow.assertSlot = function (slotShorthand) {
    const stack = mockWindow.slots[getSlot(slotShorthand, mockWindow.inventoryEnd)]
    return generateAssertFunctions(stack)
  }

  mockWindow.assertSelectedItem = function () {
    return generateAssertFunctions(mockWindow.selectedItem)
  }

  return mockWindow
}

const firstStackId = 1
const secondStackId = 2

describe('mode 0 | normal click', () => {
  describe('mouseButton 0', () => {
    it('pickup item', () => {
      const mockWindow = createMockWindow('chest').prepareSlot(0, 64, firstStackId)

      mockWindow.executeClick(0, 0, 0)

      mockWindow.assertSelectedItem().count(64).type(firstStackId)
    })
  })

  describe('mouseButton 1', () => {
    it('drop one of selected Item into a slot (same item)', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSelectedItem(64, firstStackId)
        .prepareSlot(0, 1, firstStackId)

      mockWindow.executeClick(0, 1, 0)

      mockWindow.assertSelectedItem().count(63)
      mockWindow.assertSlot(0).count(2)
    })

    it('drop one of selected Item into a slot (empty slot)', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSelectedItem(64, firstStackId)

      mockWindow.executeClick(0, 1, 0)

      mockWindow.assertSelectedItem().count(63)
      mockWindow.assertSlot(0).count(1)
    })

    it('drop selected Item into a slot (empty slot)', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSelectedItem(1, firstStackId)

      mockWindow.executeClick(0, 1, 0)

      mockWindow.assertSelectedItem().empty()
      mockWindow.assertSlot(0).count(1)
    })
  })

  describe('mouseButton 0', () => {
    it('drop all of selected Item into a slot (almost full with same item)', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSelectedItem(64, firstStackId)
        .prepareSlot(0, 60, firstStackId)

      mockWindow.executeClick(0, 0, 0)

      mockWindow.assertSelectedItem().count(60)
      mockWindow.assertSlot(0).count(64)
    })

    it('drop selected Item into empty slot', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSelectedItem(1, firstStackId)

      mockWindow.executeClick(0, 0, 0)

      mockWindow.assertSelectedItem().empty()
      mockWindow.assertSlot(0).notEmpty().count(1).type(firstStackId)
    })
  })
})

describe('mode 1 | shift click', () => {
  describe('mouseButton 0', () => {
    it('shift out of chest into inventory', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSlot(0, 64, firstStackId)

      mockWindow.executeClick(1, 0, 0)

      mockWindow.assertSlot(0).empty()
      mockWindow.assertSlot(-1).notEmpty().count(64).type(firstStackId)
    })

    it('shift out of inventory into chest', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSlot(-1, 64, firstStackId)

      mockWindow.executeClick(1, 0, -1)

      mockWindow.assertSlot(0).notEmpty().count(64).type(firstStackId)
      mockWindow.assertSlot(-1).empty()
    })

    it.skip('shift out of inventory into armor slot (unimplemented)', () => {
      const someBoots = registry.itemsByName.leather_boots.id
      const mockWindow = createMockWindow('inventory')
        .prepareSlot(-1, 1, someBoots)

      mockWindow.executeClick(1, 0, -1)

      // 8 is the slot for boots
      mockWindow.assertSlot(8).notEmpty().type(someBoots).count(1)
      mockWindow.assertSlot(8).empty()
    })
  })
})

describe('mode 2 | number click', () => {
  describe('mouseButton 0', () => {
    it('from full slot into empty slot', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSlot(0, 64, firstStackId)

      // mouseButton 0 = hotbarStart
      // slot 0 = windowStart
      mockWindow.executeClick(2, 0, 0)

      mockWindow.assertSlot(-9).notEmpty().count(64).type(firstStackId)
      mockWindow.assertSlot(0).empty()
    })

    it('from empty slot into full slot', () => {
      const mockWindow = createMockWindow('chest')
        // -9 = hotbarStart
        .prepareSlot(-9, 64, firstStackId)

      // mouseButton 0 = hotbarStart
      // slot 0 = windowStart
      mockWindow.executeClick(2, 0, 0)

      mockWindow.assertSlot(-9).empty()
      mockWindow.assertSlot(0).notEmpty().count(64).type(firstStackId)
    })

    it('from slot with item to slot with same item', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSlot(-9, 32, firstStackId)
        .prepareSlot(0, 32, firstStackId)

      mockWindow.executeClick(2, 0, 0)

      if (registry.version['>=']('1.9')) {
        // expect nothing to happen
      } else {
        mockWindow.assertSlot(0).empty()
        mockWindow.assertSlot(-9).notEmpty().count(64).type(firstStackId)
      }
    })

    it('from slot with item to slot with different item', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSlot(0, 64, firstStackId)
        .prepareSlot(-1, 64, secondStackId)

      // mouseButton 8 = hotbarEnd
      // slot 0 = windowStart
      mockWindow.executeClick(2, 8, 0)

      if (registry.version['>=']('1.9')) {
        mockWindow.assertSlot(0).notEmpty().count(64).type(secondStackId)
        mockWindow.assertSlot(-1).notEmpty().count(64).type(firstStackId)
      } else {
        mockWindow.assertSlot(0).empty()
        mockWindow.assertSlot(-1).notEmpty().count(64).type(firstStackId)
        mockWindow.assertSlot(-9).notEmpty().count(64).type(secondStackId)
      }
    })
  })
})

describe('mode 3 | middle click', () => {
  describe('mouseButton 2', () => {
    it('get stack into selectedItem (gamemode 0)', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSlot(0, 1, firstStackId)

      mockWindow.executeClick(3, 2, 0)

      // expect no change
    })

    it('get stack into selectedItem (gamemode 1)', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSlot(0, 1, firstStackId)

      mockWindow.executeClick(3, 2, 0, /* gamemode = */1)

      mockWindow.assertSelectedItem().notEmpty().count(64).type(firstStackId)
    })
  })
})

describe('mode 4 | drop click', () => {
  describe('mouseButton 0', () => {
    it('drop 1 of stack', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSlot(0, 64, firstStackId)

      mockWindow.executeClick(4, 0, 0)

      mockWindow.assertSlot(0).notEmpty().count(64 - 1).type(firstStackId)
    })
  })

  describe('mouseButton 1', () => {
    it('drop full stack', () => {
      const mockWindow = createMockWindow('chest')
        .prepareSlot(0, 64, firstStackId)

      mockWindow.executeClick(4, 1, 0)

      mockWindow.assertSlot(0).empty()
    })
  })
})
