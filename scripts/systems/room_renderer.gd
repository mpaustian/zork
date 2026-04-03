extends Node
class_name RoomRenderer
## Renders room backgrounds using tileset sprites instead of solid ColorRects.
## Replaces the placeholder colored backgrounds with composed tile art.

const TILE_SIZE := 16
const ROOM_TILES_X := 40  # 640 / 16
const ROOM_TILES_Y := 23  # 368 / 16 (a bit taller than 360 to cover fully)

# Tileset image paths
const TILESET_DUNGEON := "res://assets/tilesets/tiny_dungeon.png"
const TILESET_TOWN := "res://assets/tilesets/tiny_town.png"
const TILESET_CAVES := "res://assets/tilesets/roguelike_caves.png"
const TILESET_RPG := "res://assets/tilesets/roguelike_rpg.png"

# Tile coordinates in the tiny_dungeon.png spritesheet (12 cols x 11 rows, 16x16 each)
# Format: Vector2i(col, row) in the spritesheet
enum DungeonTile {
	FLOOR_BROWN = 0,
	FLOOR_GRAY = 1,
	FLOOR_DARK = 2,
	WALL_TOP = 3,
	WALL_MID = 4,
	WALL_SIDE_L = 5,
	WALL_SIDE_R = 6,
}

# Tile coordinates in the tiny_town.png spritesheet
enum TownTile {
	GRASS_1 = 0,
	GRASS_2 = 1,
	DIRT_1 = 2,
	DIRT_2 = 3,
	TREE_TOP = 4,
	TREE_BOTTOM = 5,
}

# Area type determines which tileset and pattern to use
enum AreaType {
	FOREST,
	HOUSE_EXTERIOR,
	HOUSE_INTERIOR,
	UNDERGROUND,
	CAVE,
	MINE,
	TEMPLE,
	DAM,
	RIVER,
	HADES,
}

# Map room_id prefixes/names to area types
static func get_area_type(room_id: String) -> AreaType:
	# Above ground
	if room_id in ["west_of_house", "north_of_house", "south_of_house", "east_of_house", "behind_house_garden"]:
		return AreaType.HOUSE_EXTERIOR
	if room_id.begins_with("forest") or room_id in ["clearing", "forest_clearing_2", "overgrown_path", "hilltop", "up_a_tree", "stone_barrow"]:
		return AreaType.FOREST
	if room_id in ["cliff_edge", "canyon_view", "rocky_ledge", "canyon_bottom"]:
		return AreaType.FOREST  # Reuse forest for canyon
	if room_id in ["kitchen", "living_room", "attic"]:
		return AreaType.HOUSE_INTERIOR
	# Dam area
	if room_id.begins_with("dam") or room_id == "maintenance_room" or room_id.begins_with("reservoir"):
		return AreaType.DAM
	# River
	if room_id.begins_with("frigid") or room_id in ["stream_view", "river_bank", "aragain_falls", "rainbow_room", "end_of_rainbow", "sandy_beach", "shore_cave", "underground_river"]:
		return AreaType.RIVER
	# Temple/Hades
	if room_id in ["temple", "egyptian_room", "altar", "crypt"]:
		return AreaType.TEMPLE
	if room_id in ["hades_entrance", "land_of_dead"]:
		return AreaType.HADES
	# Mine
	if room_id.begins_with("coal") or room_id in ["shaft_room", "timber_room", "drafty_room", "gas_room", "machine_room", "mine_tunnel"]:
		return AreaType.MINE
	# Caves
	if room_id in ["damp_cave", "shore_cave"]:
		return AreaType.CAVE
	# Default underground
	return AreaType.UNDERGROUND


