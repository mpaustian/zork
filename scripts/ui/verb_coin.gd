extends Control
class_name VerbCoin
## Radial verb menu that appears on right-click. Shows available actions for a hotspot.

signal verb_selected(hotspot: Hotspot, verb: String)

const RADIUS := 40.0
const ICON_SIZE := Vector2(24, 24)
const FADE_DURATION := 0.15

var _active_hotspot: Hotspot = null
var _verb_buttons: Array[Button] = []
var _is_visible := false

# Verb display config
const VERB_CONFIG := {
	"look": {"label": "Look", "icon": "eye", "color": Color(0.6, 0.8, 1.0)},
	"take": {"label": "Take", "icon": "hand", "color": Color(0.6, 1.0, 0.6)},
	"use": {"label": "Use", "icon": "gear", "color": Color(1.0, 0.9, 0.5)},
	"talk": {"label": "Talk", "icon": "speech", "color": Color(0.9, 0.7, 1.0)},
	"walk": {"label": "Go", "icon": "arrow", "color": Color(0.8, 0.8, 0.8)},
	"attack": {"label": "Attack", "icon": "sword", "color": Color(1.0, 0.5, 0.5)},
}


func _ready() -> void:
	add_to_group("verb_coin")
	visible = false
	# Close when clicking outside
	gui_input.connect(_on_gui_input)


func _input(event: InputEvent) -> void:
	if _is_visible and event is InputEventMouseButton and event.pressed:
		# Check if click is outside the verb coin
		if not get_global_rect().has_point(event.global_position):
			hide_coin()


func show_for_hotspot(hotspot: Hotspot, screen_pos: Vector2) -> void:
	_active_hotspot = hotspot
	_clear_buttons()

	var verbs := hotspot.get_available_verbs()
	var angle_step := TAU / verbs.size()

	for i in verbs.size():
		var verb: String = verbs[i]
		var config: Dictionary = VERB_CONFIG.get(verb, {"label": verb.capitalize(), "color": Color.WHITE})
		var angle := angle_step * i - PI / 2  # Start from top

		var btn := Button.new()
		btn.text = config["label"]
		btn.custom_minimum_size = Vector2(48, 24)
		btn.position = Vector2(
			cos(angle) * RADIUS - 24,
			sin(angle) * RADIUS - 12
		)

		# Style the button
		var style := StyleBoxFlat.new()
		style.bg_color = Color(0.15, 0.12, 0.1, 0.9)
		style.border_color = config["color"]
		style.set_border_width_all(1)
		style.set_corner_radius_all(4)
		btn.add_theme_stylebox_override("normal", style)

		var hover_style := style.duplicate() as StyleBoxFlat
		hover_style.bg_color = config["color"] * 0.3
		btn.add_theme_stylebox_override("hover", hover_style)

		btn.add_theme_font_size_override("font_size", 10)
		btn.add_theme_color_override("font_color", config["color"])

		var captured_verb := verb
		btn.pressed.connect(func(): _on_verb_pressed(captured_verb))

		add_child(btn)
		_verb_buttons.append(btn)

	# Position the coin, keeping it away from UI edges
	# Narrator is top 48px, inventory is bottom 40px, buttons radiate ~50px
	global_position = screen_pos
	global_position.x = clampf(global_position.x, 60, 580)
	global_position.y = clampf(global_position.y, 100, 270)

	visible = true
	_is_visible = true

	# Fade in
	modulate.a = 0.0
	var tween := create_tween()
	tween.tween_property(self, "modulate:a", 1.0, FADE_DURATION)


func hide_coin() -> void:
	if not _is_visible:
		return
	_is_visible = false
	var tween := create_tween()
	tween.tween_property(self, "modulate:a", 0.0, FADE_DURATION)
	tween.tween_callback(func():
		visible = false
		_clear_buttons()
	)


func _on_verb_pressed(verb: String) -> void:
	if _active_hotspot:
		verb_selected.emit(_active_hotspot, verb)
		_active_hotspot.hotspot_clicked.emit(_active_hotspot, verb)
	hide_coin()


func _clear_buttons() -> void:
	for btn in _verb_buttons:
		btn.queue_free()
	_verb_buttons.clear()


func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			hide_coin()
