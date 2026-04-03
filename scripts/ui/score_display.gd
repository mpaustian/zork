extends PanelContainer
class_name ScoreDisplay
## Shows current score and rank in the corner of the screen.

@onready var score_label: Label = $MarginContainer/ScoreLabel


func _ready() -> void:
	GameManager.score_changed.connect(_on_score_changed)
	GameManager.rank_changed.connect(_on_rank_changed)
	_update_display()

	# Minimal styling — blends into the background
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.0, 0.0, 0.0, 0.3)
	style.set_border_width_all(0)
	style.set_corner_radius_all(2)
	style.content_margin_left = 4
	style.content_margin_right = 4
	style.content_margin_top = 1
	style.content_margin_bottom = 1
	add_theme_stylebox_override("panel", style)
	modulate.a = 0.6
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _on_score_changed(_new_score: int, _max_score: int) -> void:
	_update_display()
	# Brief flash effect
	var tween := create_tween()
	tween.tween_property(score_label, "modulate", Color(1.0, 0.84, 0.0), 0.1)
	tween.tween_property(score_label, "modulate", Color.WHITE, 0.3)


func _on_rank_changed(new_rank: String) -> void:
	_update_display()
	NarratorManager.narrate_raw("Your rank is now: %s." % new_rank)


func _update_display() -> void:
	if score_label:
		score_label.text = "%d / %d" % [GameManager.score, GameManager.MAX_SCORE]