## Build room background as a Node2D with Sprite2D children
static func create_room_background(room_id: String) -> Node2D:
	var root := Node2D.new()
	root.name = "TiledBackground"
	root.z_index = -10  # Behind everything

	var area: AreaType = get_area_type(room_id)

	# Load the appropriate tileset texture
	var tileset_path: String = _get_tileset_path(area)
	var texture: Texture2D = load(tileset_path)
	if not texture:
		return root

	# Get tile regions for this area type
	var floor_regions: Array[Rect2] = _get_floor_regions(area)
	var wall_regions: Array[Rect2] = _get_wall_regions(area)
	var detail_regions: Array[Rect2] = _get_detail_regions(area)

	if floor_regions.is_empty():
		return root

	# Fill the floor
	for y in ROOM_TILES_Y:
		for x in ROOM_TILES_X:
			var sprite := Sprite2D.new()
			sprite.texture = texture
			sprite.region_enabled = true
			sprite.centered = false
			sprite.position = Vector2(x * TILE_SIZE, y * TILE_SIZE)

			# Determine which tile to place
			if y < 3 and not wall_regions.is_empty():
				# Top wall area
				sprite.region_rect = wall_regions[randi() % wall_regions.size()]
			elif y >= ROOM_TILES_Y - 1 and not wall_regions.is_empty():
				# Bottom edge
				sprite.region_rect = wall_regions[randi() % wall_regions.size()]
			else:
				# Floor with slight variation
				sprite.region_rect = floor_regions[randi() % floor_regions.size()]

			root.add_child(sprite)

	# Apply area-specific color tint
	var tint: Color = _get_area_tint(area)
	root.modulate = tint

	# Add scattered detail sprites
	if not detail_regions.is_empty():
		var detail_count: int = randi_range(3, 8)
		for i in detail_count:
			var sprite := Sprite2D.new()
			sprite.texture = texture
			sprite.region_enabled = true
			sprite.centered = false
			sprite.position = Vector2(
				randi_range(2, ROOM_TILES_X - 3) * TILE_SIZE,
				randi_range(4, ROOM_TILES_Y - 3) * TILE_SIZE
			)
			sprite.region_rect = detail_regions[randi() % detail_regions.size()]
			sprite.z_index = -9
			root.add_child(sprite)

	return root


static func _get_area_tint(area: AreaType) -> Color:
	match area:
		AreaType.FOREST:
			return Color(0.95, 1.0, 0.9)  # Slight green
		AreaType.HOUSE_EXTERIOR:
			return Color(1.0, 0.98, 0.9)  # Warm
		AreaType.HOUSE_INTERIOR:
			return Color(1.0, 0.92, 0.8)  # Warm indoor
		AreaType.UNDERGROUND:
			return Color(0.8, 0.82, 0.9)  # Cool blue-gray
		AreaType.CAVE:
			return Color(0.7, 0.75, 0.85) # Cooler
		AreaType.MINE:
			return Color(0.65, 0.6, 0.55) # Dark brown
		AreaType.TEMPLE:
			return Color(0.9, 0.85, 0.7)  # Warm gold
		AreaType.DAM:
			return Color(0.8, 0.82, 0.85) # Industrial gray
		AreaType.RIVER:
			return Color(0.85, 0.9, 1.0)  # Blue tint
		AreaType.HADES:
			return Color(0.5, 0.7, 0.5)   # Sickly green
		_:
			return Color.WHITE


static func _get_tileset_path(area: AreaType) -> String:
	match area:
		AreaType.FOREST, AreaType.HOUSE_EXTERIOR:
			return TILESET_TOWN
		AreaType.HOUSE_INTERIOR:
			return TILESET_DUNGEON
		AreaType.CAVE, AreaType.MINE:
			return TILESET_CAVES
		AreaType.RIVER:
			return TILESET_TOWN
		_:
			return TILESET_DUNGEON


## Floor tile regions from the spritesheets
## Each Rect2 is (x, y, 16, 16) in the spritesheet
## Tiny Town: 192x176, 12 cols x 11 rows
##   Row 0: grass(0-1), grass+flower(2-3), tree tops(4-8), autumn(9-11)
##   Row 1: grass border, dirt, more trees
##   Row 2-3: road tiles, rooftops
##   Row 4-5: building walls, brick, stone
##   Row 6-7: doors, windows, interiors
## Tiny Dungeon: 192x176, 12 cols x 11 rows
##   Row 0: brown stone wall top
##   Row 1: brown stone wall mid
##   Row 2: brown floor, door, details
##   Row 3: gray stone wall top
##   Row 4: gray stone wall mid, items
##   Row 5: gray floor, furniture

