extends BaseRoom
## Gas Room - using open flame here causes an explosion death.


func _on_room_enter() -> void:
	room_id = "gas_room"
	room_name = "Gas Room"
	surface_type = "stone"
	# Warn if player has lit lantern
	if InventoryManager.has_item("brass_lantern") and LightingManager.lamp_on:
		NarratorManager.narrate_raw("The air here is thick with gas. Your lantern flame flickers dangerously. You should probably turn it off before something terrible happens.")


func _handle_use(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "gas_seep":
		NarratorManager.narrate_raw("You examine the gas seep more closely. The greenish haze is definitely flammable. Best not to introduce any sparks.")
	else:
		super._handle_use(hotspot)


func on_use_item(item_id: String, target_id: String) -> void:
	if item_id == "brass_lantern":
		NarratorManager.narrate_raw("You turn on the lantern. The gas ignites with a blinding flash.")
		DeathManager.trigger_death("explosion")
	else:
		super.on_use_item(item_id, target_id)
