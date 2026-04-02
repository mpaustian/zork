extends Node
## Central game state manager. Tracks global state, turn count, and score.

signal turn_advanced(turn_number: int)
signal score_changed(new_score: int, max_score: int)
signal rank_changed(new_rank: String)
signal game_over(won: bool)

enum GameState { PLAYING, PAUSED, DEATH_SCENE, COMBAT, MENU }

const MAX_SCORE := 350
const RANKS := {
	0: "Beginner",
	25: "Amateur Adventurer",
	50: "Novice Adventurer",
	100: "Junior Adventurer",
	150: "Seasoned Adventurer",
	200: "Senior Adventurer",
	250: "Expert Adventurer",
	300: "Master Adventurer",
	350: "Greatest Adventurer",
}

var state: GameState = GameState.PLAYING
var turn_count: int = 0
var score: int = 0
var current_rank: String = "Beginner"
var treasures_placed: Array[String] = []
var flags: Dictionary = {}  # General-purpose game flags for puzzle state


func _ready() -> void:
	pass


func advance_turn() -> void:
	if state != GameState.PLAYING:
		return
	turn_count += 1
	turn_advanced.emit(turn_count)


func add_score(points: int, _reason: String = "") -> void:
	var old_score := score
	score = mini(score + points, MAX_SCORE)
	if score != old_score:
		score_changed.emit(score, MAX_SCORE)
		_check_rank()
	if score >= MAX_SCORE:
		game_over.emit(true)


func place_treasure(treasure_id: String, points: int) -> void:
	if treasure_id not in treasures_placed:
		treasures_placed.append(treasure_id)
		add_score(points, "Placed %s in trophy case" % treasure_id)


func set_flag(flag_name: String, value: Variant = true) -> void:
	flags[flag_name] = value


func get_flag(flag_name: String, default: Variant = false) -> Variant:
	return flags.get(flag_name, default)


func _check_rank() -> void:
	var new_rank := "Beginner"
	for threshold in RANKS:
		if score >= threshold:
			new_rank = RANKS[threshold]
	if new_rank != current_rank:
		current_rank = new_rank
		rank_changed.emit(new_rank)


func get_save_data() -> Dictionary:
	return {
		"turn_count": turn_count,
		"score": score,
		"treasures_placed": treasures_placed.duplicate(),
		"flags": flags.duplicate(true),
	}


func load_save_data(data: Dictionary) -> void:
	turn_count = data.get("turn_count", 0)
	score = data.get("score", 0)
	treasures_placed.assign(data.get("treasures_placed", []))
	flags = data.get("flags", {})
	_check_rank()
	score_changed.emit(score, MAX_SCORE)
