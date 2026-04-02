extends Node
class_name CursorManager
## Manages cursor appearance based on context (default, hotspot hover, exit hover, dragging).

enum CursorMode { DEFAULT, HOTSPOT, EXIT, DRAGGING }

var current_mode: CursorMode = CursorMode.DEFAULT
var _hovered_hotspot: Hotspot = null


func _ready() -> void:
	# We'll use system cursor with custom textures when art is available
	# For now, just change the cursor shape
	pass


func _process(_delta: float) -> void:
	if current_mode == CursorMode.DEFAULT:
		Input.set_default_cursor_shape(Input.CURSOR_ARROW)
	elif current_mode == CursorMode.HOTSPOT:
		Input.set_default_cursor_shape(Input.CURSOR_POINTING_HAND)
	elif current_mode == CursorMode.EXIT:
		Input.set_default_cursor_shape(Input.CURSOR_POINTING_HAND)
	elif current_mode == CursorMode.DRAGGING:
		Input.set_default_cursor_shape(Input.CURSOR_DRAG)


func on_hotspot_entered(hotspot: Hotspot) -> void:
	_hovered_hotspot = hotspot
	if hotspot.hotspot_type == Hotspot.HotspotType.EXIT:
		current_mode = CursorMode.EXIT
	else:
		current_mode = CursorMode.HOTSPOT


func on_hotspot_exited(_hotspot: Hotspot) -> void:
	_hovered_hotspot = null
	current_mode = CursorMode.DEFAULT


func set_dragging(dragging: bool) -> void:
	current_mode = CursorMode.DRAGGING if dragging else CursorMode.DEFAULT
