extends Node
## Provides contextual hints when the player seems stuck.

signal hint_available()

const HINT_DELAY := 45.0  # Seconds before first hint
const HINT_ESCALATION := 30.0  # Seconds between hint tiers

var _room_timer: float = 0.0
var _current_room: String = ""
var _hints_given: int = 0  # 0=none, 1=vague, 2=moderate, 3=explicit

# Hint database: room_id -> [vague, moderate, explicit]
var hints: Dictionary = {
	"west_of_house": [
		"The house seems important. Maybe there's a way inside?",
		"The east side of the house might have an accessible entrance.",
		"Go east, then south or north, to find the east side of the house. Look for a window.",
	],
	"east_of_house": [
		"That window looks like it might open.",
		"Try using the window — it could be your way inside.",
		"Click the window to open it, then you can enter the kitchen.",
	],
	"living_room": [
		"Something about this room doesn't seem quite right. The floor, perhaps?",
		"That rug looks suspicious. What's underneath it?",
		"Use the rug to move it, revealing a trap door. Then use the trap door to open it.",
	],
	"troll_room": [
		"The troll respects strength. Do you have a weapon?",
		"The elvish sword might be useful here. Try using it on the troll.",
		"Drag the elvish sword onto the troll, or right-click the troll and choose attack while carrying the sword.",
	],
	"cyclops_room": [
		"The Cyclops can't be defeated by force. Think mythologically.",
		"There's a famous story about a hero who defeated a Cyclops with cleverness, not strength...",
		"Find the Odysseus scroll in the Studio (through the Mirror Rooms) and use it on the Cyclops.",
	],
	"loud_room": [
		"The noise makes everything impossible. What's causing it?",
		"The water from the dam is the source. Could you stop it?",
		"Drain the dam using the maintenance room controls (wrench + blue button), then return for the platinum bar.",
	],
	"altar": [
		"The altar has three indentations. They look like they're waiting for specific items.",
		"A bell, a book, and candles — find all three and place them here.",
		"The bell is in the Temple, the prayer book in the Dam Lobby, the candles near Hades Entrance.",
	],
	"gas_room": [
		"The air here smells dangerous. Open flames would be a bad idea.",
		"Make sure your lantern is OFF before entering. The torch is safe to use.",
		"Turn off your lantern (right-click it) and use the torch instead. The torch's magical flame doesn't ignite gas.",
	],
	"machine_room": [
		"The machine needs fuel to operate.",
		"Coal would work nicely in that hopper.",
		"Find the lump of coal in this room, then use it on the coal machine to create the torch.",
	],
	"aragain_falls": [
		"That rainbow is beautiful, but you can't walk on light... can you?",
		"Perhaps a magical item could make the rainbow more substantial?",
		"Find the sceptre in the Treasure Room and use it on the waterfall to solidify the rainbow.",
	],
	"maintenance_room": [
		"The buttons are stuck. They need mechanical persuasion.",
		"A wrench might loosen those rusted bolts.",
		"Pick up the wrench from this room, then use it on either button to loosen the mechanism.",
	],
}


func _ready() -> void:
	RoomManager.room_changed.connect(_on_room_changed)


func _process(delta: float) -> void:
	if GameManager.state != GameManager.GameState.PLAYING:
		return
	_room_timer += delta

	var threshold: float = HINT_DELAY + (_hints_given * HINT_ESCALATION)
	if _room_timer >= threshold and _hints_given < 3:
		if _current_room in hints:
			_offer_hint()


func _on_room_changed(_old: String, new_room: String) -> void:
	_current_room = new_room
	_room_timer = 0.0
	_hints_given = 0


func _offer_hint() -> void:
	if _current_room not in hints:
		return
	var room_hints: Array = hints[_current_room]
	if _hints_given >= room_hints.size():
		return
	var hint_text: String = room_hints[_hints_given]
	NarratorManager.narrate_raw("(Hint: %s)" % hint_text)
	_hints_given += 1
	hint_available.emit()


func request_hint() -> void:
	# Player can manually request a hint
	if _current_room in hints:
		var room_hints: Array = hints[_current_room]
		if _hints_given < room_hints.size():
			var hint_text: String = room_hints[_hints_given]
			NarratorManager.narrate_raw("(Hint: %s)" % hint_text)
			_hints_given += 1
		else:
			NarratorManager.narrate_raw("(The narrator has no further wisdom to offer about this location.)")
	else:
		NarratorManager.narrate_raw("(The narrator shrugs. Some things you must figure out for yourself.)")
