extends Node
## Manages ambient audio, sound effects, and musical stings.

const CROSSFADE_DURATION := 1.0

var _ambient_player: AudioStreamPlayer
var _sfx_player: AudioStreamPlayer
var _sting_player: AudioStreamPlayer
var _current_ambient: String = ""


func _ready() -> void:
	_ambient_player = AudioStreamPlayer.new()
	_ambient_player.bus = "Ambient"
	add_child(_ambient_player)

	_sfx_player = AudioStreamPlayer.new()
	_sfx_player.bus = "SFX"
	add_child(_sfx_player)

	_sting_player = AudioStreamPlayer.new()
	_sting_player.bus = "Music"
	add_child(_sting_player)

	RoomManager.room_changed.connect(_on_room_changed)


func _on_room_changed(_old: String, new_room: String) -> void:
	var room_info := RoomManager.get_room_info(new_room)
	var ambient: String = room_info.get("ambient_sound", "")
	if ambient != _current_ambient:
		_crossfade_ambient(ambient)


func _crossfade_ambient(new_ambient: String) -> void:
	var tween := get_tree().create_tween()
	if _ambient_player.playing:
		tween.tween_property(_ambient_player, "volume_db", -40.0, CROSSFADE_DURATION)
		tween.tween_callback(_ambient_player.stop)

	_current_ambient = new_ambient
	if new_ambient.is_empty():
		return

	var path := "res://audio/ambient/%s.ogg" % new_ambient
	if ResourceLoader.exists(path):
		var stream := load(path) as AudioStream
		if stream:
			_ambient_player.stream = stream
			_ambient_player.volume_db = -40.0
			_ambient_player.play()
			tween.tween_property(_ambient_player, "volume_db", 0.0, CROSSFADE_DURATION)


func play_sfx(sfx_name: String) -> void:
	var path := "res://audio/sfx/%s.ogg" % sfx_name
	if ResourceLoader.exists(path):
		var stream := load(path) as AudioStream
		if stream:
			_sfx_player.stream = stream
			_sfx_player.play()


func play_sting(sting_name: String) -> void:
	var path := "res://audio/stings/%s.ogg" % sting_name
	if ResourceLoader.exists(path):
		var stream := load(path) as AudioStream
		if stream:
			_sting_player.stream = stream
			_sting_player.play()


func play_footstep(surface: String) -> void:
	play_sfx("footstep_%s" % surface)


func play_typewriter_click() -> void:
	play_sfx("typewriter_click")
