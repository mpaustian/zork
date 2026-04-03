extends BaseRoom
## The Altar - bell/book/candle puzzle to access Hades.

var _items_placed: Array[String] = []


func _on_room_enter() -> void:
	room_id = "altar"
	room_name = "Altar"
	surface_type = "stone"
	# Restore placed items state
	_items_placed.clear()
	if GameManager.get_flag("altar_bell"):
		_items_placed.append("bell")
	if GameManager.get_flag("altar_book"):
		_items_placed.append("prayer_book")
	if GameManager.get_flag("altar_candles"):
		_items_placed.append("candles")


func _handle_use(hotspot: Hotspot) -> void:
	if hotspot.hotspot_id == "stone_altar":
		NarratorManager.narrate_raw("The altar seems to be waiting for something. The indentations suggest specific items belong here.")
	else:
		super._handle_use(hotspot)


func on_use_item(item_id: String, target_id: String) -> void:
	if target_id == "stone_altar":
		match item_id:
			"bell":
				if not GameManager.get_flag("altar_bell"):
					GameManager.set_flag("altar_bell")
					InventoryManager.remove_item("bell")
					_items_placed.append("bell")
					NarratorManager.narrate_raw("You place the bell in its indentation. It rings once, softly, of its own accord. The sound echoes longer than it should.")
					_check_ritual_complete()
				else:
					NarratorManager.narrate_raw("The bell is already on the altar.")
			"prayer_book":
				if not GameManager.get_flag("altar_book"):
					GameManager.set_flag("altar_book")
					InventoryManager.remove_item("prayer_book")
					_items_placed.append("prayer_book")
					NarratorManager.narrate_raw("You set the prayer book open on the altar. The pages flutter as if caught in a wind you cannot feel, settling on a passage written in a language older than memory.")
					_check_ritual_complete()
				else:
					NarratorManager.narrate_raw("The book is already on the altar.")
			"candles":
				if not GameManager.get_flag("altar_candles"):
					GameManager.set_flag("altar_candles")
					InventoryManager.remove_item("candles")
					_items_placed.append("candles")
					NarratorManager.narrate_raw("You place the candles in the circular indentations. They ignite spontaneously with pale blue flames that cast no warmth.")
					_check_ritual_complete()
				else:
					NarratorManager.narrate_raw("The candles are already on the altar.")
			_:
				NarratorManager.narrate_raw("The altar rejects your offering. It has very specific tastes.")
	else:
		super.on_use_item(item_id, target_id)


func _check_ritual_complete() -> void:
	if _items_placed.size() >= 3:
		GameManager.set_flag("spirits_banished")
		GameManager.add_score(15)
		NarratorManager.narrate_raw("The bell tolls, the pages turn, the candles flare — and a wave of light sweeps through the temple. A shriek echoes from below as the spirits guarding the entrance to Hades are banished. The way down is now open.")
