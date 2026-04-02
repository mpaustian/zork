extends BaseRoom
## West of House - the iconic opening scene.


func _on_room_enter() -> void:
	room_id = "west_of_house"
	room_name = "West of House"
	surface_type = "grass"


func on_use_item(item_id: String, target_id: String) -> void:
	if target_id == "mailbox":
		if item_id == "leaflet":
			NarratorManager.narrate_raw("You already took the leaflet out of the mailbox. Putting it back seems counterproductive.")
		else:
			NarratorManager.narrate_raw("The mailbox politely declines your offering.")
	else:
		super.on_use_item(item_id, target_id)
