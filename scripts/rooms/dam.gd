extends BaseRoom
## Flood Control Dam #3 - massive dam spanning an underground river.


func _on_room_enter() -> void:
	room_id = "dam"
	room_name = "Flood Control Dam #3"
	surface_type = "stone"


func _handle_use(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "dam_controls":
		NarratorManager.narrate_raw("The controls are rusted shut. Perhaps there's a maintenance room nearby with the proper tools.")
	else:
		super._handle_use(hotspot)
