extends CanvasLayer
## Automap - shows explored rooms as a connected node graph.

const ROOM_SIZE := Vector2(8, 6)
const ROOM_SPACING := Vector2(24, 20)
const MAP_OFFSET := Vector2(320, 180)  # Center of screen
const LINE_COLOR := Color(0.5, 0.45, 0.35, 0.6)
const ROOM_COLOR := Color(0.6, 0.55, 0.4, 0.8)
const CURRENT_COLOR := Color(0.9, 0.8, 0.3, 1.0)
const UNVISITED_COLOR := Color(0.3, 0.28, 0.25, 0.4)
const BG_COLOR := Color(0.08, 0.06, 0.04, 0.92)
const TEXT_COLOR := Color(0.7, 0.65, 0.55)

var _is_open := false
var _room_positions: Dictionary = {}  # room_id -> Vector2 (grid position)
var _draw_node: Control = null

# Manual layout grid positions for rooms (col, row)
# Above ground is top, underground goes down
var _layout: Dictionary = {
	# Above ground
	"hilltop": Vector2(-3, -4),
	"cliff_edge": Vector2(-3, -3),
	"canyon_view": Vector2(-2, -3),
	"overgrown_path": Vector2(-3, -2),
	"forest_path": Vector2(-1, -3),
	"forest_north": Vector2(0, -3),
	"up_a_tree": Vector2(1, -3),
	"forest_clearing_2": Vector2(1, -2),
	"forest_west": Vector2(-1, -2),
	"clearing": Vector2(-1, -1),
	"stone_barrow": Vector2(-2, -1),
	"north_of_house": Vector2(0, -2),
	"west_of_house": Vector2(0, -1),
	"south_of_house": Vector2(0, 0),
	"east_of_house": Vector2(1, -1),
	"behind_house_garden": Vector2(1, 0),
	"forest_south": Vector2(0, 1),
	# House
	"kitchen": Vector2(2, -1),
	"living_room": Vector2(3, -1),
	"attic": Vector2(2, -2),
	# Underground - level 1
	"cellar": Vector2(3, 0),
	"dark_passage": Vector2(3, 1),
	"troll_room": Vector2(3, 2),
	# Maze
	"maze_entrance": Vector2(4, 2),
	"maze_2": Vector2(4, 1),
	"maze_3": Vector2(5, 2),
	"maze_4": Vector2(4, 3),
	"maze_5": Vector2(5, 3),
	"maze_6": Vector2(5, 4),
	"maze_dead_end": Vector2(4, 4),
	"maze_dead_end_2": Vector2(3, 3),
	# Round room area
	"round_room": Vector2(6, 2),
	"cyclops_room": Vector2(6, 1),
	"treasure_room": Vector2(7, 1),
	"strange_passage": Vector2(7, 0),
	# Underground deeper
	"narrow_passage": Vector2(7, 2),
	"deep_canyon": Vector2(8, 2),
	"loud_room": Vector2(6, 3),
	"damp_cave": Vector2(6, 4),
	"engravings_cave": Vector2(8, 3),
	"dome_room": Vector2(8, 4),
	"torch_room": Vector2(7, 4),
	"winding_passage": Vector2(9, 2),
	"underground_river": Vector2(9, 3),
	"mine_tunnel": Vector2(9, 4),
	# Coal mine
	"coal_mine_entrance": Vector2(8, 5),
	"shaft_room": Vector2(8, 6),
	"timber_room": Vector2(8, 7),
	"drafty_room": Vector2(9, 7),
	"gas_room": Vector2(9, 8),
	"machine_room": Vector2(10, 8),
	# Temple area
	"temple": Vector2(5, 5),
	"crypt": Vector2(4, 5),
	"egyptian_room": Vector2(6, 5),
	"altar": Vector2(5, 6),
	"hades_entrance": Vector2(4, 6),
	"land_of_dead": Vector2(4, 7),
	# Dam area
	"dam": Vector2(10, 1),
	"dam_lobby": Vector2(10, 2),
	"maintenance_room": Vector2(11, 2),
	"dam_base": Vector2(11, 1),
	"reservoir_north": Vector2(10, 0),
	"reservoir_south": Vector2(10, -1),
	# Canyon path
	"rocky_ledge": Vector2(-2, -2),
	"canyon_bottom": Vector2(-2, 0),
	# River
	"stream_view": Vector2(9, 0),
	"river_bank": Vector2(9, -1),
	"aragain_falls": Vector2(9, -2),
	"rainbow_room": Vector2(8, -2),
	"end_of_rainbow": Vector2(8, -3),
	"frigid_river_1": Vector2(10, -1),
	"frigid_river_2": Vector2(10, -2),
	"frigid_river_3": Vector2(10, -3),
	"frigid_river_4": Vector2(10, -4),
	"sandy_beach": Vector2(11, -4),
	"shore_cave": Vector2(11, -3),
	# Mirror rooms
	"mirror_room_north": Vector2(6, 0),
	"mirror_room_south": Vector2(6, -1),
	"gallery": Vector2(5, -1),
	"studio": Vector2(5, -2),
}


