extends BaseRoom
## Cliff Edge - falling death if player tries to climb down without rope.


func _on_room_enter() -> void:
	room_id = "cliff_edge"
	room_name = "Cliff Edge"
	surface_type = "stone"


func _handle_use(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "precipice":
		if InventoryManager.has_item("rope"):
			NarratorManager.narrate_raw("You could tie the rope here, but there doesn't seem to be anywhere useful to climb to. The canyon path is the safer route.")
		else:
			NarratorManager.narrate_raw("You lean over the edge for a closer look. The wind catches you off-balance—")
			DeathManager.trigger_death("fall")
	else:
		super._handle_use(hotspot)