static func _get_floor_regions(area: AreaType) -> Array[Rect2]:
	match area:
		AreaType.FOREST, AreaType.HOUSE_EXTERIOR:
			# Tiny Town row 0: grass tiles
			return [
				Rect2(0, 0, 16, 16),     # plain grass
				Rect2(16, 0, 16, 16),    # grass 2
				Rect2(0, 0, 16, 16),     # plain grass (weighted)
				Rect2(32, 0, 16, 16),    # grass with flower
			]
		AreaType.HOUSE_INTERIOR:
			# Tiny Dungeon row 2: brown floor
			return [
				Rect2(0, 32, 16, 16),
				Rect2(16, 32, 16, 16),
				Rect2(32, 32, 16, 16),
			]
		AreaType.UNDERGROUND:
			# Tiny Dungeon row 5: gray stone floor
			return [
				Rect2(0, 80, 16, 16),
				Rect2(16, 80, 16, 16),
				Rect2(32, 80, 16, 16),
			]
		AreaType.TEMPLE:
			# Tiny Dungeon: mix of brown and gray floor for temple feel
			return [
				Rect2(0, 32, 16, 16),
				Rect2(16, 32, 16, 16),
				Rect2(48, 32, 16, 16),
			]
		AreaType.CAVE, AreaType.MINE:
			# Tiny Dungeon: dark stone floor
			return [
				Rect2(0, 80, 16, 16),
				Rect2(16, 80, 16, 16),
			]
		AreaType.DAM:
			# Tiny Dungeon: gray floor (industrial)
			return [
				Rect2(0, 80, 16, 16),
				Rect2(16, 80, 16, 16),
				Rect2(32, 80, 16, 16),
			]
		AreaType.RIVER:
			# Tiny Town: grass near water
			return [
				Rect2(0, 0, 16, 16),
				Rect2(16, 0, 16, 16),
				Rect2(0, 16, 16, 16),
			]
		AreaType.HADES:
			# Tiny Dungeon: darkest floor
			return [
				Rect2(0, 80, 16, 16),
				Rect2(16, 80, 16, 16),
			]
		_:
			return [Rect2(0, 0, 16, 16)]


static func _get_wall_regions(area: AreaType) -> Array[Rect2]:
	match area:
		AreaType.FOREST, AreaType.HOUSE_EXTERIOR:
			# Tiny Town: tree tops for top edge
			return [
				Rect2(64, 0, 16, 16),    # green tree top
				Rect2(80, 0, 16, 16),    # tree variant
				Rect2(96, 0, 16, 16),    # tree variant
				Rect2(112, 0, 16, 16),   # autumn tree
			]
		AreaType.UNDERGROUND, AreaType.TEMPLE:
			# Tiny Dungeon row 3-4: gray stone walls
			return [
				Rect2(0, 48, 16, 16),
				Rect2(16, 48, 16, 16),
				Rect2(32, 48, 16, 16),
			]
		AreaType.HADES:
			# Tiny Dungeon: dark walls
			return [
				Rect2(0, 48, 16, 16),
				Rect2(16, 48, 16, 16),
			]
		AreaType.HOUSE_INTERIOR:
			# Tiny Dungeon row 0-1: brown walls
			return [
				Rect2(0, 0, 16, 16),
				Rect2(16, 0, 16, 16),
				Rect2(32, 0, 16, 16),
			]
		AreaType.CAVE, AreaType.MINE:
			# Tiny Dungeon: rough walls
			return [
				Rect2(0, 48, 16, 16),
				Rect2(16, 48, 16, 16),
			]
		AreaType.DAM:
			# Tiny Dungeon: gray walls (industrial)
			return [
				Rect2(0, 48, 16, 16),
				Rect2(16, 48, 16, 16),
				Rect2(32, 48, 16, 16),
			]
		AreaType.RIVER:
			return [
				Rect2(64, 0, 16, 16),
				Rect2(80, 0, 16, 16),
			]
		_:
			return []


static func _get_detail_regions(area: AreaType) -> Array[Rect2]:
	match area:
		AreaType.FOREST, AreaType.HOUSE_EXTERIOR:
			# Tiny Town: flowers, mushroom, rocks
			return [
				Rect2(48, 0, 16, 16),    # small bush/flower
				Rect2(32, 0, 16, 16),    # grass with flower
				Rect2(144, 0, 16, 16),   # autumn detail
			]
		AreaType.UNDERGROUND, AreaType.TEMPLE:
			# Tiny Dungeon: small objects on floor
			return [
				Rect2(80, 80, 16, 16),
				Rect2(96, 80, 16, 16),
			]
		AreaType.CAVE, AreaType.MINE:
			# Tiny Dungeon: debris
			return [
				Rect2(80, 80, 16, 16),
			]
		AreaType.HADES:
			return [
				Rect2(80, 80, 16, 16),
			]
		_:
			return []
