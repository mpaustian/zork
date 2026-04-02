extends Node2D
## Main scene controller. Wires up systems and starts the game.

const START_ROOM := "west_of_house"

@onready var room_container: Node2D = $RoomContainer


func _ready() -> void:
	# Connect room container to the room manager
	RoomManager.room_container = room_container

	# Start the game
	_start_new_game()


func _start_new_game() -> void:
	GameManager.state = GameManager.GameState.PLAYING
	RoomManager.go_to_room(START_ROOM)


func _input(event: InputEvent) -> void:
	# Tab to highlight all hotspots
	if event.is_action_pressed("highlight_hotspots"):
		_show_hotspots()
	elif event.is_action_released("highlight_hotspots"):
		_hide_hotspots()

	# Left-click on empty space = walk there
	if event.is_action_pressed("interact"):
		if GameManager.state != GameManager.GameState.PLAYING:
			return
		# Only walk if we didn't click a hotspot or UI
		if not _is_over_hotspot() and not _is_over_ui():
			var player := get_tree().get_first_node_in_group("player")
			if player and player.has_method("move_to"):
				player.move_to(get_global_mouse_position())


func _show_hotspots() -> void:
	if room_container.get_child_count() > 0:
		var room := room_container.get_child(0)
		if room.has_method("show_all_hotspots"):
			room.show_all_hotspots()


func _hide_hotspots() -> void:
	if room_container.get_child_count() > 0:
		var room := room_container.get_child(0)
		if room.has_method("hide_all_hotspots"):
			room.hide_all_hotspots()


func _is_over_hotspot() -> bool:
	var space := get_world_2d().direct_space_state
	var query := PhysicsPointQueryParameters2D.new()
	query.position = get_global_mouse_position()
	query.collide_with_areas = true
	query.collide_with_bodies = false
	var results := space.intersect_point(query)
	for result in results:
		if result["collider"] is Hotspot:
			return true
	return false


func _is_over_ui() -> bool:
	# Check if mouse is over UI elements
	var mouse_pos := get_viewport().get_mouse_position()
	# Top narrator area
	if mouse_pos.y < 48:
		return true
	# Bottom inventory area
	if mouse_pos.y > 320:
		return true
	return false
