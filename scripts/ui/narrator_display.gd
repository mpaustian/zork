extends PanelContainer
class_name NarratorDisplay
## The narrator text box. Top of screen, parchment style, typewriter effect.

const TYPEWRITER_SPEED := 0.03  # Seconds per character
const DISPLAY_DURATION := 4.0  # How long text stays after finishing
const FADE_DURATION := 0.3

@onready var text_label: RichTextLabel = $MarginContainer/TextLabel

var _full_text: String = ""
var _char_index: int = 0
var _typing: bool = false
var _display_timer: float = 0.0
var _showing: bool = false


func _ready() -> void:
	NarratorManager.narration_started.connect(_on_narration_started)
	NarratorManager.narration_cleared.connect(_on_narration_cleared)

	visible = false
	modulate.a = 0.0

	# Style the panel
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.12, 0.1, 0.08, 0.85)
	style.border_color = Color(0.4, 0.35, 0.25, 0.6)
	style.set_border_width_all(1)
	style.border_width_bottom = 2
	style.set_corner_radius_all(0)
	style.content_margin_left = 12
	style.content_margin_right = 12
	style.content_margin_top = 6
	style.content_margin_bottom = 6
	add_theme_stylebox_override("panel", style)


func _process(delta: float) -> void:
	if _typing:
		_char_index += 1
		if _char_index >= _full_text.length():
			_typing = false
			_display_timer = DISPLAY_DURATION
			NarratorManager.finish_narration()
		else:
			text_label.text = _full_text.substr(0, _char_index)
			AudioManager.play_typewriter_click()

	elif _showing and _display_timer > 0:
		_display_timer -= delta
		if _display_timer <= 0:
			_hide_display()


func _on_narration_started(text: String) -> void:
	_full_text = text
	_char_index = 0
	_typing = true
	_showing = true

	text_label.text = ""
	visible = true

	# Fade in
	var tween := create_tween()
	tween.tween_property(self, "modulate:a", 1.0, FADE_DURATION)


func _on_narration_cleared() -> void:
	_typing = false
	_hide_display()


func _hide_display() -> void:
	_showing = false
	var tween := create_tween()
	tween.tween_property(self, "modulate:a", 0.0, FADE_DURATION)
	tween.tween_callback(func(): visible = false)


func _input(event: InputEvent) -> void:
	# Click to skip typewriter and show full text
	if _typing and event is InputEventMouseButton and event.pressed:
		_char_index = _full_text.length()
		text_label.text = _full_text
		_typing = false
		_display_timer = DISPLAY_DURATION
		NarratorManager.finish_narration()
