extends CharacterBody2D
class_name Player
## The adventurer. Click-to-move pathfinding, placeholder colored sprite.

signal arrived_at(position: Vector2)

const MOVE_SPEED := 80.0  # Pixels per second
const PLAYER_COLOR := Color(0.2, 0.5, 0.9)
const PLAYER_SIZE := Vector2(12, 24)

var _moving := false
var _target_pos := Vector2.ZERO

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D
@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var _placeholder: ColorRect = null


func _ready() -> void:
	# Create a visible placeholder since we have no sprite art yet
	_placeholder = ColorRect.new()
	_placeholder.color = PLAYER_COLOR
	_placeholder.size = PLAYER_SIZE
	_placeholder.position = -PLAYER_SIZE / 2
	_placeholder.z_index = 10
	add_child(_placeholder)

	if nav_agent:
		nav_agent.navigation_finished.connect(_on_navigation_finished)
		nav_agent.target_desired_distance = 4.0
		nav_agent.path_desired_distance = 4.0


func _physics_process(_delta: float) -> void:
	if not _moving:
		return
	if not nav_agent:
		return
	if nav_agent.is_navigation_finished():
		_stop_moving()
		return

	var next_pos := nav_agent.get_next_path_position()
	var direction := global_position.direction_to(next_pos)

	velocity = direction * MOVE_SPEED

	# Flip placeholder based on movement direction
	if sprite and sprite.sprite_frames:
		if velocity.x < -1:
			sprite.flip_h = true
		elif velocity.x > 1:
			sprite.flip_h = false

	move_and_slide()


func move_to(target: Vector2) -> void:
	if GameManager.state != GameManager.GameState.PLAYING:
		return
	_target_pos = target
	_moving = true
	if nav_agent:
		nav_agent.target_position = target


func _stop_moving() -> void:
	_moving = false
	velocity = Vector2.ZERO
	arrived_at.emit(global_position)


func _on_navigation_finished() -> void:
	_stop_moving()


func play_animation(anim_name: String) -> void:
	if sprite and sprite.sprite_frames and sprite.sprite_frames.has_animation(anim_name):
		sprite.play(anim_name)


func face_left() -> void:
	if sprite:
		sprite.flip_h = true


func face_right() -> void:
	if sprite:
		sprite.flip_h = false