func _ready() -> void:
	layer = 40
	visible = false

	# Create a background
	var bg := ColorRect.new()
	bg.color = BG_COLOR
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(bg)

	# Create draw surface
	_draw_node = Control.new()
	_draw_node.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_draw_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_draw_node.draw.connect(_on_draw)
	add_child(_draw_node)

	# Title
	var title := Label.new()
	title.text = "MAP  (press M to close)"
	title.position = Vector2(230, 4)
	title.add_theme_font_size_override("font_size", 12)
	title.add_theme_color_override("font_color", TEXT_COLOR)
	title.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(title)


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("toggle_map"):
		toggle()
		get_viewport().set_input_as_handled()


func toggle() -> void:
	if _is_open:
		close_map()
	else:
		open_map()


func open_map() -> void:
	_is_open = true
	visible = true
	GameManager.state = GameManager.GameState.PAUSED
	if _draw_node:
		_draw_node.queue_redraw()


func close_map() -> void:
	_is_open = false
	visible = false
	if GameManager.state == GameManager.GameState.PAUSED:
		GameManager.state = GameManager.GameState.PLAYING


func _on_draw() -> void:
	if not _draw_node:
		return

	var visited: Array = RoomManager.visited_rooms
	var current: String = RoomManager.current_room_id

	# Calculate center offset to keep current room roughly centered
	var current_pos: Vector2 = _layout.get(current, Vector2.ZERO)
	var offset: Vector2 = MAP_OFFSET - current_pos * ROOM_SPACING

	# Draw connections first (behind rooms)
	for room_id in visited:
		if room_id not in _layout:
			continue
		var pos: Vector2 = _layout[room_id] * ROOM_SPACING + offset
		var info: Dictionary = RoomManager.get_room_info(room_id)
		var exits: Dictionary = info.get("exits", {})
		for dir in exits:
			var target_id: String = ""
			var exit_val: Variant = exits[dir]
			if exit_val is String:
				target_id = exit_val
			elif exit_val is Dictionary:
				target_id = exit_val.get("target", "")
			if target_id.is_empty() or target_id not in _layout:
				continue
			# Only draw if target has been visited
			if target_id in visited:
				var target_pos: Vector2 = _layout[target_id] * ROOM_SPACING + offset
				var from: Vector2 = pos + ROOM_SIZE / 2
				var to: Vector2 = target_pos + ROOM_SIZE / 2
				_draw_node.draw_line(from, to, LINE_COLOR, 1.0)

	# Draw rooms
	for room_id in visited:
		if room_id not in _layout:
			continue
		var pos: Vector2 = _layout[room_id] * ROOM_SPACING + offset
		var color: Color = CURRENT_COLOR if room_id == current else ROOM_COLOR
		_draw_node.draw_rect(Rect2(pos, ROOM_SIZE), color)

	# Draw room name for current room
	if current in _layout:
		var pos: Vector2 = _layout[current] * ROOM_SPACING + offset
		var room_info: Dictionary = RoomManager.get_room_info(current)
		var room_name: String = room_info.get("name", current)
		_draw_node.draw_string(
			ThemeDB.fallback_font,
			pos + Vector2(ROOM_SIZE.x / 2 - 30, ROOM_SIZE.y + 12),
			room_name,
			HORIZONTAL_ALIGNMENT_CENTER,
			80,
			9,
			TEXT_COLOR
		)
