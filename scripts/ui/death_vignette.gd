extends CanvasLayer
class_name DeathVignette
## Displays stylized death scenes with narrator text and VHS rewind effect.

signal vignette_finished()

const VIGNETTE_DISPLAY_TIME := 3.5
const REWIND_DURATION := 1.5

@onready var background: ColorRect = $Background
@onready var death_text: RichTextLabel = $DeathText
@onready var rewind_overlay: ColorRect = $RewindOverlay
var rewind_lines: Control = null

var _death_type: String = ""


func _ready() -> void:
	DeathManager.death_triggered.connect(_on_death_triggered)
	visible = false
	if rewind_overlay:
		rewind_overlay.visible = false


func _on_death_triggered(death_type: String) -> void:
	_death_type = death_type
	visible = true

	# Set death-type-specific visuals
	_setup_death_visual(death_type)

	# Show death scene, then rewind
	var tween := create_tween()
	# Fade in
	background.modulate.a = 0.0
	tween.tween_property(background, "modulate:a", 1.0, 0.3)
	# Hold
	tween.tween_interval(VIGNETTE_DISPLAY_TIME)
	# Trigger rewind
	tween.tween_callback(_start_rewind)


func _setup_death_visual(death_type: String) -> void:
	# Background color based on death type
	match death_type:
		"grue":
			background.color = Color(0.0, 0.0, 0.0, 1.0)
		"troll":
			background.color = Color(0.15, 0.05, 0.05, 1.0)
		"thief":
			background.color = Color(0.08, 0.05, 0.12, 1.0)
		"drowning":
			background.color = Color(0.02, 0.05, 0.15, 1.0)
		"fall":
			background.color = Color(0.05, 0.05, 0.05, 1.0)
		_:
			background.color = Color(0.1, 0.05, 0.05, 1.0)

	if death_text:
		death_text.text = ""


func _start_rewind() -> void:
	if rewind_overlay:
		rewind_overlay.visible = true
		rewind_overlay.color = Color(0.1, 0.1, 0.15, 0.5)

	# VHS rewind visual effect
	AudioManager.play_sfx("rewind")

	var tween := create_tween()
	# Scanline flicker effect via modulation
	for i in 6:
		tween.tween_property(background, "modulate:a", 0.5, 0.1)
		tween.tween_property(background, "modulate:a", 1.0, 0.1)
	tween.tween_property(background, "modulate:a", 0.0, 0.3)
	tween.tween_callback(_finish_rewind)


func _finish_rewind() -> void:
	visible = false
	if rewind_overlay:
		rewind_overlay.visible = false
	DeathManager.start_rewind()
	vignette_finished.emit()
