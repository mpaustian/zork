extends BaseRoom
## Maintenance Room - controls for the Flood Control Dam.


func _on_room_enter() -> void:
	room_id = "maintenance_room"
	room_name = "Maintenance Room"
	surface_type = "stone"


func _handle_use(hotspot: Hotspot) -> void:
	match hotspot.hotspot_id:
		"blue_button":
			if not GameManager.get_flag("dam_bolt_loosened"):
				NarratorManager.narrate_raw("The button is stuck. The mechanism seems seized up. Perhaps a tool could help.")
			elif GameManager.get_flag("dam_drained"):
				NarratorManager.narrate_raw("The reservoir is already empty.")
			else:
				GameManager.set_flag("dam_drained")
				GameManager.clear_flag("dam_filled")
				NarratorManager.narrate_raw("You press the blue button. A great rumbling sound echoes through the dam as the sluice gates open. The water level in the reservoir begins to drop. The roar from below gradually fades to silence.")
				GameManager.add_score(5)
				GameManager.advance_turn()
		"yellow_button":
			if not GameManager.get_flag("dam_bolt_loosened"):
				NarratorManager.narrate_raw("The button is stuck. The mechanism seems seized up.")
			elif GameManager.get_flag("dam_filled"):
				NarratorManager.narrate_raw("The reservoir is already full.")
			else:
				GameManager.set_flag("dam_filled")
				GameManager.clear_flag("dam_drained")
				NarratorManager.narrate_raw("You press the yellow button. The sluice gates close with a thunderous clang. Water begins to fill the reservoir once more.")
				GameManager.advance_turn()
		_:
			super._handle_use(hotspot)


func on_use_item(item_id: String, target_id: String) -> void:
	if item_id == "wrench" and (target_id == "blue_button" or target_id == "yellow_button"):
		if not GameManager.get_flag("dam_bolt_loosened"):
			GameManager.set_flag("dam_bolt_loosened")
			NarratorManager.narrate_raw("With considerable effort, you use the wrench to loosen the rusted bolts on the control panel. The buttons now move freely.")
			GameManager.advance_turn()
		else:
			NarratorManager.narrate_raw("The bolts are already loosened.")
	else:
		super.on_use_item(item_id, target_id)
