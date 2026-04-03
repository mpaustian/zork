extends BaseRoom
## The Loud Room - echoes drown out everything unless the dam is drained.


func _on_room_enter() -> void:
	room_id = "loud_room"
	room_name = "Loud Room"
	surface_type = "stone"


func _handle_look(hotspot: Hotspot) -> void:
	if GameManager.get_flag("dam_drained"):
		super._handle_look(hotspot)
	else:
		NarratorManager.narrate_raw("The roar of the water is deafening. You can barely hear yourself think, let alone examine anything closely.")


func _handle_take(hotspot: Hotspot) -> void:
	if hotspot.item_id == "platinum_bar":
		if GameManager.get_flag("dam_drained"):
			super._handle_take(hotspot)
		else:
			NarratorManager.narrate_raw("The rushing water makes the room vibrate so violently you can't get a grip on anything.")
	else:
		super._handle_take(hotspot)
