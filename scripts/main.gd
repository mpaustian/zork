extends Node2D
## Main scene controller. Wires up systems and starts the game.

const START_ROOM := "west_of_house"

@onready var room_container: Node2D = $RoomContainer


func _ready() -> void:
	# Connect room container to the room manager
	RoomManager.room_container = room_container

	# Wait for title screen
	GameManager.state = GameManager.GameState.MENU
	var title_screen: Node = get_tree().get_first_node_in_group("title_screen")
	if title_screen:
		title_screen.new_game_requested.connect(_start_new_game)
		title_screen.continue_requested.connect(_continue_game)
	else:
		_start_new_game()


func _start_new_game() -> void:
	GameManager.state = GameManager.GameState.PLAYING
	RoomManager.go_to_room(START_ROOM)


func _continue_game() -> void:
	SaveManager.load_game()
	GameManager.state = GameManager.GameState.PLAYING


func _input(event: InputEvent) -> void:
	# Tab to highlight all hotspots
	if event.is_action_pressed("highlight_hotspots"):
		_show_hotspots()
	elif event.is_action_released("highlight_hotspots"):
		_hide_hotspots()

	if GameManager.state != GameManager.GameState.PLAYING:
		return

	# Keyboard navigation
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_W, KEY_UP:
				RoomManager.go("north")
				get_viewport().set_input_as_handled()
				return
			KEY_S, KEY_DOWN:
				RoomManager.go("south")
				get_viewport().set_input_as_handled()
				return
			KEY_A, KEY_LEFT:
				RoomManager.go("west")
				get_viewport().set_input_as_handled()
				return
			KEY_D, KEY_RIGHT:
				RoomManager.go("east")
				get_viewport().set_input_as_handled()
				return
			KEY_Q:
				RoomManager.go("up")
				get_viewport().set_input_as_handled()
				return
			KEY_E:
				RoomManager.go("down")
				get_viewport().set_input_as_handled()
				return

	# Left-click: interact with hotspot or walk to location
	if event.is_action_pressed("interact"):
		var hotspot := _get_hotspot_under_cursor()
		if hotspot:
			hotspot.hotspot_clicked.emit(hotspot, _get_default_verb(hotspot))
		elif not _is_over_ui():
			var player := get_tree().get_first_node_in_group("player")
			if player and player.has_method("move_to"):
				player.move_to(get_global_mouse_position())

	# Right-click: show verb coin
	elif event.is_action_pressed("context_menu"):
		var hotspot := _get_hotspot_under_cursor()
		if hotspot:
			hotspot.hotspot_clicked.emit(hotspot, "verb_coin")


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


func _get_hotspot_under_cursor() -> Hotspot:
	var space := get_world_2d().direct_space_state
	var query := PhysicsPointQueryParameters2D.new()
	query.position = get_global_mouse_position()
	query.collide_with_areas = true
	query.collide_with_bodies = false
	var results := space.intersect_point(query)
	for result in results:
		var collider: Object = result["collider"]
		if collider is Hotspot:
			return collider as Hotspot
	return null


func _get_default_verb(hotspot: Hotspot) -> String:
	match hotspot.hotspot_type:
		Hotspot.HotspotType.EXIT:
			return "walk"
		Hotspot.HotspotType.ITEM:
			return "take"
		_:
			return "look"


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
