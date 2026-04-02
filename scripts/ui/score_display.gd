extends PanelContainer
class_name ScoreDisplay
## Shows current score and rank in the corner of the screen.

@onready var score_label: Label = $MarginContainer/VBoxContainer/ScoreLabel
@onready var rank_label: Label = $MarginContainer/VBoxContainer/RankLabel


func _ready() -> void:
	GameManager.score_changed.connect(_on_score_changed)
	GameManager.rank_changed.connect(_on_rank_changed)
	_update_display()

	# Subtle styling
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.1, 0.08, 0.06, 0.6)
	style.border_color = Color(0.3, 0.25, 0.2, 0.4)
	style.set_border_width_all(1)
	style.set_corner_radius_all(2)
	style.content_margin_left = 6
	style.content_margin_right = 6
	style.content_margin_top = 2
	style.content_margin_bottom = 2
	add_theme_stylebox_override("panel", style)


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
		score_label.text = "Score: %d / %d" % [GameManager.score, GameManager.MAX_SCORE]
	if rank_label:
		rank_label.text = GameManager.current_rank
