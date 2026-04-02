extends Area2D
class_name Hotspot
## A clickable area in a room. Can be an item, exit, NPC, or interactive object.
## Draws a visible placeholder shape so hotspots are visible during development.

signal hotspot_clicked(hotspot: Hotspot, verb: String)
signal hotspot_hovered(hotspot: Hotspot)
signal hotspot_unhovered(hotspot: Hotspot)

enum HotspotType { ITEM, EXIT, NPC, INTERACTIVE, SCENERY }

@export var hotspot_id: String = ""
@export var display_name: String = ""
@export var hotspot_type: HotspotType = HotspotType.SCENERY
@export var exit_direction: String = ""  # For EXIT type: north, south, east, west, up, down
@export var item_id: String = ""  # For ITEM type: which item to pick up
@export var walk_to_point: Vector2 = Vector2.ZERO  # Where player walks to interact
@export var look_text: String = ""  # Override narrator look text
@export var highlight_on_tab: bool = true  # Show when Tab is pressed

var _is_hovered := false
var _highlight_visible := false
var _label: Label = null
var _placeholder: ColorRect = null


func _ready() -> void:
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	input_event.connect(_on_input_event)

	if display_name.is_empty():
		display_name = hotspot_id.replace("_", " ").capitalize()

	# Create visible placeholder for development
	_create_placeholder()


func _create_placeholder() -> void:
	# Get size from collision shape
	var size := Vector2(30, 30)
	for child in get_children():
		if child is CollisionShape2D and child.shape is RectangleShape2D:
			size = child.shape.size
			break

	# Colored rectangle based on type
	_placeholder = ColorRect.new()
	_placeholder.size = size
	_placeholder.position = -size / 2
	_placeholder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_placeholder.z_index = 5

	match hotspot_type:
		HotspotType.ITEM:
			_placeholder.color = Color(1.0, 0.84, 0.0, 0.5)  # Gold
		HotspotType.EXIT:
			_placeholder.color = Color(0.4, 0.7, 1.0, 0.3)  # Light blue
		HotspotType.NPC:
			_placeholder.color = Color(0.9, 0.3, 0.3, 0.5)  # Red
		HotspotType.INTERACTIVE:
			_placeholder.color = Color(0.5, 0.9, 0.4, 0.4)  # Green
		HotspotType.SCENERY:
			_placeholder.color = Color(0.6, 0.6, 0.6, 0.2)  # Gray

	add_child(_placeholder)

	# Add a label above the hotspot
	_label = Label.new()
	_label.text = display_name
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.position = Vector2(-size.x / 2, -size.y / 2 - 16)
	_label.custom_minimum_size = Vector2(size.x, 16)
	_label.add_theme_font_size_override("font_size", 10)
	_label.add_theme_color_override("font_color", Color.WHITE)
	_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label.z_index = 6
	_label.visible = false  # Only show on hover
	add_child(_label)


func _on_mouse_entered() -> void:
	_is_hovered = true
	if _label:
		_label.visible = true
	if _placeholder:
		_placeholder.color.a = minf(_placeholder.color.a + 0.3, 0.9)
	hotspot_hovered.emit(self)


func _on_mouse_exited() -> void:
	_is_hovered = false
	if _label:
		_label.visible = false
	if _placeholder:
		_placeholder.color.a = maxf(_placeholder.color.a - 0.3, 0.1)
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
	if _placeholder:
		_placeholder.color.a = 0.8
	if _label:
		_label.visible = true


func hide_highlight() -> void:
	_highlight_visible = false
	if _placeholder and not _is_hovered:
		_placeholder.color.a = 0.3
	if _label and not _is_hovered:
		_label.visible = false


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
