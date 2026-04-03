extends CanvasLayer
## Title screen shown on game launch.

signal new_game_requested()
signal continue_requested()

@onready var button_container: VBoxContainer = $Panel/MarginContainer/VBoxContainer

var _is_active := true


func _ready() -> void:
	layer = 60
	visible = true
	_build_screen()


func _build_screen() -> void:
	# Title
	var title := Label.new()
	title.text = "ZORK"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 28)
	title.add_theme_color_override("font_color", Color(0.9, 0.85, 0.6))
	button_container.add_child(title)

	# Subtitle
	var subtitle := Label.new()
	subtitle.text = "The Great Underground Empire"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 11)
	subtitle.add_theme_color_override("font_color", Color(0.6, 0.55, 0.45))
	button_container.add_child(subtitle)

	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 20)
	button_container.add_child(spacer)

	_add_button("New Game", _on_new_game)
	if SaveManager.has_auto_save():
		_add_button("Continue", _on_continue)
	_add_button("Quit", _on_quit)

	var spacer2 := Control.new()
	spacer2.custom_minimum_size = Vector2(0, 16)
	button_container.add_child(spacer2)

	# Credits
	var credits := Label.new()
	credits.text = "A graphical reimagining"
	credits.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	credits.add_theme_font_size_override("font_size", 8)
	credits.add_theme_color_override("font_color", Color(0.4, 0.38, 0.32))
	button_container.add_child(credits)


func _add_button(text: String, callback: Callable) -> void:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(160, 30)
	btn.pressed.connect(callback)

	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.12, 0.1, 0.08, 0.9)
	style.border_color = Color(0.4, 0.35, 0.25)
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 5
	style.content_margin_bottom = 5
	btn.add_theme_stylebox_override("normal", style)

	var hover := style.duplicate() as StyleBoxFlat
	hover.bg_color = Color(0.2, 0.18, 0.12, 0.9)
	hover.border_color = Color(0.7, 0.6, 0.4)
	btn.add_theme_stylebox_override("hover", hover)

	btn.add_theme_font_size_override("font_size", 13)
	btn.add_theme_color_override("font_color", Color(0.85, 0.8, 0.7))

	button_container.add_child(btn)


func _on_new_game() -> void:
	_close()
	new_game_requested.emit()


func _on_continue() -> void:
	_close()
	continue_requested.emit()


func _on_quit() -> void:
	get_tree().quit()


func _close() -> void:
	_is_active = false
	var tween := create_tween()
	tween.tween_property(self, "modulate:a", 0.0, 0.5)
	tween.tween_callback(func(): visible = false)
