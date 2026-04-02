extends Node
## Manages room transitions, tracks visited rooms, and handles the automap.

signal room_changed(old_room_id: String, new_room_id: String)
signal room_transition_started(target_room_id: String)
signal room_transition_finished(room_id: String)

const ROOM_DATA_PATH := "res://resources/rooms/room_data.json"
const ROOM_SCENE_DIR := "res://scenes/rooms/"

var current_room_id: String = ""
var room_data: Dictionary = {}  # room_id -> room definition from JSON
var visited_rooms: Array[String] = []
var _room_scene_cache: Dictionary = {}

@onready var room_container: Node = null  # Set by main scene


func _ready() -> void:
	_load_room_data()


func _load_room_data() -> void:
	if not FileAccess.file_exists(ROOM_DATA_PATH):
		push_warning("Room data file not found: %s" % ROOM_DATA_PATH)
		return
	var file := FileAccess.open(ROOM_DATA_PATH, FileAccess.READ)
	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	if err != OK:
		push_error("Failed to parse room data: %s" % json.get_error_message())
		return
	room_data = json.data


func go_to_room(room_id: String, _direction: String = "") -> void:
	if room_id == current_room_id:
		return

	var old_room_id := current_room_id
	room_transition_started.emit(room_id)

	# Remove old room
	if room_container and room_container.get_child_count() > 0:
		var old_room := room_container.get_child(0)
		room_container.remove_child(old_room)
		old_room.queue_free()

	# Load and add new room
	var scene := _get_room_scene(room_id)
	if scene:
		var room_instance := scene.instantiate()
		room_instance.room_id = room_id
		if room_container:
			room_container.add_child(room_instance)

	current_room_id = room_id

	if room_id not in visited_rooms:
		visited_rooms.append(room_id)

	room_changed.emit(old_room_id, room_id)
	room_transition_finished.emit(room_id)

	GameManager.advance_turn()


func _get_room_scene(room_id: String) -> PackedScene:
	if room_id in _room_scene_cache:
		return _room_scene_cache[room_id]

	var scene_path := ROOM_SCENE_DIR + room_id + ".tscn"
	if ResourceLoader.exists(scene_path):
		var scene := load(scene_path) as PackedScene
		_room_scene_cache[room_id] = scene
		return scene

	push_warning("Room scene not found: %s" % scene_path)
	return null


func get_room_info(room_id: String) -> Dictionary:
	return room_data.get(room_id, {})


func get_exits(room_id: String = "") -> Dictionary:
	if room_id.is_empty():
		room_id = current_room_id
	var info := get_room_info(room_id)
	return info.get("exits", {})


func can_go(direction: String) -> bool:
	var exits := get_exits()
	if direction not in exits:
		return false
	var exit_info: Variant = exits[direction]
	if exit_info is String:
		return true
	if exit_info is Dictionary:
		var requires_flag: String = exit_info.get("requires_flag", "")
		if requires_flag and not GameManager.get_flag(requires_flag):
			return false
		return true
	return false


func go(direction: String) -> void:
	var exits := get_exits()
	if direction not in exits:
		NarratorManager.narrate("exit_blocked", {"direction": direction})
		return
	var exit_info: Variant = exits[direction]
	var target_room: String
	if exit_info is String:
		target_room = exit_info
	elif exit_info is Dictionary:
		var requires_flag: String = exit_info.get("requires_flag", "")
		if requires_flag and not GameManager.get_flag(requires_flag):
			var blocked_msg: String = exit_info.get("blocked_message", "You can't go that way.")
			NarratorManager.narrate_raw(blocked_msg)
			return
		target_room = exit_info.get("target", "")
	else:
		return

	if target_room.is_empty():
		return

	go_to_room(target_room, direction)


func is_dark(room_id: String = "") -> bool:
	if room_id.is_empty():
		room_id = current_room_id
	var info := get_room_info(room_id)
	return info.get("dark", false)


func get_save_data() -> Dictionary:
	return {
		"current_room_id": current_room_id,
		"visited_rooms": visited_rooms.duplicate(),
	}


func load_save_data(data: Dictionary) -> void:
	visited_rooms.assign(data.get("visited_rooms", []))
	var room_id: String = data.get("current_room_id", "west_of_house")
	go_to_room(room_id)
