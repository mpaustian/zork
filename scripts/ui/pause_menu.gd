extends CanvasLayer
## Pause menu with save, load, death gallery, and quit options.

@onready var panel: PanelContainer = $Panel
@onready var button_container: VBoxContainer = $Panel/MarginContainer/VBoxContainer

var _is_open := false


func _ready() -> void:
	layer = 50  # Above everything
	visible = false
	_build_menu()


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		if _is_open:
			close_menu()
		elif GameManager.state == GameManager.GameState.PLAYING:
			open_menu()
		get_viewport().set_input_as_handled()


func open_menu() -> void:
	if _is_open:
		return
	_is_open = true
	GameManager.state = GameManager.GameState.PAUSED
	visible = true
	_refresh_buttons()


func close_menu() -> void:
	if not _is_open:
		return
	_is_open = false
	GameManager.state = GameManager.GameState.PLAYING
	visible = false


func _build_menu() -> void:
	# Title
	var title := Label.new()
	title.text = "PAUSED"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color(0.9, 0.85, 0.7))
	button_container.add_child(title)

	# Spacer
	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 8)
	button_container.add_child(spacer)

	_add_button("Resume", _on_resume)
	_add_button("Save Game", _on_save)
	_add_button("Load Game", _on_load)
	_add_button("Death Gallery", _on_death_gallery)
	_add_button("Quit to Desktop", _on_quit)


func _add_button(text: String, callback: Callable) -> void:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(160, 28)
	btn.pressed.connect(callback)

	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.15, 0.12, 0.1, 0.9)
	style.border_color = Color(0.4, 0.35, 0.25)
	style.set_border_width_all(1)
	style.set_corner_radius_all(3)
	style.content_margin_left = 8
	style.content_margin_right = 8
	style.content_margin_top = 4
	style.content_margin_bottom = 4
	btn.add_theme_stylebox_override("normal", style)

	var hover := style.duplicate() as StyleBoxFlat
	hover.bg_color = Color(0.25, 0.2, 0.15, 0.9)
	hover.border_color = Color(0.6, 0.5, 0.35)
	btn.add_theme_stylebox_override("hover", hover)

	btn.add_theme_font_size_override("font_size", 12)
	btn.add_theme_color_override("font_color", Color(0.85, 0.8, 0.7))

	button_container.add_child(btn)


func _refresh_buttons() -> void:
	pass


func _on_resume() -> void:
	close_menu()


func _on_save() -> void:
	var filename := "save_%d.json" % int(Time.get_unix_time_from_system())
	if SaveManager.save_game(filename):
		NarratorManager.narrate_raw("Game saved.")
	else:
		NarratorManager.narrate_raw("Save failed.")
	close_menu()


func _on_load() -> void:
	if SaveManager.has_auto_save():
		SaveManager.load_game()
		NarratorManager.narrate_raw("Game loaded from auto-save.")
	else:
		NarratorManager.narrate_raw("No save file found.")
	close_menu()


func _on_death_gallery() -> void:
	close_menu()
	_show_death_gallery()


func _on_quit() -> void:
	get_tree().quit()


func _show_death_gallery() -> void:
	# Create death gallery overlay
	var gallery := _create_death_gallery_panel()
	add_child(gallery)
	visible = true
	GameManager.state = GameManager.GameState.PAUSED


func _create_death_gallery_panel() -> Control:
	var overlay := ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.85)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP

	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 40)
	margin.add_theme_constant_override("margin_right", 40)
	margin.add_theme_constant_override("margin_top", 20)
	margin.add_theme_constant_override("margin_bottom", 20)
	overlay.add_child(margin)

	var vbox := VBoxContainer.new()
	margin.add_child(vbox)

	# Title
	var title := Label.new()
	title.text = "DEATH GALLERY"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 16)
	title.add_theme_color_override("font_color", Color(0.9, 0.3, 0.3))
	vbox.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Deaths witnessed: %d / %d" % [DeathManager.get_death_count(), _get_total_death_types()]
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 10)
	subtitle.add_theme_color_override("font_color", Color(0.7, 0.65, 0.6))
	vbox.add_child(subtitle)

	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 10)
	vbox.add_child(spacer)

	# Death entries
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(scroll)

	var grid := VBoxContainer.new()
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(grid)

	var death_types: Dictionary = _get_death_info()
	for death_id: String in death_types:
		var info: Dictionary = death_types[death_id]
		var witnessed: bool = DeathManager.has_seen_death(death_id)

		var entry := HBoxContainer.new()
		entry.custom_minimum_size = Vector2(0, 20)
		grid.add_child(entry)

		var icon := Label.new()
		icon.text = "X" if witnessed else "?"
		icon.custom_minimum_size = Vector2(20, 0)
		icon.add_theme_font_size_override("font_size", 12)
		icon.add_theme_color_override("font_color", Color(0.9, 0.3, 0.3) if witnessed else Color(0.4, 0.4, 0.4))
		entry.add_child(icon)

		var name_label := Label.new()
		name_label.text = info["name"] if witnessed else "???"
		name_label.custom_minimum_size = Vector2(120, 0)
		name_label.add_theme_font_size_override("font_size", 10)
		name_label.add_theme_color_override("font_color", Color(0.85, 0.8, 0.7) if witnessed else Color(0.4, 0.4, 0.4))
		entry.add_child(name_label)

		var desc := Label.new()
		desc.text = info["desc"] if witnessed else "Death unknown..."
		desc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		desc.add_theme_font_size_override("font_size", 9)
		desc.add_theme_color_override("font_color", Color(0.6, 0.55, 0.5) if witnessed else Color(0.3, 0.3, 0.3))
		entry.add_child(desc)

	# Close button
	var spacer2 := Control.new()
	spacer2.custom_minimum_size = Vector2(0, 8)
	vbox.add_child(spacer2)

	var close_btn := Button.new()
	close_btn.text = "Close"
	close_btn.custom_minimum_size = Vector2(80, 24)
	close_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	close_btn.add_theme_font_size_override("font_size", 11)
	close_btn.pressed.connect(func() -> void:
		overlay.queue_free()
		visible = false
		GameManager.state = GameManager.GameState.PLAYING
	)
	vbox.add_child(close_btn)

	return overlay


func _get_death_info() -> Dictionary:
	return {
		"grue": {"name": "Eaten by a Grue", "desc": "Lingered too long in the darkness."},
		"troll": {"name": "Troll's Axe", "desc": "Lost combat with the troll."},
		"thief": {"name": "Thief's Stiletto", "desc": "Defeated by the thief in combat."},
		"explosion": {"name": "Gas Explosion", "desc": "Used an open flame in the gas room."},
		"drowning": {"name": "Drowned", "desc": "The river claimed another victim."},
		"fall": {"name": "Fatal Fall", "desc": "Gravity always wins eventually."},
		"thief_combat": {"name": "Robbed Blind", "desc": "The thief was faster with a blade."},
		"cyclops": {"name": "Cyclops Lunch", "desc": "Annoyed the wrong one-eyed giant."},
		"sarcophagus": {"name": "Entombed", "desc": "Some coffins are meant to stay closed."},
		"river_falls": {"name": "Over the Falls", "desc": "Went over Aragain Falls without a rainbow."},
	}


func _get_total_death_types() -> int:
	return _get_death_info().size()
