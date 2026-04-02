extends Node
## Manages the lamp/torch light system and Grue darkness detection.

signal lamp_state_changed(state: LampState)
signal lamp_fuel_changed(fuel: int, max_fuel: int)
signal darkness_entered()
signal darkness_warning()
signal grue_attack()

enum LampState { OFF, BRIGHT, WARM, FLICKERING, SPUTTERING, DEAD }
enum LightSource { NONE, LAMP, TORCH }

const MAX_LAMP_FUEL := 400
const LAMP_BRIGHT_THRESHOLD := 300
const LAMP_WARM_THRESHOLD := 150
const LAMP_FLICKER_THRESHOLD := 50
const LAMP_SPUTTER_THRESHOLD := 15

var lamp_fuel: int = MAX_LAMP_FUEL
var lamp_state: LampState = LampState.OFF
var lamp_on: bool = false
var has_torch: bool = false
var torch_lit: bool = false
var active_light_source: LightSource = LightSource.NONE
var turns_in_darkness: int = 0


func _ready() -> void:
	GameManager.turn_advanced.connect(_on_turn_advanced)
	RoomManager.room_changed.connect(_on_room_changed)


func _on_turn_advanced(_turn: int) -> void:
	if lamp_on and lamp_fuel > 0:
		lamp_fuel -= 1
		_update_lamp_state()
		lamp_fuel_changed.emit(lamp_fuel, MAX_LAMP_FUEL)

	_check_darkness()


func _on_room_changed(_old: String, _new: String) -> void:
	turns_in_darkness = 0
	_check_darkness()


func toggle_lamp() -> void:
	if lamp_fuel <= 0:
		NarratorManager.narrate_raw("The lamp has run out of fuel. It flickers and dies.")
		lamp_on = false
		_update_lamp_state()
		return
	lamp_on = not lamp_on
	_update_lamp_state()
	if lamp_on:
		NarratorManager.narrate_raw("The brass lantern is now on.")
	else:
		NarratorManager.narrate_raw("The brass lantern is now off.")


func light_torch() -> void:
	if has_torch:
		torch_lit = true
		active_light_source = LightSource.TORCH
		NarratorManager.narrate_raw("The torch burns with a steady, eternal flame.")


func has_light() -> bool:
	if torch_lit:
		return true
	if lamp_on and lamp_fuel > 0:
		return true
	return false


func _update_lamp_state() -> void:
	var old_state := lamp_state
	if not lamp_on or lamp_fuel <= 0:
		lamp_state = LampState.DEAD if lamp_fuel <= 0 else LampState.OFF
		if lamp_on and lamp_fuel <= 0:
			lamp_on = false
	elif lamp_fuel > LAMP_BRIGHT_THRESHOLD:
		lamp_state = LampState.BRIGHT
	elif lamp_fuel > LAMP_WARM_THRESHOLD:
		lamp_state = LampState.WARM
	elif lamp_fuel > LAMP_FLICKER_THRESHOLD:
		lamp_state = LampState.FLICKERING
	elif lamp_fuel > 0:
		lamp_state = LampState.SPUTTERING

	_update_active_source()

	if lamp_state != old_state:
		lamp_state_changed.emit(lamp_state)
		_narrate_lamp_change()


func _update_active_source() -> void:
	if torch_lit:
		active_light_source = LightSource.TORCH
	elif lamp_on and lamp_fuel > 0:
		active_light_source = LightSource.LAMP
	else:
		active_light_source = LightSource.NONE


func _narrate_lamp_change() -> void:
	match lamp_state:
		LampState.WARM:
			NarratorManager.narrate_raw("The lamp seems a bit dimmer now.")
		LampState.FLICKERING:
			NarratorManager.narrate_raw("The lamp flickers uncertainly. It won't last much longer.")
		LampState.SPUTTERING:
			NarratorManager.narrate_raw("The lamp sputters and gasps. You can almost hear it begging for mercy.")
		LampState.DEAD:
			NarratorManager.narrate_raw("The lamp has finally given up the ghost. Darkness closes in around you.")


func _check_darkness() -> void:
	if not RoomManager.is_dark():
		turns_in_darkness = 0
		return

	if has_light():
		turns_in_darkness = 0
		return

	turns_in_darkness += 1
	if turns_in_darkness == 1:
		darkness_entered.emit()
		darkness_warning.emit()
		NarratorManager.narrate_raw("It is pitch black. You are likely to be eaten by a grue.")
	elif turns_in_darkness >= 2:
		grue_attack.emit()
		DeathManager.trigger_death("grue")


func get_light_intensity() -> float:
	if torch_lit:
		return 1.0
	match lamp_state:
		LampState.BRIGHT:
			return 1.0
		LampState.WARM:
			return 0.75
		LampState.FLICKERING:
			return 0.5
		LampState.SPUTTERING:
			return 0.25
		_:
			return 0.0


func get_save_data() -> Dictionary:
	return {
		"lamp_fuel": lamp_fuel,
		"lamp_on": lamp_on,
		"has_torch": has_torch,
		"torch_lit": torch_lit,
	}


func load_save_data(data: Dictionary) -> void:
	lamp_fuel = data.get("lamp_fuel", MAX_LAMP_FUEL)
	lamp_on = data.get("lamp_on", false)
	has_torch = data.get("has_torch", false)
	torch_lit = data.get("torch_lit", false)
	_update_lamp_state()
