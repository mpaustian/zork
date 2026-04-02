extends Node
## The snarky narrator. Manages all narrator text display with typewriter effect.

signal narration_started(text: String)
signal narration_finished()
signal narration_cleared()

const NARRATOR_DATA_PATH := "res://resources/narrator/narrator_text.json"
const TYPEWRITER_SPEED := 0.03  # Seconds per character
const IDLE_TIMEOUT := 30.0  # Seconds before idle comment

var narrator_data: Dictionary = {}  # key -> text or array of texts
var is_narrating: bool = false
var current_text: String = ""
var _idle_timer: float = 0.0
var _idle_comments_shown: int = 0

# Queue for multiple narrations
var _queue: Array[String] = []


func _ready() -> void:
	_load_narrator_data()


func _process(delta: float) -> void:
	if GameManager.state != GameManager.GameState.PLAYING:
		return
	if not is_narrating:
		_idle_timer += delta
		if _idle_timer >= IDLE_TIMEOUT:
			_show_idle_comment()
			_idle_timer = 0.0


func _load_narrator_data() -> void:
	if not FileAccess.file_exists(NARRATOR_DATA_PATH):
		push_warning("Narrator data file not found: %s" % NARRATOR_DATA_PATH)
		return
	var file := FileAccess.open(NARRATOR_DATA_PATH, FileAccess.READ)
	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	if err != OK:
		push_error("Failed to parse narrator data: %s" % json.get_error_message())
		return
	narrator_data = json.data


func narrate(key: String, context: Dictionary = {}) -> void:
	var text := _get_text(key)
	if text.is_empty():
		return
	# Simple template substitution
	for k in context:
		text = text.replace("{%s}" % k, str(context[k]))
	narrate_raw(text)


func narrate_raw(text: String) -> void:
	_idle_timer = 0.0
	if is_narrating:
		_queue.append(text)
		return
	current_text = text
	is_narrating = true
	narration_started.emit(text)


func finish_narration() -> void:
	is_narrating = false
	narration_finished.emit()
	if not _queue.is_empty():
		var next_text := _queue.pop_front() as String
		narrate_raw(next_text)


func clear() -> void:
	is_narrating = false
	current_text = ""
	_queue.clear()
	narration_cleared.emit()


func narrate_room_enter(room_id: String, first_visit: bool) -> void:
	var key := "room_%s_first" % room_id if first_visit else "room_%s" % room_id
	# Fall back to generic if specific key doesn't exist
	if key not in narrator_data and not first_visit:
		key = "room_%s_first" % room_id
	narrate(key)


func narrate_look(target_id: String) -> void:
	var key := "look_%s" % target_id
	if key in narrator_data:
		narrate(key)
	else:
		narrate_raw("You see nothing special about that.")


func narrate_use_fail(item_id: String, target_id: String) -> void:
	var key := "use_%s_on_%s" % [item_id, target_id]
	if key in narrator_data:
		narrate(key)
	else:
		narrate_raw("That doesn't seem to work.")


func narrate_death(death_type: String) -> void:
	var key := "death_%s" % death_type
	narrate(key)


func _get_text(key: String) -> String:
	if key not in narrator_data:
		return ""
	var entry: Variant = narrator_data[key]
	if entry is String:
		return entry
	if entry is Array and not entry.is_empty():
		return entry[randi() % entry.size()]
	return ""


func _show_idle_comment() -> void:
	var idle_keys := []
	for key in narrator_data:
		if key.begins_with("idle_"):
			idle_keys.append(key)
	if idle_keys.is_empty():
		return
	var key: String = idle_keys[randi() % idle_keys.size()]
	narrate(key)
	_idle_comments_shown += 1


func get_save_data() -> Dictionary:
	return {
		"idle_comments_shown": _idle_comments_shown,
	}


func load_save_data(data: Dictionary) -> void:
	_idle_comments_shown = data.get("idle_comments_shown", 0)
