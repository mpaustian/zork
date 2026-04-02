extends Node
## Handles death vignettes, the Grim Rewind, and the Death Gallery.

signal death_triggered(death_type: String)
signal rewind_started()
signal rewind_finished()

const DEATH_SCENE_PATH := "res://scenes/effects/death_vignette.tscn"
const REWIND_DURATION := 1.5

var death_gallery: Array[String] = []  # Unique death types witnessed
var _pre_death_save: Dictionary = {}
var _death_active: bool = false


func _ready() -> void:
	pass


func trigger_death(death_type: String) -> void:
	if _death_active:
		return
	_death_active = true

	# Save state before death for rewind
	_pre_death_save = _capture_state()

	# Record in gallery
	if death_type not in death_gallery:
		death_gallery.append(death_type)

	GameManager.state = GameManager.GameState.DEATH_SCENE
	death_triggered.emit(death_type)

	# Narrator delivers the death text
	NarratorManager.narrate_death(death_type)


func start_rewind() -> void:
	rewind_started.emit()
	# After rewind effect, restore state
	var tween := get_tree().create_tween()
	tween.tween_interval(REWIND_DURATION)
	tween.tween_callback(_finish_rewind)


func _finish_rewind() -> void:
	_restore_state(_pre_death_save)
	_death_active = false
	GameManager.state = GameManager.GameState.PLAYING
	rewind_finished.emit()


func _capture_state() -> Dictionary:
	return {
		"game": GameManager.get_save_data(),
		"room": RoomManager.get_save_data(),
		"inventory": InventoryManager.get_save_data(),
		"lighting": LightingManager.get_save_data(),
	}


func _restore_state(data: Dictionary) -> void:
	GameManager.load_save_data(data.get("game", {}))
	InventoryManager.load_save_data(data.get("inventory", {}))
	LightingManager.load_save_data(data.get("lighting", {}))
	RoomManager.load_save_data(data.get("room", {}))


func get_death_count() -> int:
	return death_gallery.size()


func has_seen_death(death_type: String) -> bool:
	return death_type in death_gallery


func get_save_data() -> Dictionary:
	return {
		"death_gallery": death_gallery.duplicate(),
	}


func load_save_data(data: Dictionary) -> void:
	death_gallery.assign(data.get("death_gallery", []))
