extends BaseRoom
## The Living Room - trophy case, rug/trap door puzzle.


func _on_room_enter() -> void:
	room_id = "living_room"
	room_name = "Living Room"
	surface_type = "wood"

	# Update rug/trap door state
	if GameManager.get_flag("rug_moved"):
		_show_trap_door()
	if GameManager.get_flag("trap_door_open"):
		_open_trap_door()


func _handle_use(hotspot: Hotspot) -> void:
	match hotspot.hotspot_id:
		"oriental_rug":
			if not GameManager.get_flag("rug_moved"):
				GameManager.set_flag("rug_moved")
				NarratorManager.narrate("rug_moved")
				_show_trap_door()
				GameManager.advance_turn()
			else:
				NarratorManager.narrate_raw("You've already moved the rug. It's not going to un-reveal the trap door.")
		"trap_door":
			if not GameManager.get_flag("trap_door_open"):
				GameManager.set_flag("trap_door_open")
				NarratorManager.narrate("trap_door_opened")
				_open_trap_door()
				GameManager.advance_turn()
			else:
				NarratorManager.narrate_raw("The trap door is already open.")
		"trophy_case":
			_try_place_treasure()
		_:
			super._handle_use(hotspot)


func on_use_item(item_id: String, target_id: String) -> void:
	if target_id == "trophy_case":
		_try_place_treasure_item(item_id)
	else:
		super.on_use_item(item_id, target_id)


func _show_trap_door() -> void:
	# Make trap door hotspot visible/active
	for hotspot in _hotspots:
		if hotspot.hotspot_id == "trap_door":
			hotspot.visible = true
			break


func _open_trap_door() -> void:
	# Update the "down" exit
	for hotspot in _hotspots:
		if hotspot.hotspot_id == "trap_door":
			hotspot.hotspot_type = Hotspot.HotspotType.EXIT
			hotspot.exit_direction = "down"
			hotspot.look_text = "An open trap door reveals a dark stairway leading down."
			break


func _try_place_treasure() -> void:
	# Check if player has any treasures
	var treasures := []
	for item_id in InventoryManager.items:
		var info := InventoryManager.get_item_info(item_id)
		if info.get("type", "") == "treasure":
			treasures.append(item_id)

	if treasures.is_empty():
		NarratorManager.narrate_raw("You have no treasures to place. The trophy case sighs with disappointment.")
		return

	# Place the first treasure found
	_try_place_treasure_item(treasures[0])


func _try_place_treasure_item(item_id: String) -> void:
	var info := InventoryManager.get_item_info(item_id)
	if info.get("type", "") != "treasure":
		NarratorManager.narrate_raw("The trophy case is for treasures, not... whatever that is.")
		return

	var value: int = info.get("value", 0)
	if InventoryManager.remove_item(item_id):
		GameManager.place_treasure(item_id, value)
		var item_name: String = info.get("name", item_id)
		NarratorManager.narrate("treasure_placed", {"item": item_name})
		AudioManager.play_sting("treasure_placed")
