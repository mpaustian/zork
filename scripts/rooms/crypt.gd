extends BaseRoom
## Crypt - the sarcophagus is a trap.


func _on_room_enter() -> void:
	room_id = "crypt"
	room_name = "Crypt"
	surface_type = "stone"


func _handle_use(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "sarcophagus":
		if GameManager.get_flag("sarcophagus_opened"):
			NarratorManager.narrate_raw("The sarcophagus is empty. You already learned that lesson.")
		else:
			GameManager.set_flag("sarcophagus_opened")
			NarratorManager.narrate_raw("You slide the heavy lid aside. Inside is... nothing. Just dust and bones. But as you lean in for a closer look, the lid slams shut behind you with supernatural force.")
			DeathManager.trigger_death("sarcophagus")
	else:
		super._handle_use(hotspot)
