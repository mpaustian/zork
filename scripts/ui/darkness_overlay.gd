extends CanvasLayer
class_name DarknessOverlay
## Visual overlay that darkens the screen based on light level. Grue eyes appear in darkness.

@onready var overlay: ColorRect = $Overlay
@onready var light_circle: Sprite2D = $LightCircle
@onready var grue_eyes: AnimatedSprite2D = $GrueEyes

var _target_darkness: float = 0.0
var _current_darkness: float = 0.0
var _grue_visible: bool = false

const DARKNESS_LERP_SPEED := 2.0


func _ready() -> void:
	LightingManager.lamp_state_changed.connect(_on_lamp_state_changed)
	LightingManager.darkness_entered.connect(_on_darkness_entered)
	LightingManager.grue_attack.connect(_on_grue_attack)
	RoomManager.room_changed.connect(_on_room_changed)
	DeathManager.rewind_finished.connect(_on_rewind_finished)

	overlay.color = Color(0, 0, 0, 0)
	if grue_eyes:
		grue_eyes.visible = false


func _process(delta: float) -> void:
	_current_darkness = lerpf(_current_darkness, _target_darkness, delta * DARKNESS_LERP_SPEED)
	overlay.color = Color(0, 0, 0, _current_darkness)

	# Light circle follows player when partially dark
	if light_circle and _current_darkness > 0.1 and _current_darkness < 0.95:
		var player := get_tree().get_first_node_in_group("player")
		if player:
			light_circle.visible = true
			light_circle.global_position = player.global_position
			var intensity := LightingManager.get_light_intensity()
			light_circle.scale = Vector2.ONE * (0.5 + intensity * 1.5)
		else:
			light_circle.visible = false
	elif light_circle:
		light_circle.visible = false


func _on_lamp_state_changed(_state: LightingManager.LampState) -> void:
	_update_darkness()


func _on_room_changed(_old: String, _new: String) -> void:
	_update_darkness()
	_hide_grue_eyes()


func _on_darkness_entered() -> void:
	_target_darkness = 0.95


func _on_grue_attack() -> void:
	_target_darkness = 1.0
	_show_grue_eyes()


func _on_rewind_finished() -> void:
	_update_darkness()
	_hide_grue_eyes()


func _update_darkness() -> void:
	if not RoomManager.is_dark():
		_target_darkness = 0.0
		return

	var intensity := LightingManager.get_light_intensity()
	if intensity <= 0:
		_target_darkness = 0.95
	else:
		# Partial darkness based on light level
		_target_darkness = clampf(1.0 - intensity, 0.0, 0.7)


func _show_grue_eyes() -> void:
	if not grue_eyes:
		return
	_grue_visible = true
	grue_eyes.visible = true
	# Random position in the darkness
	grue_eyes.position = Vector2(
		randf_range(100, 540),
		randf_range(80, 280)
	)
	if grue_eyes.sprite_frames and grue_eyes.sprite_frames.has_animation("glow"):
		grue_eyes.play("glow")


func _hide_grue_eyes() -> void:
	_grue_visible = false
	if grue_eyes:
		grue_eyes.visible = false
