const assert = require('assert')
const EventEmitter = require('events').EventEmitter

module.exports = (Item) => {
  return class Window extends EventEmitter {
    constructor (id, type, title, slotCount,
      inventorySlotsRange = { start: 27, end: 62 },
      craftingResultSlot = -1,
      requiresConfirmation = true) {
      super()
      this.id = id
      this.type = type
      this.title = title
      this.slots = new Array(slotCount).fill(null)
      this.inventoryStart = inventorySlotsRange.start
      this.inventoryEnd = inventorySlotsRange.end + 1
      this.hotbarStart = this.inventoryEnd - 9
      this.craftingResultSlot = craftingResultSlot
      this.requiresConfirmation = requiresConfirmation
      // in vanilla client, this is the item you are holding with the
      // mouse cursor
      this.selectedItem = null
    }

    acceptClick (click) {
      assert.ok(click.mouseButton >= 0 && click.slot >= 0 && click.slot < this.inventoryEnd || click.slot === -999, 'invalid operation')

      switch (click.mode) {
        case 0:
          assert.ok(click.mouseButton <= 2, 'invalid operation')
          this.mouseClick(click)
          break

        case 1:
          assert.ok(click.mouseButton <= 2, 'invalid operation')
          this.shiftClick(click)
          break

        case 2:
          assert.ok(click.mouseButton <= 8 && !this.selectedItem, 'invalid operation')
          assert.ok(false, 'unimplemented')
          this.numberClick(click)
          break

        case 3:
          assert.ok(click.mouseButton === 2 && !this.selectedItem, 'invalid operation')
          this.creativeClick(click)
          break

        case 4:
          assert.ok(click.mouseButton < 2 && !this.selectedItem, 'invalid operation')
          this.dropClick(click)
          break

        default:
          assert.ok(false, 'unimplemented')
      }
    }

    mouseClick (click) {
      if (click.slot === -999) {
        this.dropSelectedItem(!click.mouseButton)
      } else {
        const { item } = click
        if (!click.mouseButton) { // left click
          if (item && this.selectedItem && item.type === this.selectedItem.type && item.metadata === this.selectedItem.metadata) {
            this.fillSlotWithSelectedItem(item, true)
          } else {
            if (click.slot !== this.craftingResultSlot) {
              this.swapSelectedItem(item)
            } else if (!this.selectedItem) {
              this.swapSelectedItem(item)
            } else {
              assert.ok(false, 'invalid operation')
            }
          }
        } else { // right click
          if (this.selectedItem) {
            if (item) {
              if (item.type === this.selectedItem.type && item.metadata === this.selectedItem.metadata) {
                this.fillSlotWithSelectedItem(item, false)
              } else {
                this.swapSelectedItem(item)
              }
            } else {
              this.fillSlotWithSelectedItem(item, false)
            }
          } else if (item) {
            if (click.slot !== this.craftingResultSlot) {
              this.splitSlot(item)
            } else {
              this.swapSelectedItem(item)
            }
          }
        }
      }
    }

    shiftClick (click) {
      const { item } = click
      if (this.type === 'minecraft:inventory') {
        if (item.slot > this.hotbarStart) {
          this.fillAndDump(item, this.inventoryStart, this.inventoryEnd - 10)
        } else if (item.slot >= this.inventoryStart && item.slot < this.inventoryEnd - 10) {
          this.fillAndDump(item, this.hotbarStart, this.inventoryEnd)
        } else {
          this.fillAndDump(item, this.inventoryStart, this.inventoryEnd)
        }
      } else {
        if (item.slot < this.inventoryStart) {
          this.fillAndDump(item, this.inventoryStart, this.inventoryEnd)
        } else {
          this.fillAndDump(item, 0, this.inventoryStart - 1)
        }
      }
    }

    numberClick (click) { // unimplemented
      const { item } = click
      const hotbarSlot = this.hotbarStart + click.mouseButton
      const itemAtHotbarSlot = this.slots[hotbarSlot]
      if (item) {
        if (itemAtHotbarSlot) { // TODO: if version is somewhere over 1.8 just swap items

        } else {
          this.updateSlot(item.slot, null)
          this.updateSlot(hotbarSlot, item)
        }
      } else if (itemAtHotbarSlot) {
        this.updateSlot(item.slot, itemAtHotbarSlot)
        this.updateSlot(hotbarSlot, null)
      }
    }

    creativeClick (click) {
      const { item } = click
      this.selectedItem = new Item(item.type, item.stackSize, item.metadata, item.nbt)
    }

    dropClick (click) {
      if (!click.mouseButton) {
        if (!--click.item.count) this.updateSlot(click.slot, null)
      } else {
        this.updateSlot(click.slot, null)
      }
    }

    fillAndDump (item, start, end) {
      this.fillSlotsWithItem(this.findItemsRange(start, end, item.itemType, item.metadata, true, item.nbt), item)
      if (item) {
        this.dumpLeftover(item, start, end)
      }
    }

    fillSlotsWithItem (slots, item) {
      while (slots.length && item) {
        const matchingItem = slots.shift()
        
        this.fillSlotWithItem(matchingItem, true, item)
      }
    }

    fillSlotWithItem (item, everything, item2) {
      if (everything) {
        const newCount = item.count + (item2?.count || this.selectedItem.count)
        const leftover = newCount - item.stackSize
        if (leftover <= 0) {
          item.count = newCount
          if (item2) {
            item2 = null
          } else {
            this.selectedItem = null
          }
        } else {
          item.count = item.stackSize
          if (item2) {
            item2.count = leftover
          } else {
            this.selectedItem.count = leftover
          }
        }
      } else {
        if (!item) item = new Item(this.selectedItem.type, 0, this.selectedItem.metadata, this.selectedItem.nbt)
        if (item.count + 1 < item.stackSize) {
          item.count++
          if (!--this.selectedItem.count) this.selectedItem = null
        }
      }
    }

    dumpLeftover (item, start, end) {
      const firstEmptySlot = this.firstEmptySlotRange(start, end)
      if (firstEmptySlot !== null && firstEmptySlot !== this.craftingResultSlot) {
        this.updateSlot(firstEmptySlot, item)
        item = null
      }
    }

    splitSlot (item) {
      if (!item) return
      this.selectedItem = new Item(item.type, Math.ceil(item.count / 2), item.metadata, item.nbt)
      item.count -= this.selectedItem.count
      if (item.count === 0) this.updateSlot(item.slot, null)
    }

    swapSelectedItem (item) {
      this.updateSlot(item.slot, this.selectedItem)
      this.selectedItem = item
    }

    dropSelectedItem (all) {
      if (all) {
        this.selectedItem = null
      } else {
        if (!--this.selectedItem.count) this.selectedItem = null
      }
    }

    updateSlot (slot, newItem) {
      if (newItem) newItem.slot = slot
      const oldItem = this.slots[slot]
      this.slots[slot] = newItem
      this.emit('updateSlot', slot, oldItem, newItem)
      this.emit(`updateSlot:${slot}`, oldItem, newItem)
    }

    findItemsRange (start, end, itemType, metadata, notFull, nbt) {
      const items = []
      while (start < end) {
        const item = this.findItemRange(start, end, itemType, metadata, notFull, nbt)
        start = item.slot + 1
        if (item.slot !== this.craftingResultSlot) items.push(item)
      }
      return items.length ? items : null
    }

    findItemRange (start, end, itemType, metadata, notFull, nbt) {
      assert.notStrictEqual(itemType, null)
      for (let i = start; i < end; ++i) {
        const item = this.slots[i]
        if (
          item && itemType === item.type &&
          (metadata == null || metadata === item.metadata) &&
          (!notFull || item.count < item.stackSize) &&
          (nbt == null || JSON.stringify(nbt) === JSON.stringify(item.nbt))) {
          return item
        }
      }
      return null
    }

    findItemRangeName (start, end, itemName, metadata, notFull) {
      assert.notStrictEqual(itemName, null)
      for (let i = start; i < end; ++i) {
        const item = this.slots[i]
        if (item && itemName === item.name &&
          (metadata == null || metadata === item.metadata) &&
          (!notFull || item.count < item.stackSize)) {
          return item
        }
      }
      return null
    }

    findInventoryItem (item, metadata, notFull) {
      assert(typeof item === 'number' || typeof item === 'string' || typeof item === 'undefined', 'No valid type given')
      return typeof item === 'number'
        ? this.findItemRange(this.inventoryStart, this.inventoryEnd, item, metadata, notFull)
        : this.findItemRangeName(this.inventoryStart, this.inventoryEnd, item, metadata, notFull)
    }

    findContainerItem (item, metadata, notFull) {
      assert(typeof item === 'number' || typeof item === 'string' || typeof item === 'undefined', 'No valid type given')
      return typeof item === 'number'
        ? this.findItemRange(0, this.inventoryStart, item, metadata, notFull)
        : this.findItemRangeName(0, this.inventoryStart, item, metadata, notFull)
    }

    firstEmptySlotRange (start, end) {
      for (let i = start; i < end; ++i) {
        if (!this.slots[i]) return i
      }
      return null
    }

    firstEmptyHotbarSlot () {
      return this.firstEmptySlotRange(this.hotbarStart, this.inventoryEnd)
    }

    firstEmptyContainerSlot () {
      return this.firstEmptySlotRange(0, this.inventoryStart)
    }

    firstEmptyInventorySlot (hotbarFirst = true) {
      if (hotbarFirst) {
        const slot = this.firstEmptyHotbarSlot()
        if (slot !== null) return slot
      }
      return this.firstEmptySlotRange(this.inventoryStart, this.inventoryEnd)
    }

    countRange (start, end, itemType, metadata) {
      let sum = 0
      for (let i = start; i < end; ++i) {
        const item = this.slots[i]
        if (item && itemType === item.type &&
          (metadata == null || item.metadata === metadata)) {
          sum += item.count
        }
      }
      return sum
    }

    itemsRange (start, end) {
      const results = []
      for (let i = start; i < end; ++i) {
        const item = this.slots[i]
        if (item) results.push(item)
      }
      return results
    }

    count (itemType, metadata) {
      itemType = parseInt(itemType, 10) // allow input to be string
      return this.countRange(this.inventoryStart, this.inventoryEnd, itemType, metadata)
    }

    items () {
      return this.itemsRange(this.inventoryStart, this.inventoryEnd)
    }

    containerCount (itemType, metadata) {
      itemType = parseInt(itemType, 10) // allow input to be string
      return this.countRange(0, this.inventoryStart, itemType, metadata)
    }

    containerItems () {
      return this.itemsRange(0, this.inventoryStart)
    }

    emptySlotCount () {
      let count = 0
      for (let i = this.inventoryStart; i < this.inventoryEnd; ++i) {
        if (!this.slots[i]) count += 1
      }
      return count
    }

    transactionRequiresConfirmation (click) {
      return this.requiresConfirmation
    }

    clear (blockId, count) {
      let clearedCount = 0

      const iterLoop = (currSlot) => {
        if (!currSlot || (blockId && currSlot.type !== blockId)) return false
        const blocksNeeded = count - clearedCount
        if (count && currSlot.count > blocksNeeded) { // stack is bigger then needed
          clearedCount += blocksNeeded
          this.updateSlot(currSlot.slot, new Item(blockId, currSlot.count - blocksNeeded, currSlot.metadata, currSlot.nbt))
        } else { // stack is just big enough or too little items to finish counter
          clearedCount += currSlot.count
          this.updateSlot(currSlot.slot, null)
        }
        if (count === clearedCount) return true // we have enough items
        return false
      }

      for (let i = this.inventoryEnd; i > this.hotbarStart - 1; i--) {
        if (iterLoop(this.slots[i])) break
      }

      if (clearedCount !== count) {
        for (let i = this.inventoryStart; i < this.hotbarStart; i++) {
          if (iterLoop(this.slots[i])) break
        }
      }

      return clearedCount
    }
  }
}
