extends Node
## The Thief - a roaming NPC who steals treasures and lurks in the underground.

signal thief_appeared(room_id: String)
signal thief_stole_item(item_id: String)
signal thief_fled(room_id: String)

const APPEAR_CHANCE := 0.15  # 15% chance per turn in underground rooms
const STEAL_CHANCE := 0.4  # 40% chance to steal a treasure when appearing
const SAFE_ROOMS: Array[String] = ["west_of_house", "north_of_house", "south_of_house", "east_of_house", "kitchen", "living_room", "attic", "forest_west", "forest_path", "clearing", "canyon_view", "rocky_ledge", "canyon_bottom"]

var thief_room: String = "treasure_room"  # Where the thief currently is
var stolen_items: Array[String] = []  # Items the thief has stolen
var thief_present: bool = false  # Is thief visible in current room
var thief_defeated: bool = false


func _ready() -> void:
	GameManager.turn_advanced.connect(_on_turn_advanced)
	RoomManager.room_changed.connect(_on_room_changed)


func _on_turn_advanced(_turn: int) -> void:
	if thief_defeated:
		return
	# Move thief randomly through underground rooms
	_move_thief()
	# Check if thief should appear in player's room
	_check_thief_encounter()


func _move_thief() -> void:
	# Thief wanders randomly through non-safe rooms
	var room_info: Dictionary = RoomManager.get_room_info(thief_room)
	var exits: Dictionary = room_info.get("exits", {})
	if exits.is_empty():
		return
	var directions: Array = exits.keys()
	var dir: String = directions[randi() % directions.size()]
	var target: Variant = exits[dir]
	var new_room: String = ""
	if target is String:
		new_room = target
	elif target is Dictionary:
		new_room = target.get("target", "")
	if not new_room.is_empty() and new_room not in SAFE_ROOMS:
		thief_room = new_room


func _check_thief_encounter() -> void:
	thief_present = false
	var current: String = RoomManager.current_room_id
	if current in SAFE_ROOMS:
		return
	# Thief appears if in same room OR random chance
	if thief_room == current or randf() < APPEAR_CHANCE:
		thief_present = true
		thief_room = current
		thief_appeared.emit(current)
		_thief_action()


func _thief_action() -> void:
	# Try to steal a treasure
	if randf() < STEAL_CHANCE:
		var treasures: Array[String] = []
		for item_id in InventoryManager.items:
			var info: Dictionary = InventoryManager.get_item_info(item_id)
			if info.get("type", "") == "treasure":
				treasures.append(item_id)
		if not treasures.is_empty():
			var stolen: String = treasures[randi() % treasures.size()]
			if InventoryManager.remove_item(stolen):
				stolen_items.append(stolen)
				var item_name: String = InventoryManager.get_item_name(stolen)
				NarratorManager.narrate_raw("A shadowy figure darts past you! The thief snatches the %s from your pack and vanishes into the darkness with a mocking laugh." % item_name)
				thief_stole_item.emit(stolen)
				return
	# If didn't steal, just appear and taunt
	var taunts: Array[String] = [
		"A cloaked figure steps from the shadows, eyes glinting. He looks you up and down, seems unimpressed, and melts back into the darkness.",
		"You catch a glimpse of movement — a shadowy figure watching from a doorway. By the time you turn, he's gone.",
		"The thief appears, tips his hat mockingly, and vanishes before you can react. You check your pockets. Everything seems to be there. This time.",
		"A soft chuckle echoes from somewhere nearby. The thief is here — or was. You can never quite tell.",
	]
	NarratorManager.narrate_raw(taunts[randi() % taunts.size()])


func _on_room_changed(_old: String, _new: String) -> void:
	thief_present = false


func defeat_thief() -> void:
	thief_defeated = true
	GameManager.set_flag("thief_defeated")
	# Drop all stolen items in current room
	for item_id in stolen_items:
		InventoryManager.ground_items.get_or_add(RoomManager.current_room_id, []).append(item_id)
	stolen_items.clear()
	NarratorManager.narrate_raw("The thief collapses with a theatrical groan. His stolen goods scatter across the floor. He won't be bothering you again.")
	GameManager.add_score(15)


func get_save_data() -> Dictionary:
	return {
		"thief_room": thief_room,
		"stolen_items": stolen_items.duplicate(),
		"thief_defeated": thief_defeated,
	}


func load_save_data(data: Dictionary) -> void:
	thief_room = data.get("thief_room", "treasure_room")
	stolen_items.assign(data.get("stolen_items", []))
	thief_defeated = data.get("thief_defeated", false)
