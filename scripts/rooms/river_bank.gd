extends BaseRoom
## River Bank - inflate the raft with the air pump.


func _on_room_enter() -> void:
	room_id = "river_bank"
	room_name = "River Bank"
	surface_type = "dirt"

	# Update raft hotspot based on state
	if GameManager.get_flag("raft_inflated"):
		for hotspot in _hotspots:
			if hotspot.hotspot_id == "raft_deflated":
				hotspot.display_name = "Inflated Raft"
				hotspot.look_text = "The rubber raft bobs gently at the water's edge, fully inflated and ready for adventure. Or misadventure."
				hotspot.hotspot_type = Hotspot.HotspotType.ITEM
				hotspot.item_id = "raft"
				break


func _handle_use(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "raft_deflated":
		if GameManager.get_flag("raft_inflated"):
			NarratorManager.narrate_raw("The raft is already inflated. It sits there, smugly buoyant.")
		else:
			NarratorManager.narrate_raw("The raft is flat as a pancake. You'd need some way to inflate it.")
	else:
		super._handle_use(hotspot)


func on_use_item(item_id: String, target_id: String) -> void:
	if target_id == "raft_deflated" and item_id == "air_pump":
		if not GameManager.get_flag("raft_inflated"):
			GameManager.set_flag("raft_inflated")
			NarratorManager.narrate_raw("You attach the pump to the raft's valve and begin pumping. After considerable effort and a few choice words, the raft swells to its full size. It looks... mostly seaworthy.")
			# Update the hotspot
			for hotspot in _hotspots:
				if hotspot.hotspot_id == "raft_deflated":
					hotspot.display_name = "Inflated Raft"
					hotspot.look_text = "The rubber raft bobs gently, fully inflated and ready for adventure."
					hotspot.hotspot_type = Hotspot.HotspotType.ITEM
					hotspot.item_id = "raft"
					break
			GameManager.advance_turn()
		else:
			NarratorManager.narrate_raw("The raft is already inflated.")
	else:
		super.on_use_item(item_id, target_id)
