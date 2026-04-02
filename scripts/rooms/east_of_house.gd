extends BaseRoom
## Behind the house - the window puzzle.


func _on_room_enter() -> void:
	room_id = "east_of_house"
	room_name = "Behind House"
	surface_type = "grass"

	# Update window hotspot based on state
	if GameManager.get_flag("window_open"):
		_update_window_open()


func _handle_use(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "window":
		if not GameManager.get_flag("window_open"):
			GameManager.set_flag("window_open")
			NarratorManager.narrate("window_opened")
			_update_window_open()
			GameManager.advance_turn()
		else:
			NarratorManager.narrate_raw("The window is already open.")
	else:
		super._handle_use(hotspot)


func _update_window_open() -> void:
	# Update the window hotspot to be an exit
	for hotspot in _hotspots:
		if hotspot.hotspot_id == "window":
			hotspot.hotspot_type = Hotspot.HotspotType.EXIT
			hotspot.exit_direction = "west"
			hotspot.look_text = "The window is open. You can see the kitchen inside."
			break
