extends BaseRoom
## Cyclops Room - puzzle encounter, not combat.


func _on_room_enter() -> void:
	room_id = "cyclops_room"
	room_name = "Cyclops Room"
	surface_type = "stone"

	if GameManager.get_flag("cyclops_fled"):
		NarratorManager.narrate_raw("The Cyclops room. A knocked-over chair and enormous footprints leading away are all that remain of its former occupant.")
		for hotspot in _hotspots:
			if hotspot.hotspot_id == "cyclops":
				hotspot.queue_free()
				_hotspots.erase(hotspot)
				break


func _handle_talk(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "cyclops":
		NarratorManager.narrate_raw("The Cyclops regards you with its enormous eye. \"HUNGRY,\" it says, in a voice like grinding boulders. Not the most stimulating conversationalist.")
	else:
		super._handle_talk(hotspot)


func on_use_item(item_id: String, target_id: String) -> void:
	if target_id == "cyclops":
		match item_id:
			"odysseus_scroll", "book_of_odyssey":
				# Player found the clue item and shows it to the Cyclops
				_cyclops_flees()
			"elvish_sword":
				NarratorManager.narrate_raw("You wave the sword at the Cyclops. It yawns. Your sword is, to this creature, approximately the size of a toothpick. A very pretty toothpick, but a toothpick nonetheless.")
			_:
				NarratorManager.narrate_raw("The Cyclops examines your %s with mild curiosity, then ignores it." % InventoryManager.get_item_name(item_id))
	else:
		super.on_use_item(item_id, target_id)


func _handle_attack(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "cyclops":
		NarratorManager.narrate_raw("You consider attacking the Cyclops. It is roughly four times your size, possesses the strength of a small earthquake, and is looking at you the way you look at a particularly crunchy snack. Perhaps there's a cleverer approach.")
	else:
		super._handle_attack(hotspot)


func _cyclops_flees() -> void:
	GameManager.set_flag("cyclops_fled")
	NarratorManager.narrate_raw("The Cyclops's single eye goes wide with terror. \"NOBODY!\" it shrieks — wait, that's not right. \"ODYSSEUS!\" The creature scrambles backward, knocking over furniture and crashing through the chamber in a blind panic. Within moments, the thundering footsteps fade into the distance. The stairway upward is clear.")

	for hotspot in _hotspots:
		if hotspot.hotspot_id == "cyclops":
			hotspot.queue_free()
			_hotspots.erase(hotspot)
			break

	AudioManager.play_sfx("cyclops_flee")
	GameManager.advance_turn()
