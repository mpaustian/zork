extends PanelContainer
class_name InventoryUI
## Bottom-of-screen inventory tray with drag-and-drop support.

const SLOT_SIZE := Vector2(32, 32)
const SLOT_MARGIN := 2

@onready var item_container: HBoxContainer = $MarginContainer/HBoxContainer/ScrollContainer/ItemContainer
@onready var weight_bar: ProgressBar = $MarginContainer/HBoxContainer/WeightBar
@onready var scroll_left: Button = $MarginContainer/HBoxContainer/ScrollLeft
@onready var scroll_right: Button = $MarginContainer/HBoxContainer/ScrollRight

var _dragging_item: String = ""
var _drag_sprite: TextureRect = null


func _ready() -> void:
	InventoryManager.inventory_changed.connect(_refresh)
	InventoryManager.weight_changed.connect(_on_weight_changed)
	_refresh()


func _refresh() -> void:
	# Clear existing slots
	for child in item_container.get_children():
		child.queue_free()

	# Create slot for each item
	for item_id in InventoryManager.items:
		var slot := _create_item_slot(item_id)
		item_container.add_child(slot)


func _create_item_slot(item_id: String) -> Panel:
	var slot := Panel.new()
	slot.custom_minimum_size = SLOT_SIZE

	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.2, 0.18, 0.15, 0.8)
	style.border_color = Color(0.4, 0.35, 0.3)
	style.set_border_width_all(1)
	style.set_corner_radius_all(2)
	slot.add_theme_stylebox_override("panel", style)

	# Item icon (placeholder colored rect for now)
	var icon := ColorRect.new()
	icon.color = _get_item_color(item_id)
	icon.custom_minimum_size = Vector2(24, 24)
	icon.position = Vector2(4, 4)
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	slot.add_child(icon)

	# Tooltip
	var info := InventoryManager.get_item_info(item_id)
	slot.tooltip_text = info.get("name", item_id.replace("_", " ").capitalize())

	# Click handler
	slot.gui_input.connect(func(event: InputEvent):
		if event is InputEventMouseButton and event.pressed:
			if event.button_index == MOUSE_BUTTON_LEFT:
				_start_drag(item_id)
			elif event.button_index == MOUSE_BUTTON_RIGHT:
				_show_item_context(item_id)
	)

	# Hover effect
	slot.mouse_entered.connect(func():
		style.border_color = Color(0.7, 0.6, 0.4)
		slot.add_theme_stylebox_override("panel", style)
	)
	slot.mouse_exited.connect(func():
		style.border_color = Color(0.4, 0.35, 0.3)
		slot.add_theme_stylebox_override("panel", style)
	)

	return slot


func _start_drag(item_id: String) -> void:
	_dragging_item = item_id
	# Create drag visual
	if _drag_sprite:
		_drag_sprite.queue_free()
	_drag_sprite = TextureRect.new()
	_drag_sprite.custom_minimum_size = Vector2(24, 24)
	_drag_sprite.mouse_filter = Control.MOUSE_FILTER_IGNORE
	# Placeholder visual
	var placeholder := ColorRect.new()
	placeholder.color = _get_item_color(item_id)
	placeholder.custom_minimum_size = Vector2(24, 24)
	placeholder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_drag_sprite.add_child(placeholder)
	get_tree().root.add_child(_drag_sprite)


func _process(_delta: float) -> void:
	if _drag_sprite and not _dragging_item.is_empty():
		_drag_sprite.global_position = get_global_mouse_position() - Vector2(12, 12)


func _input(event: InputEvent) -> void:
	if _dragging_item.is_empty():
		return
	if event is InputEventMouseButton and not event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_end_drag()


func _end_drag() -> void:
	if _dragging_item.is_empty():
		return

	var mouse_pos := get_viewport().get_mouse_position()
	var used := false

	# Check if dropped on a hotspot in the room
	var space := get_viewport().get_world_2d().direct_space_state
	var query := PhysicsPointQueryParameters2D.new()
	query.position = get_global_mouse_position()
	query.collide_with_areas = true
	var results := space.intersect_point(query)

	for result in results:
		var collider: Object = result["collider"]
		if collider is Hotspot:
			InventoryManager.use_item_on(_dragging_item, collider.hotspot_id)
			used = true
			break

	# If dropped on the room area (not UI), drop the item on the ground
	if not used and mouse_pos.y > 48 and mouse_pos.y < 320:
		_drop_item(_dragging_item)

	_dragging_item = ""
	if _drag_sprite:
		_drag_sprite.queue_free()
		_drag_sprite = null


func _drop_item(item_id: String) -> void:
	if InventoryManager.drop_item(item_id):
		var item_name: String = InventoryManager.get_item_name(item_id)
		NarratorManager.narrate_raw("You drop the %s on the ground." % item_name)
		# Refresh the current room to show the dropped item
		var room_container: Node = RoomManager.room_container
		if room_container and room_container.get_child_count() > 0:
			var room: Node = room_container.get_child(0)
			if room.has_method("_create_ground_item_sprite"):
				room._create_ground_item_sprite(item_id)


func _show_item_context(item_id: String) -> void:
	# Special use-on-self actions for certain items
	match item_id:
		"brass_lantern":
			LightingManager.toggle_lamp()
			_refresh()
			return
		"torch":
			if not LightingManager.torch_lit:
				LightingManager.light_torch()
				_refresh()
			else:
				NarratorManager.narrate_raw("The torch burns with an eternal flame. It cannot be extinguished.")
			return
	# Default: show look text
	NarratorManager.narrate_look(item_id)


func _on_weight_changed(current: int, max_weight: int) -> void:
	if weight_bar:
		weight_bar.value = float(current) / float(max_weight) * 100.0


func _get_item_color(item_id: String) -> Color:
	# Lantern shows on/off state
	if item_id == "brass_lantern":
		if LightingManager.lamp_on:
			return Color(1.0, 0.95, 0.4)  # Bright yellow when on
		else:
			return Color(0.6, 0.5, 0.2)  # Dim when off
	if item_id == "torch":
		return Color(1.0, 0.6, 0.2)  # Orange glow

	var info := InventoryManager.get_item_info(item_id)
	var item_type: String = info.get("type", "misc")
	match item_type:
		"treasure": return Color(1.0, 0.84, 0.0)
		"tool": return Color(0.6, 0.6, 0.7)
		"weapon": return Color(0.8, 0.3, 0.3)
		"light": return Color(1.0, 0.9, 0.5)
		"key": return Color(0.7, 0.5, 0.2)
		_: return Color(0.5, 0.5, 0.5)
