extends Node
## Handles save/load with auto-save on room transitions and manual save slots.

const SAVE_DIR := "user://saves/"
const AUTO_SAVE_FILE := "autosave.json"
const MAX_MANUAL_SLOTS := 10

var _auto_save_enabled := true


func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)
	RoomManager.room_transition_finished.connect(_on_room_entered)


func _on_room_entered(_room_id: String) -> void:
	if _auto_save_enabled:
		save_game(AUTO_SAVE_FILE)


func save_game(filename: String = AUTO_SAVE_FILE) -> bool:
	var save_data := {
		"version": 1,
		"timestamp": Time.get_datetime_string_from_system(),
		"game": GameManager.get_save_data(),
		"room": RoomManager.get_save_data(),
		"inventory": InventoryManager.get_save_data(),
		"lighting": LightingManager.get_save_data(),
		"narrator": NarratorManager.get_save_data(),
		"death": DeathManager.get_save_data(),
		"thief": ThiefManager.get_save_data(),
	}

	var path := SAVE_DIR + filename
	var file := FileAccess.open(path, FileAccess.WRITE)
	if not file:
		push_error("Could not open save file: %s" % path)
		return false

	file.store_string(JSON.stringify(save_data, "\t"))
	return true


func load_game(filename: String = AUTO_SAVE_FILE) -> bool:
	var path := SAVE_DIR + filename
	if not FileAccess.file_exists(path):
		push_warning("Save file not found: %s" % path)
		return false

	var file := FileAccess.open(path, FileAccess.READ)
	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	if err != OK:
		push_error("Failed to parse save file: %s" % json.get_error_message())
		return false

	var data: Dictionary = json.data
	GameManager.load_save_data(data.get("game", {}))
	InventoryManager.load_save_data(data.get("inventory", {}))
	LightingManager.load_save_data(data.get("lighting", {}))
	NarratorManager.load_save_data(data.get("narrator", {}))
	DeathManager.load_save_data(data.get("death", {}))
	ThiefManager.load_save_data(data.get("thief", {}))
	RoomManager.load_save_data(data.get("room", {}))
	return true


func get_save_slots() -> Array[Dictionary]:
	var slots: Array[Dictionary] = []
	var dir := DirAccess.open(SAVE_DIR)
	if not dir:
		return slots
	dir.list_dir_begin()
	var filename := dir.get_next()
	while not filename.is_empty():
		if filename.ends_with(".json"):
			var path := SAVE_DIR + filename
			var file := FileAccess.open(path, FileAccess.READ)
			if file:
				var json := JSON.new()
				if json.parse(file.get_as_text()) == OK:
					var data: Dictionary = json.data
					slots.append({
						"filename": filename,
						"timestamp": data.get("timestamp", ""),
						"room": data.get("room", {}).get("current_room_id", ""),
						"score": data.get("game", {}).get("score", 0),
					})
		filename = dir.get_next()
	return slots


func has_auto_save() -> bool:
	return FileAccess.file_exists(SAVE_DIR + AUTO_SAVE_FILE)
