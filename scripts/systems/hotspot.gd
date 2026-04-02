extends Area2D
class_name Hotspot
## A clickable area in a room. Can be an item, exit, NPC, or interactive object.

signal hotspot_clicked(hotspot: Hotspot, verb: String)
signal hotspot_hovered(hotspot: Hotspot)
signal hotspot_unhovered(hotspot: Hotspot)

enum HotspotType { ITEM, EXIT, NPC, INTERACTIVE, SCENERY }

@export var hotspot_id: String = ""
@export var display_name: String = ""
@export var hotspot_type: HotspotType = HotspotType.SCENERY
@export var exit_direction: String = ""  # For EXIT type: n, s, e, w, up, down
@export var item_id: String = ""  # For ITEM type: which item to pick up
@export var walk_to_point: Vector2 = Vector2.ZERO  # Where player walks to interact
@export var look_text: String = ""  # Override narrator look text
@export var highlight_on_tab: bool = true  # Show when Tab is pressed

var _is_hovered := false
var _highlight_visible := false


func _ready() -> void:
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	input_event.connect(_on_input_event)

	if display_name.is_empty():
		display_name = hotspot_id.replace("_", " ").capitalize()


func _on_mouse_entered() -> void:
	_is_hovered = true
	hotspot_hovered.emit(self)


func _on_mouse_exited() -> void:
	_is_hovered = false
	hotspot_unhovered.emit(self)


func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	if GameManager.state != GameManager.GameState.PLAYING:
		return

	if event.is_action_pressed("interact"):
		# Left click - default action based on type
		match hotspot_type:
			HotspotType.EXIT:
				hotspot_clicked.emit(self, "walk")
			HotspotType.ITEM:
				hotspot_clicked.emit(self, "take")
			_:
				hotspot_clicked.emit(self, "look")

	elif event.is_action_pressed("context_menu"):
		# Right click - open verb coin
		hotspot_clicked.emit(self, "verb_coin")


func show_highlight() -> void:
	_highlight_visible = true
	modulate = Color(1.3, 1.3, 1.0, 1.0)


func hide_highlight() -> void:
	_highlight_visible = false
	modulate = Color.WHITE


func get_available_verbs() -> Array[String]:
	match hotspot_type:
		HotspotType.ITEM:
			return ["look", "take"]
		HotspotType.EXIT:
			return ["look", "walk"]
		HotspotType.NPC:
			return ["look", "talk", "attack"]
		HotspotType.INTERACTIVE:
			return ["look", "use"]
		HotspotType.SCENERY:
			return ["look"]
	return ["look"]
