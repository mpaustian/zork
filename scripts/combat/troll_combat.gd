extends Control
class_name TrollCombat
## QTE-lite combat encounter with the Troll.
## Player clicks timed prompts to attack and dodge.

signal combat_finished(won: bool)

enum Phase { INTRO, PLAYER_ATTACK, TROLL_ATTACK, RESOLUTION }

const TOTAL_HITS_NEEDED := 3
const QTE_WINDOW := 1.5  # Seconds to click the prompt
const TROLL_HEALTH := 3
const PLAYER_HEALTH := 3

@onready var prompt_label: Label = $PromptLabel
@onready var timer_bar: ProgressBar = $TimerBar
@onready var action_button: Button = $ActionButton

var phase: Phase = Phase.INTRO
var troll_hp: int = TROLL_HEALTH
var player_hp: int = PLAYER_HEALTH
var _qte_timer: float = 0.0
var _qte_active: bool = false
var _round: int = 0


func _ready() -> void:
	# Full-screen overlay
	anchors_preset = 15  # Full rect
	mouse_filter = Control.MOUSE_FILTER_STOP

	_setup_ui()
	_start_combat()


func _setup_ui() -> void:
	# Create UI elements if not in scene tree
	if not prompt_label:
		prompt_label = Label.new()
		prompt_label.name = "PromptLabel"
		prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		prompt_label.anchors_preset = 8  # Center
		prompt_label.position = Vector2(220, 140)
		add_child(prompt_label)

	if not timer_bar:
		timer_bar = ProgressBar.new()
		timer_bar.name = "TimerBar"
		timer_bar.custom_minimum_size = Vector2(200, 12)
		timer_bar.position = Vector2(220, 180)
		timer_bar.show_percentage = false
		add_child(timer_bar)

	if not action_button:
		action_button = Button.new()
		action_button.name = "ActionButton"
		action_button.custom_minimum_size = Vector2(120, 36)
		action_button.position = Vector2(260, 200)
		action_button.pressed.connect(_on_action_pressed)
		add_child(action_button)


func _process(delta: float) -> void:
	if _qte_active:
		_qte_timer -= delta
		timer_bar.value = (_qte_timer / QTE_WINDOW) * 100.0
		if _qte_timer <= 0:
			_qte_timeout()


func _start_combat() -> void:
	_round = 0
	_next_round()


func _next_round() -> void:
	_round += 1
	if _round > 6:
		# Too many rounds, player loses
		combat_finished.emit(false)
		queue_free()
		return

	# Alternate between player attack and dodge
	if _round % 2 == 1:
		_start_player_attack()
	else:
		_start_troll_attack()


func _start_player_attack() -> void:
	phase = Phase.PLAYER_ATTACK
	prompt_label.text = "STRIKE!"
	action_button.text = "Attack!"
	action_button.visible = true
	_start_qte()


func _start_troll_attack() -> void:
	phase = Phase.TROLL_ATTACK
	prompt_label.text = "DODGE!"
	action_button.text = "Dodge!"
	action_button.visible = true
	_start_qte()


func _start_qte() -> void:
	_qte_timer = QTE_WINDOW
	_qte_active = true
	timer_bar.value = 100.0
	timer_bar.visible = true


func _on_action_pressed() -> void:
	if not _qte_active:
		return
	_qte_active = false
	action_button.visible = false
	timer_bar.visible = false

	match phase:
		Phase.PLAYER_ATTACK:
			troll_hp -= 1
			NarratorManager.narrate("troll_combat_hit")
			if troll_hp <= 0:
				_player_wins()
				return
		Phase.TROLL_ATTACK:
			NarratorManager.narrate("troll_combat_dodge")

	# Brief pause then next round
	var tween := create_tween()
	tween.tween_interval(1.0)
	tween.tween_callback(_next_round)


func _qte_timeout() -> void:
	_qte_active = false
	action_button.visible = false
	timer_bar.visible = false

	match phase:
		Phase.PLAYER_ATTACK:
			NarratorManager.narrate("troll_combat_miss")
		Phase.TROLL_ATTACK:
			player_hp -= 1
			NarratorManager.narrate("troll_combat_fail_dodge")
			if player_hp <= 0:
				_player_loses()
				return

	var tween := create_tween()
	tween.tween_interval(1.0)
	tween.tween_callback(_next_round)


func _player_wins() -> void:
	prompt_label.text = "Victory!"
	var tween := create_tween()
	tween.tween_interval(1.5)
	tween.tween_callback(func():
		combat_finished.emit(true)
		queue_free()
	)


func _player_loses() -> void:
	prompt_label.text = ""
	combat_finished.emit(false)
	queue_free()
