extends CanvasLayer
class_name DeathVignette
## Displays stylized death scenes with narrator text and VHS rewind effect.

signal vignette_finished()

const VIGNETTE_DISPLAY_TIME := 6.0
const REWIND_LORE_TIME := 4.0
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

	# Show the death text on our own overlay
	if death_text:
		var key := "death_%s" % death_type
		var text: String = NarratorManager._get_text(key)
		if text.is_empty():
			text = NarratorManager._get_text("death_generic")
		death_text.text = text

	# Show death scene, then rewind lore, then rewind effect
	var tween := create_tween()
	# Fade in
	background.modulate.a = 0.0
	if death_text:
		death_text.modulate.a = 0.0
	tween.tween_property(background, "modulate:a", 1.0, 0.3)
	# Show death text
	if death_text:
		tween.tween_property(death_text, "modulate:a", 1.0, 0.5)
	# Hold for reading
	tween.tween_interval(VIGNETTE_DISPLAY_TIME)
	# Show rewind lore
	tween.tween_callback(_show_rewind_lore)
	tween.tween_interval(REWIND_LORE_TIME)
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
		death_text.modulate.a = 0.0


func _show_rewind_lore() -> void:
	if not death_text:
		return
	# Pick a random rewind explanation
	var lore: Array[String] = [
		"But wait — the ancient magic of the Great Underground Empire is not so easily cheated of its entertainment. Time shudders, stutters, and begins to unspool...",
		"Death, however, is merely an inconvenience in the Great Underground Empire. The Dungeon Master raises an eyebrow, snaps his fingers, and time begins to rewind...",
		"The universe, recognizing a narrative dead end, engages its emergency temporal reversal protocol. Reality flickers like a bad candle...",
		"Somewhere, a cosmic proofreader marks this timeline with a red pen and scribbles 'NO' in the margin. The ink bleeds backward through the pages...",
		"The Great Underground Empire has a strict no-permanent-death policy. Insurance reasons, mostly. The world blurs and rewrites itself...",
	]
	death_text.text = lore[randi() % lore.size()]


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
