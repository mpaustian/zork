extends BaseRoom
## The Troll Room - combat encounter with the troll.


func _on_room_enter() -> void:
	room_id = "troll_room"
	room_name = "The Troll Room"
	surface_type = "stone"

	if GameManager.get_flag("troll_defeated"):
		NarratorManager.narrate("troll_already_defeated")
		# Remove troll hotspot or make it scenery
		for hotspot in _hotspots:
			if hotspot.hotspot_id == "troll":
				hotspot.queue_free()
				_hotspots.erase(hotspot)
				break


func _handle_attack(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "troll":
		if InventoryManager.has_item("elvish_sword"):
			_start_troll_combat()
		else:
			NarratorManager.narrate_raw("Attacking the troll with your bare hands seems inadvisable. He has an axe. You have regret.")
	else:
		super._handle_attack(hotspot)


func on_use_item(item_id: String, target_id: String) -> void:
	if target_id == "troll" and item_id == "elvish_sword":
		_start_troll_combat()
	elif target_id == "troll":
		NarratorManager.narrate_raw("The troll eyes your %s with contempt." % InventoryManager.get_item_name(item_id))
	else:
		super.on_use_item(item_id, target_id)


func _start_troll_combat() -> void:
	NarratorManager.narrate("troll_combat_start")
	GameManager.state = GameManager.GameState.COMBAT

	# Load and start the combat scene
	var combat_scene := load("res://scenes/combat/troll_combat.tscn")
	if combat_scene:
		var combat := combat_scene.instantiate()
		combat.combat_finished.connect(_on_combat_finished)
		add_child(combat)
	else:
		# Fallback: simple auto-resolve
		_resolve_combat_simple()


func _resolve_combat_simple() -> void:
	# Simple fallback if combat scene isn't available yet
	GameManager.set_flag("troll_defeated")
	NarratorManager.narrate("troll_defeated")
	GameManager.state = GameManager.GameState.PLAYING

	for hotspot in _hotspots:
		if hotspot.hotspot_id == "troll":
			hotspot.queue_free()
			_hotspots.erase(hotspot)
			break

	GameManager.advance_turn()


func _on_combat_finished(won: bool) -> void:
	if won:
		GameManager.set_flag("troll_defeated")
		NarratorManager.narrate("troll_defeated")

		for hotspot in _hotspots:
			if hotspot.hotspot_id == "troll":
				hotspot.queue_free()
				_hotspots.erase(hotspot)
				break
	else:
		DeathManager.trigger_death("troll")

	GameManager.state = GameManager.GameState.PLAYING
