extends Node
## Manages player inventory: items, weight, and item data.

signal item_added(item_id: String)
signal item_removed(item_id: String)
signal inventory_changed()
signal weight_changed(current: int, max_weight: int)

const ITEM_DATA_PATH := "res://resources/items/item_data.json"
const MAX_WEIGHT := 100

var items: Array[String] = []  # List of item IDs currently held
var item_data: Dictionary = {}  # item_id -> item definition from JSON
var current_weight: int = 0

# Items dropped on the ground, keyed by room_id -> [item_ids]
var ground_items: Dictionary = {}


func _ready() -> void:
	_load_item_data()


func _load_item_data() -> void:
	if not FileAccess.file_exists(ITEM_DATA_PATH):
		push_warning("Item data file not found: %s" % ITEM_DATA_PATH)
		return
	var file := FileAccess.open(ITEM_DATA_PATH, FileAccess.READ)
	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	if err != OK:
		push_error("Failed to parse item data: %s" % json.get_error_message())
		return
	item_data = json.data


func get_item_info(item_id: String) -> Dictionary:
	return item_data.get(item_id, {})


func get_item_weight(item_id: String) -> int:
	var info := get_item_info(item_id)
	return info.get("weight", 1)


func get_item_name(item_id: String) -> String:
	var info := get_item_info(item_id)
	return info.get("name", item_id.replace("_", " ").capitalize())


func can_carry(item_id: String) -> bool:
	var item_weight := get_item_weight(item_id)
	return current_weight + item_weight <= MAX_WEIGHT


func add_item(item_id: String) -> bool:
	if item_id in items:
		return false
	if not can_carry(item_id):
		NarratorManager.narrate_raw("Your load is too heavy. You'll need to drop something first.")
		return false
	items.append(item_id)
	current_weight += get_item_weight(item_id)
	item_added.emit(item_id)
	inventory_changed.emit()
	weight_changed.emit(current_weight, MAX_WEIGHT)
	return true


func remove_item(item_id: String) -> bool:
	var idx := items.find(item_id)
	if idx == -1:
		return false
	items.remove_at(idx)
	current_weight -= get_item_weight(item_id)
	item_removed.emit(item_id)
	inventory_changed.emit()
	weight_changed.emit(current_weight, MAX_WEIGHT)
	return true


func has_item(item_id: String) -> bool:
	return item_id in items


func drop_item(item_id: String, room_id: String = "") -> bool:
	if room_id.is_empty():
		room_id = RoomManager.current_room_id
	if not remove_item(item_id):
		return false
	if room_id not in ground_items:
		ground_items[room_id] = []
	ground_items[room_id].append(item_id)
	return true


func pickup_ground_item(item_id: String, room_id: String = "") -> bool:
	if room_id.is_empty():
		room_id = RoomManager.current_room_id
	if room_id not in ground_items:
		return false
	var idx: int = ground_items[room_id].find(item_id)
	if idx == -1:
		return false
	if not add_item(item_id):
		return false
	ground_items[room_id].remove_at(idx)
	return true


func get_ground_items(room_id: String = "") -> Array:
	if room_id.is_empty():
		room_id = RoomManager.current_room_id
	return ground_items.get(room_id, [])


func use_item_on(item_id: String, target_id: String) -> void:
	# This is dispatched to the current room's puzzle logic
	var room_container := RoomManager.room_container
	if room_container and room_container.get_child_count() > 0:
		var room := room_container.get_child(0)
		if room.has_method("on_use_item"):
			room.on_use_item(item_id, target_id)
		else:
			NarratorManager.narrate_raw("That doesn't seem to work.")
	else:
		NarratorManager.narrate_raw("That doesn't seem to work.")


func get_save_data() -> Dictionary:
	return {
		"items": items.duplicate(),
		"ground_items": ground_items.duplicate(true),
	}


func load_save_data(data: Dictionary) -> void:
	items.assign(data.get("items", []))
	ground_items = data.get("ground_items", {})
	current_weight = 0
	for item_id in items:
		current_weight += get_item_weight(item_id)
	inventory_changed.emit()
	weight_changed.emit(current_weight, MAX_WEIGHT)
