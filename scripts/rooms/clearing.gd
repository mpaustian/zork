extends BaseRoom
## Clearing - a forest clearing with a massive tree. The egg is in the nest up in the branches.


func _on_room_enter() -> void:
	room_id = "clearing"
	room_name = "Clearing"
	surface_type = "grass"

	# Spawn egg in tree if not yet taken
	if not GameManager.get_flag("egg_taken_from_tree"):
		_ensure_egg_in_tree()


func _handle_use(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "bird_nest":
		if not GameManager.get_flag("egg_taken_from_tree"):
			GameManager.set_flag("egg_taken_from_tree")
			if InventoryManager.add_item("jewel_encrusted_egg"):
				NarratorManager.narrate_raw("You clamber up the enormous tree, bark scraping your palms, until you reach a nest wedged in a high fork. Inside sits a jewel-encrusted egg, glinting even in the dappled shade. You pocket it carefully and climb back down.")
				GameManager.advance_turn()
		else:
			NarratorManager.narrate_raw("The nest is empty. You already took the egg.")
	else:
		super._handle_use(hotspot)


func _ensure_egg_in_tree() -> void:
	for hotspot in _hotspots:
		if hotspot.hotspot_id == "bird_nest":
			hotspot.look_text = "An enormous tree dominates the clearing. High in its branches, you can just make out a nest — and something glinting inside it."
			return
