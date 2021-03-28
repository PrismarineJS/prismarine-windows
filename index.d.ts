/// <reference types="node" />
/// <reference types="prismarine-item" />

import {EventEmitter} from 'events';
import {Item} from 'prismarine-item';

declare class Window extends EventEmitter {
    constructor (id: number, type: number | string, title: string, slotCount: number, inventorySlotsRange: { start: number, end: number }, craftingResultSlot: number, requiresConfirmation: boolean);
    id: number;
    type: number | string;
    title: string;
    slots: Array<Item>;
    inventoryStart: number;
    inventoryEnd: number;
    craftingResultSlot: number;
    requiresConfirmation: boolean;
    selectedItem: Item | null;
    acceptClick(click: Click): void;
    mouseClick(click: Click): void;
    shiftClick(click: Click): void;
    numberClick(click: Click): void;
    dropClick(click: Click): void;
    fillAndDump(item: Item, start: number, end: number, lastToFirst: boolean): void;
    fillSlotsWithItem(slots: Array<Item>, item: Item, lastToFirst: boolean): void;
    fillSlotWithItem(itemToFill: Item, itemToTake: Item): void;
    fillSlotWithSelectedItem (item: Item, everything: boolean): void;
    dumpItem(item: Item, start: number, end: number, lastToFirst: boolean): void;
    splitSlot(item: Item): void;
    swapSelectedItem(item: Item): void;
    dropSelectedItem(all: boolean): void;
    updateSlot(slot: number, newItem: Item): void;
    findItemsRange(start: number, end: number, itemType: number, metadata: number | null, notFull: boolean, nbt: any): Array<Item> | null;
    findItemRange(start: number, end: number, itemType: number, metadata: number | null, notFull: boolean, nbt: any): Item | null;
    findItemRangeName(start: number, end: number, itemName: string, metadata: number, notFull: boolean): Item | null;
    findInventoryItem(itemType: number, metadata: number | null, notFull: boolean): Item | null;
    findContainerItem(item: Item, metadata: number, notFull: boolean): Item | null;
    firstEmptySlotRange(start: number, end: number): number | null;
    firstEmptyHotbarSlot(): number | null;
    firstEmptyContainerSlot(): number | null;
    firstEmptyInventorySlot(hotbarFirst: boolean): number | null;
    countRange(start: number, end: null, itemType: number, metadata: number | null): number;
    itemsRange(start: number, end: number): Array<Item>;
    count(itemType: number | string, metadata: number | null): number;
    items(): Array<Item>;
    emptySlotCount(): number;
    transactionRequiresConfirmation(click?: Click): boolean;
    clear(blockId?, count?): void;
}
declare interface Click {
    mode: number;
    mouseButton: number;
    slot: number;
}
declare interface WindowInfo {
    type: number | string;
    inventory: { start: number, end: number };
    slots: number;
    craft: number;
    requireConfirmation: boolean;
}

declare interface WindowsExports {
    createWindow(id: number, type: number | string, title: string, slotCount?: number): Window;
    Window: typeof Window;
    windows: {[key: string]: WindowInfo};
}
export declare function loader(mcVersion: string): WindowsExports;
