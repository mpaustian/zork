extends BaseRoom
## Machine Room - the coal machine produces the torch (critical item).


func _on_room_enter() -> void:
	room_id = "machine_room"
	room_name = "Machine Room"
	surface_type = "stone"


func _handle_use(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "coal_machine":
		if GameManager.get_flag("torch_created"):
			NarratorManager.narrate_raw("The machine sits idle. It has already produced its masterwork.")
		else:
			NarratorManager.narrate_raw("The machine needs fuel. Perhaps something combustible in the input hopper?")
	else:
		super._handle_use(hotspot)


func on_use_item(item_id: String, target_id: String) -> void:
	if target_id == "coal_machine" and item_id == "coal":
		if not GameManager.get_flag("torch_created"):
			GameManager.set_flag("torch_created")
			InventoryManager.remove_item("coal")
			if InventoryManager.add_item("torch"):
				LightingManager.has_torch = true
				LightingManager.torch_lit = true
				LightingManager.active_light_source = LightingManager.LightSource.TORCH
				NarratorManager.narrate_raw("You dump the coal into the hopper. The machine rumbles to life with a sound like a dragon clearing its throat. Gears grind, steam hisses, and with a final dramatic CLUNK, a perfectly crafted torch slides out of the output chute, already lit with a steady, magical flame that will never go out.")
				GameManager.add_score(10)
				GameManager.advance_turn()
		else:
			NarratorManager.narrate_raw("The machine has already done its work.")
	else:
		super.on_use_item(item_id, target_id)
