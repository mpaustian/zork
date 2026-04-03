extends Node2D
class_name BaseRoom
## Base class for all room scenes. Handles hotspots, items on ground, and room-specific logic.

@export var room_id: String = ""
@export var room_name: String = ""
@export var surface_type: String = "stone"  # For footstep sounds: stone, wood, dirt, water, grass

var _hotspots: Array[Hotspot] = []
var _first_visit: bool = true


func _ready() -> void:
	# Replace solid color background with tiled art
	_apply_tiled_background()

	# Gather all hotspots in this room
	_hotspots = _find_hotspots(self)

	# Remove item hotspots for items already taken
	_remove_taken_items()

	# Connect hotspot signals
	for hotspot in _hotspots:
		hotspot.hotspot_clicked.connect(_on_hotspot_clicked)

	# Check if this is a first visit
	_first_visit = room_id not in RoomManager.visited_rooms

	# Spawn ground items
	_spawn_ground_items()

	# Narrate room entry
	NarratorManager.narrate_room_enter(room_id, _first_visit)

	# Set ambient audio
	var room_info := RoomManager.get_room_info(room_id)
	var ambient: String = room_info.get("ambient_sound", "")
	if not ambient.is_empty():
		AudioManager._crossfade_ambient(ambient)

	# Room-specific setup
	_on_room_enter()


func _on_room_enter() -> void:
	# Override in room-specific scripts
	pass


func _on_hotspot_clicked(hotspot: Hotspot, verb: String) -> void:
	match verb:
		"look":
			_handle_look(hotspot)
		"take":
			_handle_take(hotspot)
		"walk":
			_handle_walk(hotspot)
		"talk":
			_handle_talk(hotspot)
		"use":
			_handle_use(hotspot)
		"attack":
			_handle_attack(hotspot)
		"verb_coin":
			_show_verb_coin(hotspot)


func _handle_look(hotspot: Hotspot) -> void:
	if not hotspot.look_text.is_empty():
		NarratorManager.narrate_raw(hotspot.look_text)
	else:
		NarratorManager.narrate_look(hotspot.hotspot_id)


func _handle_take(hotspot: Hotspot) -> void:
	if hotspot.item_id.is_empty():
		NarratorManager.narrate_raw("You can't take that.")
		return
	if InventoryManager.add_item(hotspot.item_id):
		NarratorManager.narrate_raw("Taken.")
		hotspot.queue_free()
		_hotspots.erase(hotspot)
		GameManager.advance_turn()


func _handle_walk(hotspot: Hotspot) -> void:
	if hotspot.hotspot_type == Hotspot.HotspotType.EXIT:
		RoomManager.go(hotspot.exit_direction)


func _handle_talk(_hotspot: Hotspot) -> void:
	NarratorManager.narrate_raw("There's no response.")


func _handle_use(hotspot: Hotspot) -> void:
	NarratorManager.narrate_raw("You're not sure how to use that.")


func _handle_attack(hotspot: Hotspot) -> void:
	NarratorManager.narrate_raw("Violence isn't the answer. Well, not right now.")


func _show_verb_coin(hotspot: Hotspot) -> void:
	# Signal the UI to show verb coin at cursor position
	var verb_coin_ui := get_tree().get_first_node_in_group("verb_coin")
	if verb_coin_ui and verb_coin_ui.has_method("show_for_hotspot"):
		verb_coin_ui.show_for_hotspot(hotspot, get_global_mouse_position())


## Override this in room scripts to handle item-on-object interactions
func on_use_item(item_id: String, target_id: String) -> void:
	NarratorManager.narrate_use_fail(item_id, target_id)


func _remove_taken_items() -> void:
	# Remove scene-placed item hotspots if the item is already in inventory,
	# placed in the trophy case, or dropped on the ground elsewhere
	var to_remove: Array[Hotspot] = []
	for hotspot in _hotspots:
		if hotspot.hotspot_type != Hotspot.HotspotType.ITEM:
			continue
		if hotspot.item_id.is_empty():
			continue
		if InventoryManager.has_item(hotspot.item_id):
			to_remove.append(hotspot)
		elif hotspot.item_id in GameManager.treasures_placed:
			to_remove.append(hotspot)
		elif _is_item_on_ground_elsewhere(hotspot.item_id):
			to_remove.append(hotspot)
	for hotspot in to_remove:
		_hotspots.erase(hotspot)
		hotspot.queue_free()


func _is_item_on_ground_elsewhere(item_id: String) -> bool:
	for groom_id in InventoryManager.ground_items:
		var items: Array = InventoryManager.ground_items[groom_id]
		if item_id in items:
			return true
	return false


func _spawn_ground_items() -> void:
	var items := InventoryManager.get_ground_items(room_id)
	for item_id in items:
		_create_ground_item_sprite(item_id)


func _create_ground_item_sprite(item_id: String) -> void:
	# Create a simple hotspot for the ground item
	var hotspot := Hotspot.new()
	hotspot.hotspot_id = item_id
	hotspot.item_id = item_id
	hotspot.hotspot_type = Hotspot.HotspotType.ITEM
	hotspot.display_name = InventoryManager.get_item_name(item_id)

	var collision := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(16, 16)
	collision.shape = shape
	hotspot.add_child(collision)

	# Place it at a reasonable position (center-bottom of room)
	hotspot.position = Vector2(320, 300)
	add_child(hotspot)
	_hotspots.append(hotspot)
	hotspot.hotspot_clicked.connect(_on_hotspot_clicked)


const _RoomRenderer := preload("res://scripts/systems/room_renderer.gd")

func _apply_tiled_background() -> void:
	# Hide the old ColorRect background
	var bg: ColorRect = get_node_or_null("Background")
	if bg:
		bg.visible = false

	# Create tiled background using RoomRenderer
	var tiled_bg: Node2D = _RoomRenderer.create_room_background(room_id)
	add_child(tiled_bg)
	# Move it to the back
	move_child(tiled_bg, 0)


func _find_hotspots(node: Node) -> Array[Hotspot]:
	var result: Array[Hotspot] = []
	if node is Hotspot:
		result.append(node)
	for child in node.get_children():
		result.append_array(_find_hotspots(child))
	return result


func show_all_hotspots() -> void:
	for hotspot in _hotspots:
		if hotspot.highlight_on_tab:
			hotspot.show_highlight()


func hide_all_hotspots() -> void:
	for hotspot in _hotspots:
		hotspot.hide_highlight()
