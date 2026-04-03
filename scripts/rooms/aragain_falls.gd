extends BaseRoom
## Aragain Falls - wave the sceptre to solidify the rainbow.


func _on_room_enter() -> void:
	room_id = "aragain_falls"
	room_name = "Aragain Falls"
	surface_type = "stone"


func on_use_item(item_id: String, target_id: String) -> void:
	if item_id == "sceptre" and target_id == "waterfall":
		if not GameManager.get_flag("rainbow_solid"):
			GameManager.set_flag("rainbow_solid")
			NarratorManager.narrate_raw("You wave the sceptre at the falls. The rainbow shimmers, brightens, and solidifies into a gleaming bridge of light. You could walk across it now.")
			GameManager.add_score(10)
			GameManager.advance_turn()
		else:
			NarratorManager.narrate_raw("The rainbow is already solid. You admire your handiwork.")
	else:
		super.on_use_item(item_id, target_id)
