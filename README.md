# prismarine-windows

Represent minecraft windows

## Usage

```js
var windows=require("./")("1.8").windows;
var Item=require("prismarine-item")("1.8");

var inv=new windows.InventoryWindow(1,"inv",36);

inv.updateSlot(10,new Item(256,1));

console.log(inv.items());
```

## API

### windows.Window (base class)

#### window.id

#### window.type

#### window.title

"Inventory", "Chest", "Large chest", "Crafting", "Furnace", or "Trap"

#### window.slots

Map of slot index to `Item` instance.

#### window.selectedItem

In vanilla client, this is the item you are holding with the mouse cursor.

#### window.findInventoryItem(itemType, metadata, [notFull])

 * `itemType` - numerical id that you are looking for
 * `metadata` -  metadata value that you are looking for. `null`
   means unspecified.
 * `notFull` - (optional) - if `true`, means that the returned
   item should not be at its `stackSize`.

#### window.count(itemType, [metadata])

Returns how many you have in the inventory section of the window.

 * `itemType` - numerical id that you are looking for
 * `metadata` - (optional) metadata value that you are looking for.
   defaults to unspecified

#### window.items()

Returns a list of `Item` instances from the inventory section of the window.

#### window.emptySlotCount()

#### window "windowUpdate" (slot, oldItem, newItem)

Fired whenever any slot in the window changes for any reason.
Watching `bot.inventory.on("windowUpdate")` is the best way to watch for changes in your inventory.

 * `slot` - index of changed slot.
 * `oldItem`, `newItem` - either an [`Item`](#mineflayeritem) instance or `null`.

`newItem === window.slots[slot]`.

### windows.InventoryWindow
### windows.ChestWindow
### windows.CraftingTableWindow
### windows.FurnaceWindow
### windows.DispenserWindow
### windows.EnchantmentTableWindow
### windows.BrewingStandWindow
### windows.ContainerWindow

Generic window that can be opened by some non-Vanilla servers and Bukkit plugins like Essentials' /invsee.

#### window.containerCount(itemType, [metadata])
Returns how many items there are in the top section of the window.

 * `itemType` - numerical id that you are looking for
 * `metadata` - (optional) metadata value that you are looking for.
   defaults to unspecified

#### window.containerItems()

Returns a list of `Item` instances from the top section of the window.

## History

### 1.0.1

* bump mcdata

### 1.0.0

* bump dependencies

### 0.0.0

* Import from mineflayer